"""
Herb catalogue routes.

Public read (any authenticated user can browse the catalogue), admin write.

Endpoints:
    GET    /api/v1/catalogue                 list + filter species
    GET    /api/v1/catalogue/<species_id>    one entry (with latest price)
    POST   /api/v1/catalogue                 admin: create
    PUT    /api/v1/catalogue/<species_id>    admin: update
    DELETE /api/v1/catalogue/<species_id>    admin: soft-delete (is_active=False)
"""
from __future__ import annotations

import re
import uuid

from flask import Blueprint, request
from marshmallow import ValidationError

from models import db
from models.herb_catalogue import HerbCatalogue
from schemas.catalogue import CreateCatalogueEntrySchema, UpdateCatalogueEntrySchema
from utils.auth import require_auth, require_role
from utils.responses import error, ok

catalogue_bp = Blueprint("catalogue", __name__, url_prefix="/api/v1/catalogue")


def _slugify(text: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", text.strip()).strip("-").lower()
    return s or "species"


@catalogue_bp.get("/")
@catalogue_bp.get("")
def list_species():
    """Open list of catalogue entries. Supports `?q=` and `?category=`."""
    q = (request.args.get("q") or "").strip().lower()
    category = request.args.get("category")
    include_inactive = request.args.get("include_inactive") == "1"

    query = HerbCatalogue.query
    if not include_inactive:
        query = query.filter_by(is_active=True)
    if category:
        query = query.filter_by(ayush_category=category)
    rows = query.order_by(HerbCatalogue.common_name.asc()).all()

    if q:
        def matches(row: HerbCatalogue) -> bool:
            haystack = " ".join(
                filter(
                    None,
                    [
                        row.common_name or "",
                        row.scientific_name or "",
                        " ".join(row.synonyms or []),
                    ],
                )
            ).lower()
            return q in haystack

        rows = [r for r in rows if matches(r)]

    return ok(
        {
            "species": [r.to_dict() for r in rows],
            "total": len(rows),
        }
    )


@catalogue_bp.get("/<species_id>")
def get_one(species_id: str):
    row = HerbCatalogue.query.filter_by(species_id=species_id).first()
    if row is None:
        return error("not_found", f"Species '{species_id}' not found", 404)
    return ok({"species": row.to_dict(include_prices=True)})


@catalogue_bp.post("/")
@catalogue_bp.post("")
@require_role("admin")
def create_species():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreateCatalogueEntrySchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid catalogue entry", 400, extra=exc.messages)

    species_id = data.get("species_id") or f"SPC-{_slugify(data['common_name'])}"
    if HerbCatalogue.query.filter_by(species_id=species_id).first() is not None:
        return error("conflict", f"Species '{species_id}' already exists", 409)

    row = HerbCatalogue(
        species_id=species_id,
        common_name=data["common_name"],
        scientific_name=data["scientific_name"],
        ayush_category=data["ayush_category"],
        synonyms=data["synonyms"] or [],
        description=data["description"],
        medicinal_uses=data["medicinal_uses"],
        image_url=data["image_url"],
        season_planting=data["season_planting"],
        season_harvest=data["season_harvest"],
        default_unit_price_inr=data["default_unit_price_inr"],
        is_active=True,
    )
    db.session.add(row)
    db.session.commit()
    return ok({"species": row.to_dict()}, 201)


@catalogue_bp.put("/<species_id>")
@require_role("admin")
def update_species(species_id: str):
    row = HerbCatalogue.query.filter_by(species_id=species_id).first()
    if row is None:
        return error("not_found", f"Species '{species_id}' not found", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = UpdateCatalogueEntrySchema().load(payload, partial=True)
    except ValidationError as exc:
        return error("validation_error", "Invalid catalogue entry", 400, extra=exc.messages)

    for field, value in data.items():
        setattr(row, field, value)
    db.session.commit()
    return ok({"species": row.to_dict()})


@catalogue_bp.delete("/<species_id>")
@require_role("admin")
def deactivate_species(species_id: str):
    row = HerbCatalogue.query.filter_by(species_id=species_id).first()
    if row is None:
        return error("not_found", f"Species '{species_id}' not found", 404)
    row.is_active = False
    db.session.commit()
    return ok({"species": row.to_dict()})
