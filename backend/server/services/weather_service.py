"""
Weather service.

Tries OpenWeatherMap (`OPENWEATHER_API_KEY` env var). Falls back to a
deterministic stub when no key is configured so the demo works offline.

Lat/lng are rounded to 2dp (~1 km) and cached in `WeatherSnapshot` for
~1 hour to stay under the free tier and to keep the demo fast.
"""
from __future__ import annotations

import math
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

import requests

from models import db
from models.weather_snapshots import WeatherSnapshot


_CACHE_TTL = timedelta(hours=1)
_OWM_URL = "https://api.openweathermap.org/data/2.5/weather"
_OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


@dataclass
class WeatherResult:
    payload: dict
    cached: bool
    provider: str


def _round(lat: float, lng: float) -> tuple[float, float]:
    return round(lat, 2), round(lng, 2)


def _stub_payload(lat: float, lng: float) -> dict:
    """Deterministic, lat/lng-dependent stub so demos look believable."""
    # Use lat/lng to seed a temperature, so different farms get different values.
    seed = abs(math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453)
    base_temp = 20 + (seed % 14)
    humidity = 40 + int((seed * 7) % 50)
    conditions = ["Clear", "Clouds", "Light rain", "Haze", "Thunderstorm"]
    cond = conditions[int(seed * 11) % len(conditions)]
    now = datetime.utcnow()
    forecast = []
    for i in range(3):
        t = base_temp + ((i - 1) * 2.3)
        forecast.append(
            {
                "date": (now + timedelta(days=i + 1)).date().isoformat(),
                "min": round(t - 3, 1),
                "max": round(t + 4, 1),
                "condition": conditions[int((seed + i * 3) % len(conditions))],
                "humidity": humidity + i * 2,
            }
        )
    return {
        "source": "stub",
        "current": {
            "temp_c": round(base_temp, 1),
            "condition": cond,
            "humidity": humidity,
            "wind_kmh": round(5 + (seed % 18), 1),
        },
        "forecast": forecast,
        "location": {"lat": lat, "lng": lng},
        "advisory": _advisory(base_temp, humidity, cond),
    }


def _advisory(temp_c: float, humidity: int, condition: str) -> str:
    if "rain" in condition.lower() or "thunder" in condition.lower():
        return "Postpone outdoor spraying; rain expected."
    if temp_c > 32 and humidity < 35:
        return "Hot and dry — irrigate young plants this evening."
    if humidity > 80 and temp_c > 24:
        return "High humidity — watch for fungal diseases on leaves."
    return "Conditions are favourable for routine field work."


def _from_openweathermap(lat: float, lng: float, api_key: str) -> dict | None:
    try:
        cur = requests.get(
            _OWM_URL,
            params={"lat": lat, "lon": lng, "appid": api_key, "units": "metric"},
            timeout=8,
        )
        fc = requests.get(
            _OWM_FORECAST_URL,
            params={"lat": lat, "lon": lng, "appid": api_key, "units": "metric"},
            timeout=8,
        )
        if cur.status_code != 200 or fc.status_code != 200:
            return None
        cur_data = cur.json()
        fc_data = fc.json()
        condition = (cur_data.get("weather") or [{}])[0].get("main", "Clear")
        humidity = (cur_data.get("main") or {}).get("humidity", 0)
        temp = (cur_data.get("main") or {}).get("temp", 0)

        forecast = []
        seen_dates = set()
        for slot in fc_data.get("list", []):
            day = slot.get("dt_txt", "")[:10]
            if not day or day in seen_dates:
                continue
            seen_dates.add(day)
            main = slot.get("main") or {}
            forecast.append(
                {
                    "date": day,
                    "min": main.get("temp_min"),
                    "max": main.get("temp_max"),
                    "condition": (slot.get("weather") or [{}])[0].get("main"),
                    "humidity": main.get("humidity"),
                }
            )
            if len(forecast) >= 3:
                break

        return {
            "source": "openweathermap",
            "current": {
                "temp_c": temp,
                "condition": condition,
                "humidity": humidity,
                "wind_kmh": round((cur_data.get("wind") or {}).get("speed", 0) * 3.6, 1),
            },
            "forecast": forecast,
            "location": {
                "lat": lat,
                "lng": lng,
                "name": cur_data.get("name"),
            },
            "advisory": _advisory(temp, humidity, condition),
        }
    except Exception:
        return None


def get_weather(lat: float, lng: float) -> WeatherResult:
    r_lat, r_lng = _round(lat, lng)
    cutoff = datetime.utcnow() - _CACHE_TTL
    cached = (
        WeatherSnapshot.query.filter(
            WeatherSnapshot.gps_lat == r_lat,
            WeatherSnapshot.gps_lng == r_lng,
            WeatherSnapshot.fetched_at >= cutoff,
        )
        .order_by(WeatherSnapshot.fetched_at.desc())
        .first()
    )
    if cached is not None:
        return WeatherResult(payload=cached.payload_json, cached=True, provider=cached.provider)

    api_key = os.environ.get("OPENWEATHER_API_KEY")
    payload = _from_openweathermap(r_lat, r_lng, api_key) if api_key else None
    provider = "openweathermap" if payload else "stub"
    if payload is None:
        payload = _stub_payload(r_lat, r_lng)

    snap = WeatherSnapshot(
        snapshot_id=f"WX-{uuid.uuid4().hex[:8].upper()}",
        gps_lat=r_lat,
        gps_lng=r_lng,
        provider=provider,
        payload_json=payload,
    )
    db.session.add(snap)
    db.session.commit()
    return WeatherResult(payload=payload, cached=False, provider=provider)
