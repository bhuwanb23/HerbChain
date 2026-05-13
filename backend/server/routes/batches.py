"""
Batch (Herb) routes — create, list, get, show QR, transfer.

Filled in during Phase 1c (transfer state machine) and Phase 1e (final wiring).
"""
from flask import Blueprint, jsonify

batches_bp = Blueprint("batches", __name__, url_prefix="/api/v1/batches")


@batches_bp.get("/")
def _info():
    return jsonify(
        {
            "data": {
                "endpoints": {
                    "create": "POST /api/v1/batches",
                    "list_mine": "GET /api/v1/batches/mine",
                    "get": "GET /api/v1/batches/<batch_id>",
                    "qr": "GET /api/v1/batches/<batch_id>/qr",
                    "transfer": "POST /api/v1/batches/<batch_id>/transfer",
                    "available_for_lab": "GET /api/v1/batches/available/for-lab",
                    "available_for_manufacturer": "GET /api/v1/batches/available/for-manufacturer",
                }
            },
            "error": None,
        }
    )
