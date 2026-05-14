"""Farm profile routes — placeholder, replaced fully in p5c_farm_profile."""
from flask import Blueprint

from utils.responses import ok

farm_bp = Blueprint("farm", __name__, url_prefix="/api/v1/farm")


@farm_bp.get("/")
def info():
    return ok({"endpoints": {"me": "GET/PUT /api/v1/farm/me"}})
