"""
Product routes — manufacturer finished goods.

Creating a product:
    - The manufacturer must currently hold each source batch.
    - Each source batch becomes `phase=consumed` (terminal).
    - A product QR token is minted (consumer-readable forever).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from flask import Blueprint, g, request
from marshmallow import ValidationError

from models import db
from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.products import Product, ProductBatchLink
from schemas.products import CreateProductSchema
from services import qr_service
from utils.auth import require_auth, require_role
from utils.responses import error, ok

products_bp = Blueprint("products", __name__, url_prefix="/api/v1/products")


@products_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "create": "POST /api/v1/products",
                "list_mine": "GET /api/v1/products/mine",
                "get": "GET /api/v1/products/<product_id>",
                "qr": "GET /api/v1/products/<product_id>/qr",
            }
        }
    )


@products_bp.post("")
@products_bp.post("/")
@require_role("manufacturer")
def create():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreateProductSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid product data", 400, extra=exc.messages)

    manufacturer = g.current_user
    batches = data["source_batches"]

    # Pre-validate every source batch upfront so we don't half-commit.
    states_to_consume: list[tuple[BatchState, float]] = []
    seen_ids = set()
    for link in batches:
        batch_id = link["batch_id"]
        if batch_id in seen_ids:
            return error("bad_request", f"Duplicate batch '{batch_id}' in source list", 400)
        seen_ids.add(batch_id)

        state = BatchState.query.filter_by(batch_id=batch_id).first()
        if state is None:
            return error("not_found", f"Batch '{batch_id}' not found", 404)
        if state.current_holder_id != manufacturer.user_id:
            return error(
                "forbidden",
                f"You don't currently hold batch '{batch_id}'",
                403,
            )
        if state.phase != "with_manufacturer":
            return error(
                "invalid_state",
                f"Batch '{batch_id}' must be in phase 'with_manufacturer' (got '{state.phase}')",
                409,
            )
        states_to_consume.append((state, float(link["quantity_kg"])))

    product_id = f"PROD-{uuid.uuid4().hex[:10].upper()}"
    product = Product(
        product_id=product_id,
        manufacturer_id=manufacturer.user_id,
        name=data["name"],
        sku=data.get("sku"),
        description=data.get("description"),
        image_url=data.get("image_url"),
    )
    db.session.add(product)
    db.session.flush()

    # Mint product QR
    product.qr_token = qr_service.issue_product_qr(product_id)

    # Link each batch + mark consumed + append PRODUCT_LINK event
    for state, qty in states_to_consume:
        db.session.add(
            ProductBatchLink(
                product_id=product_id,
                batch_id=state.batch_id,
                quantity_kg=qty,
            )
        )
        previous_phase = state.phase
        state.phase = "consumed"
        state.current_qr_token = ""  # batch QR is dead; product QR replaces it
        state.updated_at = datetime.utcnow()
        db.session.add(
            BatchEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
                batch_id=state.batch_id,
                event_type="PRODUCT_LINK",
                actor_id=manufacturer.user_id,
                from_party_id=manufacturer.user_id,
                to_party_id=manufacturer.user_id,
                phase_before=previous_phase,
                phase_after="consumed",
                payload_json={
                    "product_id": product_id,
                    "quantity_kg": qty,
                },
            )
        )

    db.session.commit()

    return ok(
        {
            "product": product.to_dict(include_links=True),
            "qr_token": product.qr_token,
            "qr_png": qr_service.render_png_data_url(product.qr_token),
        },
        201,
    )


@products_bp.get("/mine")
@require_role("manufacturer")
def list_mine():
    rows = (
        Product.query.filter_by(manufacturer_id=g.current_user.user_id)
        .order_by(Product.created_at.desc())
        .all()
    )
    return ok(
        {
            "products": [p.to_dict(include_links=True) for p in rows],
            "total": len(rows),
        }
    )


@products_bp.get("/<product_id>")
@require_auth
def get_one(product_id: str):
    p = Product.query.filter_by(product_id=product_id).first()
    if p is None:
        return error("not_found", f"Product '{product_id}' not found", 404)
    return ok({"product": p.to_dict(include_links=True)})


@products_bp.get("/<product_id>/qr")
@require_role("manufacturer", "admin")
def get_qr(product_id: str):
    p = Product.query.filter_by(product_id=product_id).first()
    if p is None:
        return error("not_found", f"Product '{product_id}' not found", 404)
    if p.manufacturer_id != g.current_user.user_id and g.current_user.role != "admin":
        return error("forbidden", "Only the product's manufacturer can fetch this QR", 403)
    return ok(
        {
            "product_id": product_id,
            "qr_token": p.qr_token,
            "qr_png": qr_service.render_png_data_url(p.qr_token),
        }
    )
