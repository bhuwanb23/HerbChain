"""
Crop plan routes.

Endpoints (all farmer-only on their own rows):
    GET    /api/v1/crop-plans               list mine
    POST   /api/v1/crop-plans               create
    GET    /api/v1/crop-plans/<plan_id>     read one
    PUT    /api/v1/crop-plans/<plan_id>     update
    DELETE /api/v1/crop-plans/<plan_id>     delete
"""
from __future__ import annotations

import uuid

from flask import Blueprint, g, request
from marshmallow import ValidationError

from models import db
from models.crop_plans import CropPlan
from models.herb_catalogue import HerbCatalogue
from schemas.crop_plans import CreateCropPlanSchema, UpdateCropPlanSchema
from utils.auth import require_role
from utils.responses import error, ok

crop_plans_bp = Blueprint("crop_plans", __name__, url_prefix="/api/v1/crop-plans")


def _new_plan_id() -> str:
    return f"PLAN-{uuid.uuid4().hex[:8].upper()}"


def _ensure_species(species_id: str):
    return HerbCatalogue.query.filter_by(species_id=species_id, is_active=True).first()


@crop_plans_bp.get("/")
@crop_plans_bp.get("")
@require_role("farmer")
def list_mine():
    rows = (
        CropPlan.query.filter_by(farmer_id=g.current_user.user_id)
        .order_by(CropPlan.expected_harvest_date.asc())
        .all()
    )
    return ok({"plans": [r.to_dict(include_species=True) for r in rows], "total": len(rows)})


@crop_plans_bp.get("/<plan_id>")
@require_role("farmer")
def get_one(plan_id: str):
    row = CropPlan.query.filter_by(plan_id=plan_id, farmer_id=g.current_user.user_id).first()
    if row is None:
        return error("not_found", f"Plan '{plan_id}' not found", 404)
    return ok({"plan": row.to_dict(include_species=True)})


@crop_plans_bp.post("/")
@crop_plans_bp.post("")
@require_role("farmer")
def create():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreateCropPlanSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid crop plan", 400, extra=exc.messages)

    if _ensure_species(data["species_id"]) is None:
        return error("bad_request", f"species_id '{data['species_id']}' is not in the catalogue", 400)

    row = CropPlan(
        plan_id=_new_plan_id(),
        farmer_id=g.current_user.user_id,
        species_id=data["species_id"],
        area_acres=data.get("area_acres"),
        planting_date=data["planting_date"],
        expected_harvest_date=data["expected_harvest_date"],
        status=data["status"],
        notes=data.get("notes"),
    )
    db.session.add(row)
    db.session.commit()
    return ok({"plan": row.to_dict(include_species=True)}, 201)


@crop_plans_bp.put("/<plan_id>")
@require_role("farmer")
def update(plan_id: str):
    row = CropPlan.query.filter_by(plan_id=plan_id, farmer_id=g.current_user.user_id).first()
    if row is None:
        return error("not_found", f"Plan '{plan_id}' not found", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = UpdateCropPlanSchema().load(payload, partial=True)
    except ValidationError as exc:
        return error("validation_error", "Invalid crop plan", 400, extra=exc.messages)

    if "species_id" in data and _ensure_species(data["species_id"]) is None:
        return error("bad_request", f"species_id '{data['species_id']}' is not in the catalogue", 400)

    for field, value in data.items():
        setattr(row, field, value)
    db.session.commit()
    return ok({"plan": row.to_dict(include_species=True)})


@crop_plans_bp.delete("/<plan_id>")
@require_role("farmer")
def delete_plan(plan_id: str):
    row = CropPlan.query.filter_by(plan_id=plan_id, farmer_id=g.current_user.user_id).first()
    if row is None:
        return error("not_found", f"Plan '{plan_id}' not found", 404)
    db.session.delete(row)
    db.session.commit()
    return ok({"deleted": True})
