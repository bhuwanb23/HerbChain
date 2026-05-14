"""Recognition routes — placeholder, replaced fully in p5e_ai_hybrid."""
from flask import Blueprint

from utils.responses import ok

recognition_bp = Blueprint("recognition", __name__, url_prefix="/api/v1/recognition")


@recognition_bp.get("/")
def info():
    return ok({"endpoints": {"rerank": "POST /api/v1/recognition/herbs"}})
