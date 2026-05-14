"""
Batch (Herb) routes.

Endpoints:
    POST   /api/v1/batches                          create batch (farmer)
    GET    /api/v1/batches/mine                     list my held/created batches
    GET    /api/v1/batches/<batch_id>               batch + state + holder info
    GET    /api/v1/batches/<batch_id>/qr            QR PNG (current holder only)
    POST   /api/v1/batches/<batch_id>/transfer      scan-based transfer
    GET    /api/v1/batches/available/for-lab        batches awaiting any lab
    GET    /api/v1/batches/available/for-manufacturer  approved batches awaiting any manufacturer
"""
from __future__ import annotations

from flask import Blueprint, g, request
from marshmallow import ValidationError

from models import db
from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.users import User
from schemas.batches import CreateBatchSchema, TransferSchema
from services import qr_service
from services.transfer_service import (
    TransferError,
    create_batch,
    record_lab_request,
    record_manufacturer_order,
    split_batch,
    transfer_by_scan,
)
from utils.auth import require_auth, require_role
from utils.responses import error, ok

batches_bp = Blueprint("batches", __name__, url_prefix="/api/v1/batches")


# --------------------------------------------------------------- helper


def _batch_payload(batch_id: str) -> dict | None:
    herb = Herb.query.filter_by(batch_id=batch_id).first()
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if herb is None or state is None:
        return None
    holder = User.query.filter_by(user_id=state.current_holder_id).first()
    farmer = User.query.filter_by(user_id=herb.farmer_id).first()
    return {
        "herb": herb.to_dict(),
        "state": state.to_dict(),
        "current_holder": holder.to_dict(include_email=False) if holder else None,
        "farmer": farmer.to_dict(include_email=False) if farmer else None,
    }


def _handle_transfer_error(exc: TransferError):
    status_map = {
        "not_found": 404,
        "forbidden": 403,
        "bad_request": 400,
        "unauthorized": 401,
        "invalid_qr": 400,
        "stale_qr": 409,
        "qr_state_mismatch": 409,
        "invalid_transition": 409,
        "not_approved": 409,
        "self_transfer": 409,
        "invalid_state": 409,
        "internal_error": 500,
    }
    return error(exc.code, exc.message, status_map.get(exc.code, 400))


# ----------------------------------------------------------------- info


@batches_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "create": "POST /api/v1/batches",
                "list_mine": "GET /api/v1/batches/mine",
                "get": "GET /api/v1/batches/<batch_id>",
                "qr": "GET /api/v1/batches/<batch_id>/qr",
                "transfer": "POST /api/v1/batches/<batch_id>/transfer",
                "available_for_lab": "GET /api/v1/batches/available/for-lab",
                "available_for_manufacturer": "GET /api/v1/batches/available/for-manufacturer",
                "request_testing": "POST /api/v1/batches/<batch_id>/request-testing",
                "place_order": "POST /api/v1/batches/<batch_id>/order",
            }
        }
    )


# ------------------------------------------------------------- POST /


@batches_bp.post("")
@batches_bp.post("/")
@require_role("farmer")
def create():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreateBatchSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid batch data", 400, extra=exc.messages)

    try:
        herb, state, _event, token = create_batch(
            farmer=g.current_user,
            species_name=data["species_name"],
            harvest_date=data["harvest_date"],
            location=data["location"],
            weight_kg=data["weight_kg"],
            image_url=data.get("image_url"),
            gps_lat=data.get("gps_lat"),
            gps_lng=data.get("gps_lng"),
            notes=data.get("notes"),
        )
    except TransferError as exc:
        return _handle_transfer_error(exc)

    return ok(
        {
            "herb": herb.to_dict(),
            "state": state.to_dict(),
            "qr_token": token,
            "qr_png": qr_service.render_png_data_url(token),
        },
        201,
    )


# ------------------------------------------------------ GET /mine


@batches_bp.get("/mine")
@require_auth
def list_mine():
    user = g.current_user
    # Held by me right now
    held_states = BatchState.query.filter_by(current_holder_id=user.user_id).all()
    held_batch_ids = [s.batch_id for s in held_states]

    # If farmer, also include the batches they originally created
    if user.role == "farmer":
        created_herbs = Herb.query.filter_by(farmer_id=user.user_id).all()
        created_ids = {h.batch_id for h in created_herbs}
    else:
        created_ids = set()

    all_ids = list(set(held_batch_ids) | created_ids)
    items = [p for p in (_batch_payload(bid) for bid in all_ids) if p is not None]
    items.sort(
        key=lambda p: p["state"].get("updated_at") or "",
        reverse=True,
    )
    return ok({"batches": items, "total": len(items)})


# -------------------------------------------------- GET /<batch_id>


@batches_bp.get("/<batch_id>")
@require_auth
def get_one(batch_id: str):
    payload = _batch_payload(batch_id)
    if payload is None:
        return error("not_found", f"Batch '{batch_id}' not found", 404)
    return ok(payload)


# ----------------------------------------------- GET /<batch_id>/qr


@batches_bp.get("/<batch_id>/qr")
@require_auth
def get_qr(batch_id: str):
    """
    Returns the active QR token + PNG. Only the current holder can fetch this.
    For farmers, also returns the QR if they're the farmer who created the
    batch (handy for displaying after registration).
    """
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if state is None:
        return error("not_found", f"Batch '{batch_id}' not found", 404)

    user = g.current_user
    is_holder = state.current_holder_id == user.user_id
    herb = Herb.query.filter_by(batch_id=batch_id).first()
    is_farmer_of_record = user.role == "farmer" and herb is not None and herb.farmer_id == user.user_id

    if not (is_holder or is_farmer_of_record):
        return error("forbidden", "Only the current holder can fetch this QR", 403)
    if not state.current_qr_token:
        return error("not_available", "This batch has no active QR", 410)

    return ok(
        {
            "batch_id": batch_id,
            "phase": state.phase,
            "current_holder_id": state.current_holder_id,
            "qr_token": state.current_qr_token,
            "qr_png": qr_service.render_png_data_url(state.current_qr_token),
        }
    )


# -------------------------------------------- POST /<batch_id>/transfer


@batches_bp.post("/<batch_id>/transfer")
@require_role("transporter", "lab", "manufacturer")
def transfer(batch_id: str):
    payload = request.get_json(silent=True) or {}
    try:
        data = TransferSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid transfer data", 400, extra=exc.messages)

    try:
        result = transfer_by_scan(
            batch_id=batch_id,
            scanner=g.current_user,
            scanned_qr_token=data["scanned_qr_token"],
            location=data.get("location"),
            gps_lat=data.get("gps_lat"),
            gps_lng=data.get("gps_lng"),
            notes=data.get("notes"),
        )
    except TransferError as exc:
        return _handle_transfer_error(exc)

    return ok(
        {
            "transfer": {
                "batch_id": result.batch_id,
                "from_phase": result.from_phase,
                "to_phase": result.to_phase,
                "from_party_id": result.from_party_id,
                "to_party_id": result.to_party_id,
                "occurred_at": result.occurred_at.isoformat(),
                "event_id": result.event_id,
            },
            "new_qr_token": result.new_qr_token,
            "new_qr_png": qr_service.render_png_data_url(result.new_qr_token),
        }
    )


# --------------------- discovery endpoints (read-only feed)


@batches_bp.get("/available/for-lab")
@require_role("lab", "admin")
def available_for_lab():
    """Batches that a transporter has delivered (or is en route with) for any lab."""
    states = (
        BatchState.query.filter(BatchState.phase.in_(["with_farmer", "in_transit_to_lab", "at_lab"]))
        .all()
    )
    items = [
        p for p in (_batch_payload(s.batch_id) for s in states) if p is not None
    ]
    return ok({"batches": items, "total": len(items)})


@batches_bp.get("/available/for-manufacturer")
@require_role("manufacturer", "admin")
def available_for_manufacturer():
    """Approved batches ready for manufacturer orders / pickup."""
    states = (
        BatchState.query.filter(
            BatchState.test_result == "approved",
            BatchState.phase.in_(["at_lab", "in_transit_to_manufacturer", "with_manufacturer"]),
        )
        .all()
    )
    items = [
        p for p in (_batch_payload(s.batch_id) for s in states) if p is not None
    ]
    return ok({"batches": items, "total": len(items)})


# ---------------- intent endpoints (logged-only, no state change)


@batches_bp.post("/<batch_id>/request-testing")
@require_role("lab")
def request_testing(batch_id: str):
    try:
        event = record_lab_request(g.current_user, batch_id)
    except TransferError as exc:
        return _handle_transfer_error(exc)
    return ok({"event": event.to_dict()}, 201)


@batches_bp.post("/<batch_id>/order")
@require_role("manufacturer")
def order_batch(batch_id: str):
    try:
        event = record_manufacturer_order(g.current_user, batch_id)
    except TransferError as exc:
        return _handle_transfer_error(exc)
    return ok({"event": event.to_dict()}, 201)


# ---------------- batch split (farmer-only) ------------------------

@batches_bp.post("/<batch_id>/split")
@require_role("farmer")
def split(batch_id: str):
    payload = request.get_json(silent=True) or {}
    splits = payload.get("splits")
    if not isinstance(splits, list) or not splits:
        return error("validation_error", "splits must be a non-empty list", 400)

    # Normalize the payload before handing off to the service.
    normalized: list[dict] = []
    for item in splits:
        if not isinstance(item, dict):
            return error("validation_error", "Each split must be an object", 400)
        try:
            kg = float(item.get("weight_kg"))
        except (TypeError, ValueError):
            return error("validation_error", "split weight_kg must be numeric", 400)
        normalized.append({"weight_kg": kg, "note": item.get("note")})

    try:
        result = split_batch(
            parent_batch_id=batch_id,
            actor=g.current_user,
            splits=normalized,
        )
    except TransferError as exc:
        return _handle_transfer_error(exc)

    return ok(
        {
            "parent_batch_id": result.parent_batch_id,
            "parent_remaining_kg": result.parent_remaining_kg,
            "parent_consumed": result.parent_consumed,
            "children": [
                {
                    "batch_id": c.batch_id,
                    "weight_kg": c.weight_kg,
                    "qr_token": c.qr_token,
                    "qr_png": qr_service.render_png_data_url(c.qr_token),
                    "note": c.note,
                }
                for c in result.children
            ],
        },
        201,
    )


# ---------------- batch events feed (per-batch audit log) -----------


@batches_bp.get("/<batch_id>/events")
@require_auth
def events(batch_id: str):
    rows = (
        BatchEvent.query.filter_by(batch_id=batch_id)
        .order_by(BatchEvent.created_at.asc())
        .all()
    )
    return ok({"events": [e.to_dict(expand_parties=True) for e in rows], "total": len(rows)})
