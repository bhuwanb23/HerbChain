"""
Traceability routes — public, read-only consumer-facing journey lookup.

Filled in during Phase 1e.
"""
from flask import Blueprint, jsonify

traceability_bp = Blueprint("traceability", __name__, url_prefix="/api/v1/traceability")


@traceability_bp.get("/")
def _info():
    return jsonify(
        {
            "data": {
                "endpoints": {
                    "batch_journey": "GET /api/v1/traceability/batch/<batch_id>",
                    "product_journey": "GET /api/v1/traceability/product/<product_id>",
                }
            },
            "error": None,
        }
    )
