"""Weather routes — placeholder, replaced fully in p5f_weather."""
from flask import Blueprint

from utils.responses import ok

weather_bp = Blueprint("weather", __name__, url_prefix="/api/v1/weather")


@weather_bp.get("/")
def info():
    return ok({"endpoints": {"get": "GET /api/v1/weather?lat=&lng="}})
