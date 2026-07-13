"""
Weather routes.

Endpoint:
    GET /api/v1/weather?lat=&lng=    auth required
"""
from __future__ import annotations

from flask import Blueprint, request

from services.weather_service import get_weather
from utils.auth import require_auth
from utils.responses import error, ok

weather_bp = Blueprint("weather", __name__, url_prefix="/api/v1/weather")


@weather_bp.get("/")
@weather_bp.get("")
@require_auth
def get_for_location():
    try:
        lat = float(request.args.get("lat", ""))
        lng = float(request.args.get("lng", ""))
    except (TypeError, ValueError):
        return error("validation_error", "lat and lng query params required (floats)", 400)
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return error("validation_error", "lat/lng out of range", 400)

    res = get_weather(lat, lng)
    return ok(
        {
            "weather": res.payload,
            "cached": res.cached,
            "provider": res.provider,
        }
    )
