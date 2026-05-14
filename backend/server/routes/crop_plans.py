"""Crop plan routes — placeholder, replaced fully in p5d_crop_calendar."""
from flask import Blueprint

from utils.responses import ok

crop_plans_bp = Blueprint("crop_plans", __name__, url_prefix="/api/v1/crop-plans")


@crop_plans_bp.get("/")
def info():
    return ok({"endpoints": {"list_create": "GET/POST /api/v1/crop-plans"}})
