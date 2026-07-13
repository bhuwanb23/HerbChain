"""
Batch transfer state machine.

A "transfer" is the atomic operation that happens when an authenticated user
scans the current QR of a batch. It:

    1. Verifies the QR signature (HMAC, via qr_service).
    2. Confirms the scanned token matches `BatchState.current_qr_token`
       (so dead/old QRs that leaked are rejected).
    3. Looks up the allowed transition for (current_phase, scanner_role).
    4. Atomically:
         - Updates BatchState (new holder, new phase, mints new QR token)
         - Appends a BatchEvent of type TRANSFER
    5. Returns the new QR token to the new holder.

The transition table is the single source of truth for the workflow:

    (current_phase, scanner_role) -> next_phase

Anything not in the table is rejected with TransferError. Some transitions
have additional guards (e.g. transporter can only pick up from `at_lab` once
the test_result is `approved`).
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError

from models import db
from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.users import User
from services import qr_service


class TransferError(ValueError):
    """Raised when a scan does not result in a valid state transition."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


# (from_phase, scanner_role) -> to_phase
TRANSITIONS: dict[tuple[str, str], str] = {
    ("with_farmer", "transporter"): "in_transit_to_lab",
    ("in_transit_to_lab", "lab"): "at_lab",
    ("at_lab", "transporter"): "in_transit_to_manufacturer",
    ("in_transit_to_manufacturer", "manufacturer"): "with_manufacturer",
}

# Phases for which any transfer attempt should be rejected outright.
TERMINAL_PHASES = {"consumed"}


@dataclass(frozen=True)
class TransferResult:
    batch_id: str
    from_phase: str
    to_phase: str
    from_party_id: Optional[str]
    to_party_id: str
    new_qr_token: str
    event_id: str
    occurred_at: datetime


# --------------------------------------------------------------------- helpers


def _new_event_id() -> str:
    return f"EVT-{uuid.uuid4().hex[:12].upper()}"


def _new_batch_id() -> str:
    return f"HERB-{uuid.uuid4().hex[:8].upper()}"


# -------------------------------------------------------------- batch creation


def create_batch(
    farmer: User,
    species_name: str,
    harvest_date,
    location: str,
    weight_kg,
    image_url: Optional[str] = None,
    gps_lat: Optional[float] = None,
    gps_lng: Optional[float] = None,
    notes: Optional[str] = None,
) -> tuple[Herb, BatchState, BatchEvent, str]:
    """Register a new herb batch (farmer action). Mints the initial QR."""
    if farmer.role != "farmer":
        raise TransferError("forbidden", "Only farmers can create herb batches")
    if not species_name or not location:
        raise TransferError("bad_request", "species_name and location are required")
    if weight_kg is None or float(weight_kg) <= 0:
        raise TransferError("bad_request", "weight_kg must be a positive number")
    if harvest_date is None:
        raise TransferError("bad_request", "harvest_date is required")

    batch_id = _new_batch_id()

    herb = Herb(
        batch_id=batch_id,
        farmer_id=farmer.user_id,
        species_name=species_name,
        image_url=image_url,
        harvest_date=harvest_date,
        location=location,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        weight_kg=weight_kg,
        notes=notes,
    )
    db.session.add(herb)

    # Mint initial QR
    token = qr_service.issue_batch_qr(
        batch_id=batch_id,
        holder_id=farmer.user_id,
        phase="with_farmer",
    )

    state = BatchState(
        batch_id=batch_id,
        current_holder_id=farmer.user_id,
        phase="with_farmer",
        test_result="pending",
        current_qr_token=token,
    )
    db.session.add(state)

    event = BatchEvent(
        event_id=_new_event_id(),
        batch_id=batch_id,
        event_type="CREATED",
        actor_id=farmer.user_id,
        from_party_id=None,
        to_party_id=farmer.user_id,
        phase_before=None,
        phase_after="with_farmer",
        location=location,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        payload_json={
            "species_name": species_name,
            "weight_kg": float(weight_kg),
        },
        qr_token=token,
    )
    db.session.add(event)

    try:
        db.session.commit()
    except SQLAlchemyError as exc:
        db.session.rollback()
        raise TransferError("internal_error", f"Failed to create batch: {exc}") from exc

    return herb, state, event, token


# ------------------------------------------------------------------ transfers


def transfer_by_scan(
    *,
    batch_id: str,
    scanner: User,
    scanned_qr_token: str,
    location: Optional[str] = None,
    gps_lat: Optional[float] = None,
    gps_lng: Optional[float] = None,
    notes: Optional[str] = None,
) -> TransferResult:
    """
    Atomically transfer ownership of `batch_id` to `scanner`.

    The scanner is the *receiving* party and must be authenticated. They
    present the current holder's QR token. On success, a new QR is minted for
    the scanner.
    """
    if not batch_id:
        raise TransferError("bad_request", "batch_id is required")
    if not scanner or not scanner.user_id:
        raise TransferError("unauthorized", "Scanner identity is required")
    if not scanned_qr_token:
        raise TransferError("bad_request", "scanned_qr_token is required")

    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if state is None:
        raise TransferError("not_found", f"Batch '{batch_id}' not found")

    if state.phase in TERMINAL_PHASES:
        raise TransferError(
            "invalid_state",
            f"Batch is in terminal phase '{state.phase}' and cannot be transferred",
        )

    # 1) Cryptographic check: the scanned token must verify against our key
    try:
        claims = qr_service.verify_batch_qr(
            scanned_qr_token, expected_batch_id=batch_id
        )
    except qr_service.QrError as exc:
        raise TransferError("invalid_qr", str(exc)) from exc

    # 2) Replay/staleness check: scanned token must equal the current active one
    if not state.current_qr_token or state.current_qr_token != scanned_qr_token:
        raise TransferError(
            "stale_qr",
            "This QR is no longer the active one for this batch",
        )

    if claims.holder_id != state.current_holder_id:
        raise TransferError(
            "qr_state_mismatch",
            "QR holder does not match the current batch holder",
        )

    # 3) Cannot transfer to yourself
    if scanner.user_id == state.current_holder_id:
        raise TransferError(
            "self_transfer",
            "You already hold this batch",
        )

    # 4) State machine: is this (phase, role) allowed?
    transition_key = (state.phase, scanner.role)
    next_phase = TRANSITIONS.get(transition_key)
    if next_phase is None:
        raise TransferError(
            "invalid_transition",
            f"A '{scanner.role}' cannot receive a batch that is currently '{state.phase}'",
        )

    # 5) Extra guards
    if state.phase == "at_lab" and state.test_result != "approved":
        raise TransferError(
            "not_approved",
            "Lab has not approved this batch yet (test_result is "
            f"'{state.test_result}')",
        )

    # 6) Apply the transition
    from_party_id = state.current_holder_id
    from_phase = state.phase

    new_token = qr_service.issue_batch_qr(
        batch_id=batch_id,
        holder_id=scanner.user_id,
        phase=next_phase,
    )

    state.current_holder_id = scanner.user_id
    state.phase = next_phase
    state.current_qr_token = new_token
    state.updated_at = datetime.utcnow()

    event = BatchEvent(
        event_id=_new_event_id(),
        batch_id=batch_id,
        event_type="TRANSFER",
        actor_id=scanner.user_id,
        from_party_id=from_party_id,
        to_party_id=scanner.user_id,
        phase_before=from_phase,
        phase_after=next_phase,
        location=location,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        payload_json={"notes": notes} if notes else None,
        qr_token=scanned_qr_token,
    )
    db.session.add(event)

    try:
        db.session.commit()
    except SQLAlchemyError as exc:
        db.session.rollback()
        raise TransferError("internal_error", f"Failed to commit transfer: {exc}") from exc

    return TransferResult(
        batch_id=batch_id,
        from_phase=from_phase,
        to_phase=next_phase,
        from_party_id=from_party_id,
        to_party_id=scanner.user_id,
        new_qr_token=new_token,
        event_id=event.event_id,
        occurred_at=event.created_at,
    )


# ---------------------------------------------------------------- batch split


@dataclass(frozen=True)
class SplitChild:
    batch_id: str
    weight_kg: float
    qr_token: str
    note: Optional[str]


@dataclass(frozen=True)
class SplitResult:
    parent_batch_id: str
    parent_remaining_kg: float
    parent_consumed: bool
    children: list[SplitChild]


def split_batch(
    *,
    parent_batch_id: str,
    actor: User,
    splits: list[dict],
) -> SplitResult:
    """
    Split a parent batch into N child batches.

    Rules:
      - actor must be the parent's current holder.
      - actor must be the parent's original farmer (only farmers split).
      - parent must be in phase ``with_farmer`` (or ``with_farmer_after_lab``).
      - sum of children kg must not exceed parent kg.
      - if remaining == 0, parent is marked ``consumed`` (terminal) and its QR
        is cleared.

    Each `splits` entry is ``{ "weight_kg": float, "note"?: str }``.
    """
    from decimal import Decimal

    if not parent_batch_id:
        raise TransferError("bad_request", "parent_batch_id is required")
    if not splits or not isinstance(splits, list):
        raise TransferError("bad_request", "splits must be a non-empty list")

    parent_herb = Herb.query.filter_by(batch_id=parent_batch_id).first()
    parent_state = BatchState.query.filter_by(batch_id=parent_batch_id).first()
    if parent_herb is None or parent_state is None:
        raise TransferError("not_found", f"Batch '{parent_batch_id}' not found")

    if actor.role != "farmer":
        raise TransferError("forbidden", "Only farmers can split batches")
    if parent_herb.farmer_id != actor.user_id:
        raise TransferError(
            "forbidden",
            "Only the original farmer can split this batch",
        )
    if parent_state.current_holder_id != actor.user_id:
        raise TransferError(
            "forbidden",
            "You must currently hold the batch to split it",
        )
    if parent_state.phase not in {"with_farmer", "with_farmer_after_lab"}:
        raise TransferError(
            "invalid_state",
            f"Cannot split a batch in phase '{parent_state.phase}'",
        )

    total = Decimal("0")
    cleaned: list[dict] = []
    for idx, item in enumerate(splits):
        try:
            kg = Decimal(str(item.get("weight_kg")))
        except Exception as exc:
            raise TransferError("bad_request", f"splits[{idx}].weight_kg invalid") from exc
        if kg <= 0:
            raise TransferError("bad_request", f"splits[{idx}].weight_kg must be > 0")
        total += kg
        cleaned.append({"weight_kg": kg, "note": item.get("note")})

    parent_kg = Decimal(str(parent_herb.weight_kg or "0"))
    if total > parent_kg:
        raise TransferError(
            "bad_request",
            f"Sum of split weights ({total}) exceeds parent batch weight ({parent_kg})",
        )

    remaining = parent_kg - total
    children: list[SplitChild] = []
    children_event_payload: list[dict] = []

    for item in cleaned:
        child_id = _new_batch_id()
        child_herb = Herb(
            batch_id=child_id,
            farmer_id=actor.user_id,
            species_id=parent_herb.species_id,
            species_name=parent_herb.species_name,
            image_url=parent_herb.image_url,
            harvest_date=parent_herb.harvest_date,
            location=parent_herb.location,
            gps_lat=parent_herb.gps_lat,
            gps_lng=parent_herb.gps_lng,
            weight_kg=item["weight_kg"],
            notes=item.get("note"),
            parent_batch_id=parent_batch_id,
        )
        db.session.add(child_herb)

        token = qr_service.issue_batch_qr(
            batch_id=child_id,
            holder_id=actor.user_id,
            phase="with_farmer",
        )
        child_state = BatchState(
            batch_id=child_id,
            current_holder_id=actor.user_id,
            phase="with_farmer",
            test_result="pending",
            current_qr_token=token,
        )
        db.session.add(child_state)

        child_create_event = BatchEvent(
            event_id=_new_event_id(),
            batch_id=child_id,
            event_type="CREATED",
            actor_id=actor.user_id,
            from_party_id=None,
            to_party_id=actor.user_id,
            phase_before=None,
            phase_after="with_farmer",
            location=parent_herb.location,
            gps_lat=parent_herb.gps_lat,
            gps_lng=parent_herb.gps_lng,
            payload_json={
                "parent_batch_id": parent_batch_id,
                "species_name": parent_herb.species_name,
                "weight_kg": float(item["weight_kg"]),
                "note": item.get("note"),
            },
            qr_token=token,
        )
        db.session.add(child_create_event)

        children.append(
            SplitChild(
                batch_id=child_id,
                weight_kg=float(item["weight_kg"]),
                qr_token=token,
                note=item.get("note"),
            )
        )
        children_event_payload.append(
            {
                "child_batch_id": child_id,
                "weight_kg": float(item["weight_kg"]),
                "note": item.get("note"),
            }
        )

    parent_consumed = remaining == 0
    if parent_consumed:
        parent_state.phase = "consumed"
        parent_state.current_qr_token = ""
    parent_state.updated_at = datetime.utcnow()

    parent_split_event = BatchEvent(
        event_id=_new_event_id(),
        batch_id=parent_batch_id,
        event_type="BATCH_SPLIT",
        actor_id=actor.user_id,
        from_party_id=actor.user_id,
        to_party_id=actor.user_id,
        phase_before=parent_state.phase if not parent_consumed else "with_farmer",
        phase_after=parent_state.phase,
        location=parent_herb.location,
        gps_lat=parent_herb.gps_lat,
        gps_lng=parent_herb.gps_lng,
        payload_json={
            "children": children_event_payload,
            "remaining_kg": float(remaining),
            "consumed": parent_consumed,
        },
    )
    db.session.add(parent_split_event)

    try:
        db.session.commit()
    except SQLAlchemyError as exc:
        db.session.rollback()
        raise TransferError("internal_error", f"Failed to split batch: {exc}") from exc

    return SplitResult(
        parent_batch_id=parent_batch_id,
        parent_remaining_kg=float(remaining),
        parent_consumed=parent_consumed,
        children=children,
    )


# ------------------------------------------------------------ intent records


def record_lab_request(lab: User, batch_id: str) -> BatchEvent:
    """Lab expresses intent to test a batch (logged but doesn't move state)."""
    if lab.role != "lab":
        raise TransferError("forbidden", "Only labs can request testing")
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if state is None:
        raise TransferError("not_found", f"Batch '{batch_id}' not found")

    event = BatchEvent(
        event_id=_new_event_id(),
        batch_id=batch_id,
        event_type="INTENT_LAB_REQUEST",
        actor_id=lab.user_id,
        from_party_id=None,
        to_party_id=lab.user_id,
        phase_before=state.phase,
        phase_after=state.phase,
        payload_json={"requested_at": datetime.utcnow().isoformat()},
    )
    db.session.add(event)
    db.session.commit()
    return event


def record_manufacturer_order(
    manufacturer: User, batch_id: str
) -> BatchEvent:
    """Manufacturer expresses intent to order a batch (logged only)."""
    if manufacturer.role != "manufacturer":
        raise TransferError("forbidden", "Only manufacturers can place orders")
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if state is None:
        raise TransferError("not_found", f"Batch '{batch_id}' not found")
    if state.test_result != "approved":
        raise TransferError(
            "not_approved",
            "Cannot order a batch that is not approved by the lab",
        )

    event = BatchEvent(
        event_id=_new_event_id(),
        batch_id=batch_id,
        event_type="INTENT_MANUFACTURER_ORDER",
        actor_id=manufacturer.user_id,
        from_party_id=None,
        to_party_id=manufacturer.user_id,
        phase_before=state.phase,
        phase_after=state.phase,
        payload_json={"ordered_at": datetime.utcnow().isoformat()},
    )
    db.session.add(event)
    db.session.commit()
    return event
