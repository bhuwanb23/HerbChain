"""Prices routes — placeholder, replaced fully in p5h_prices."""
from flask import Blueprint

from utils.responses import ok

prices_bp = Blueprint("prices", __name__, url_prefix="/api/v1/prices")


@prices_bp.get("/")
def info():
    return ok({"endpoints": {"list": "GET /api/v1/prices"}})
