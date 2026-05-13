"""
Product routes — manufacturers create finished goods that link source batches.

Filled in during Phase 1e.
"""
from flask import Blueprint, jsonify

products_bp = Blueprint("products", __name__, url_prefix="/api/v1/products")


@products_bp.get("/")
def _info():
    return jsonify(
        {
            "data": {
                "endpoints": {
                    "create": "POST /api/v1/products",
                    "list_mine": "GET /api/v1/products/mine",
                    "get": "GET /api/v1/products/<product_id>",
                    "qr": "GET /api/v1/products/<product_id>/qr",
                }
            },
            "error": None,
        }
    )
