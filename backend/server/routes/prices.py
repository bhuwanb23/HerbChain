"""
Price discovery routes.

Public read (any authenticated user can see prices), admin create:
    GET    /api/v1/prices                       latest price per species
    GET    /api/v1/prices/<species_id>          full history for one species
    POST   /api/v1/prices                       admin: record a new quote
"""
from __future__ import annotations

import uuid

from flask import Blueprint, g, request
from marshmallow import ValidationError
from sqlalchemy import func

from models import db
from models.herb_catalogue import HerbCatalogue, PriceQuote
from schemas.prices import CreatePriceQuoteSchema
from utils.auth import require_auth, require_role
from utils.responses import error, ok

prices_bp = Blueprint("prices", __name__, url_prefix="/api/v1/prices")


def _new_quote_id() -> str:
    return f"PQ-{uuid.uuid4().hex[:8].upper()}"


@prices_bp.get("/")
@prices_bp.get("")
@require_auth
def list_latest():
    """Latest PriceQuote per species, joined to its catalogue metadata."""
    # Subquery: max effective_at per species
    latest = (
        db.session.query(
            PriceQuote.species_id.label("species_id"),
            func.max(PriceQuote.effective_at).label("max_at"),
        )
        .group_by(PriceQuote.species_id)
        .subquery()
    )
    rows = (
        db.session.query(PriceQuote, HerbCatalogue)
        .join(latest, (PriceQuote.species_id == latest.c.species_id) & (PriceQuote.effective_at == latest.c.max_at))
        .join(HerbCatalogue, HerbCatalogue.species_id == PriceQuote.species_id)
        .order_by(HerbCatalogue.common_name.asc())
        .all()
    )

    items = []
    for quote, species in rows:
        items.append(
            {
                "species_id": species.species_id,
                "common_name": species.common_name,
                "scientific_name": species.scientific_name,
                "image_url": species.image_url,
                "price_per_kg_inr": float(quote.price_per_kg_inr)
                if quote.price_per_kg_inr is not None
                else None,
                "currency": quote.currency,
                "source": quote.source,
                "effective_at": quote.effective_at.isoformat() if quote.effective_at else None,
            }
        )
    return ok({"prices": items, "total": len(items)})


@prices_bp.get("/<species_id>")
@require_auth
def history(species_id: str):
    species = HerbCatalogue.query.filter_by(species_id=species_id).first()
    if species is None:
        return error("not_found", f"Species '{species_id}' not found", 404)
    rows = (
        PriceQuote.query.filter_by(species_id=species_id)
        .order_by(PriceQuote.effective_at.desc())
        .all()
    )
    return ok(
        {
            "species": {
                "species_id": species.species_id,
                "common_name": species.common_name,
                "scientific_name": species.scientific_name,
            },
            "history": [r.to_dict() for r in rows],
            "total": len(rows),
        }
    )


@prices_bp.post("/")
@prices_bp.post("")
@require_role("admin")
def create_quote():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreatePriceQuoteSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid quote", 400, extra=exc.messages)

    species = HerbCatalogue.query.filter_by(species_id=data["species_id"]).first()
    if species is None:
        return error("not_found", f"Species '{data['species_id']}' not found", 404)

    quote = PriceQuote(
        quote_id=_new_quote_id(),
        species_id=data["species_id"],
        price_per_kg_inr=data["price_per_kg_inr"],
        currency=data["currency"],
        source=data["source"],
        notes=data.get("notes"),
        created_by_admin_id=g.current_user.user_id,
    )
    db.session.add(quote)

    species.default_unit_price_inr = data["price_per_kg_inr"]

    db.session.commit()
    return ok({"quote": quote.to_dict()}, 201)
