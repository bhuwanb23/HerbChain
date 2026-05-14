"""
Farm profile routes.

Endpoints:
    GET    /api/v1/farm/me        farmer reads their farm
    PUT    /api/v1/farm/me        farmer creates or updates their farm
    DELETE /api/v1/farm/me        farmer clears their farm
"""
from __future__ import annotations

import uuid

from flask import Blueprint, g, request
from marshmallow import ValidationError

from models import db
from models.farm_profile import FarmProfile
from schemas.farm import FarmProfileSchema
from utils.auth import require_role
from utils.responses import error, ok

farm_bp = Blueprint("farm", __name__, url_prefix="/api/v1/farm")


def _new_farm_id() -> str:
    return f"FARM-{uuid.uuid4().hex[:8].upper()}"


@farm_bp.get("/")
def info():
    return ok({"endpoints": {"me": "GET/PUT/DELETE /api/v1/farm/me"}})


@farm_bp.get("/me")
@require_role("farmer")
def get_mine():
    row = FarmProfile.query.filter_by(farmer_id=g.current_user.user_id).first()
    return ok({"farm": row.to_dict() if row else None})


@farm_bp.put("/me")
@require_role("farmer")
def upsert_mine():
    payload = request.get_json(silent=True) or {}
    try:
        data = FarmProfileSchema().load(payload, partial=True)
    except ValidationError as exc:
        return error("validation_error", "Invalid farm profile", 400, extra=exc.messages)

    row = FarmProfile.query.filter_by(farmer_id=g.current_user.user_id).first()
    if row is None:
        row = FarmProfile(
            farm_id=_new_farm_id(),
            farmer_id=g.current_user.user_id,
            certifications=[],
        )
        db.session.add(row)

    for field, value in data.items():
        setattr(row, field, value)
    db.session.commit()
    return ok({"farm": row.to_dict()})


@farm_bp.delete("/me")
@require_role("farmer")
def delete_mine():
    row = FarmProfile.query.filter_by(farmer_id=g.current_user.user_id).first()
    if row is None:
        return error("not_found", "No farm profile to delete", 404)
    db.session.delete(row)
    db.session.commit()
    return ok({"deleted": True})
