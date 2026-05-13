"""
Traceability routes — public, read-only, no auth required.

These power the consumer app's "Scan & see the whole journey" feature.
"""
from __future__ import annotations

from flask import Blueprint, request

from services import qr_service
from services.traceability_service import (
    build_batch_journey,
    build_product_journey,
)
from utils.responses import error, ok

traceability_bp = Blueprint("traceability", __name__, url_prefix="/api/v1/traceability")


@traceability_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "batch_journey": "GET /api/v1/traceability/batch/<batch_id>",
                "product_journey": "GET /api/v1/traceability/product/<product_id>",
                "resolve_qr": "POST /api/v1/traceability/resolve  body={qr_token}",
            }
        }
    )


@traceability_bp.get("/batch/<batch_id>")
def batch_journey(batch_id: str):
    journey = build_batch_journey(batch_id)
    if journey is None:
        return error("not_found", f"No batch '{batch_id}' found", 404)
    return ok(journey)


@traceability_bp.get("/product/<product_id>")
def product_journey(product_id: str):
    journey = build_product_journey(product_id)
    if journey is None:
        return error("not_found", f"No product '{product_id}' found", 404)
    return ok(journey)


@traceability_bp.post("/resolve")
def resolve_qr():
    """
    Given an arbitrary signed QR token, figure out whether it's a batch or
    product token and return the matching journey. The consumer app can call
    this with whatever it scanned without knowing which kind of QR it was.
    """
    data = request.get_json(silent=True) or {}
    token = (data.get("qr_token") or "").strip()
    if not token:
        return error("bad_request", "qr_token is required", 400)

    # Try product first (cheaper claims)
    try:
        product_claims = qr_service.verify_product_qr(token)
        journey = build_product_journey(product_claims.product_id)
        if journey is None:
            return error("not_found", "Product not found", 404)
        return ok({"kind": "product", "journey": journey})
    except qr_service.QrError:
        pass

    try:
        batch_claims = qr_service.verify_batch_qr(token)
        journey = build_batch_journey(batch_claims.batch_id)
        if journey is None:
            return error("not_found", "Batch not found", 404)
        return ok({"kind": "batch", "journey": journey})
    except qr_service.QrError as exc:
        return error("invalid_qr", str(exc), 400)
