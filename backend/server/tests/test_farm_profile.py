"""Tests for /api/v1/farm/me."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.fp@test.local"),
        "transporter": register("transporter", "t.fp@test.local"),
    }


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def test_farmer_starts_with_no_profile(client, actors):
    r = client.get("/api/v1/farm/me", headers=_hdr(actors["farmer"][0]))
    assert r.status_code == 200
    assert r.get_json()["data"]["farm"] is None


def test_farmer_can_upsert_and_read_back(client, actors):
    token = actors["farmer"][0]
    r = client.put(
        "/api/v1/farm/me",
        json={
            "farm_name": "Demo",
            "land_size_acres": 3.0,
            "soil_type": "loamy",
            "irrigation_type": "drip",
            "certifications": ["organic"],
            "address": "Pune",
            "gps_lat": 18.5,
            "gps_lng": 73.8,
        },
        headers=_hdr(token),
    )
    assert r.status_code == 200, r.get_json()
    farm = r.get_json()["data"]["farm"]
    assert farm["farm_name"] == "Demo"
    assert farm["soil_type"] == "loamy"

    r2 = client.get("/api/v1/farm/me", headers=_hdr(token))
    assert r2.get_json()["data"]["farm"]["land_size_acres"] == 3.0


def test_non_farmer_cannot_use_farm_endpoint(client, actors):
    r = client.get("/api/v1/farm/me", headers=_hdr(actors["transporter"][0]))
    assert r.status_code == 403


def test_invalid_soil_type_rejected(client, actors):
    r = client.put(
        "/api/v1/farm/me",
        json={"soil_type": "moondust"},
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 400
