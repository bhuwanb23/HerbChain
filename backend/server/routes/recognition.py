"""
Recognition routes — hybrid AI re-ranker.

Endpoint:
    POST /api/v1/recognition/herbs
        body = {
            candidates: [{label, score}, ...],   # from on-device TFLite
            gps_lat?, gps_lng?, image_url?, top_k?
        }
        returns top-3 ranked AYUSH species with confidence + species_id
"""
from __future__ import annotations

from flask import Blueprint, request
from marshmallow import ValidationError

from schemas.recognition import RerankSchema
from services.recognition_service import rerank
from utils.auth import require_auth
from utils.responses import error, ok

recognition_bp = Blueprint("recognition", __name__, url_prefix="/api/v1/recognition")


@recognition_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "rerank": "POST /api/v1/recognition/herbs",
            }
        }
    )


@recognition_bp.post("/herbs")
@require_auth
def rerank_herbs():
    payload = request.get_json(silent=True) or {}
    try:
        data = RerankSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid candidates", 400, extra=exc.messages)

    results = rerank(data["candidates"], top_k=data.get("top_k", 3))

    return ok(
        {
            "top": [
                {
                    "species_id": r.species_id,
                    "common_name": r.common_name,
                    "scientific_name": r.scientific_name,
                    "image_url": r.image_url,
                    "medicinal_uses": r.medicinal_uses,
                    "confidence": r.confidence,
                    "matched_via": r.matched_via,
                }
                for r in results
            ],
            "total": len(results),
        }
    )
