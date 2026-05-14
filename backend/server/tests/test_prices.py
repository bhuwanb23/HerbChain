"""Tests for /api/v1/prices."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.px@test.local"),
        "admin": register("admin", "a.px@test.local"),
    }


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def _seed_species(client, admin_token, species_id="tulsi"):
    return client.post(
        "/api/v1/catalogue",
        json={"species_id": species_id, "common_name": "Tulsi", "scientific_name": "Ocimum sanctum"},
        headers=_hdr(admin_token),
    )


def test_admin_creates_and_lists_prices(client, actors):
    admin = actors["admin"][0]
    _seed_species(client, admin)

    r = client.post(
        "/api/v1/prices",
        json={"species_id": "tulsi", "price_per_kg_inr": 180.0, "source": "demo"},
        headers=_hdr(admin),
    )
    assert r.status_code == 201, r.get_json()

    r2 = client.get("/api/v1/prices", headers=_hdr(actors["farmer"][0]))
    assert r2.status_code == 200
    rows = r2.get_json()["data"]["prices"]
    assert any(x["species_id"] == "tulsi" and x["price_per_kg_inr"] == 180.0 for x in rows)


def test_latest_price_wins(client, actors):
    admin = actors["admin"][0]
    _seed_species(client, admin)
    for price in (100.0, 220.0, 175.0):
        r = client.post(
            "/api/v1/prices",
            json={"species_id": "tulsi", "price_per_kg_inr": price},
            headers=_hdr(admin),
        )
        assert r.status_code == 201

    r2 = client.get("/api/v1/prices/tulsi", headers=_hdr(admin))
    assert r2.status_code == 200
    history = r2.get_json()["data"]["history"]
    assert len(history) == 3


def test_farmer_cannot_post_price(client, actors):
    _seed_species(client, actors["admin"][0])
    r = client.post(
        "/api/v1/prices",
        json={"species_id": "tulsi", "price_per_kg_inr": 1.0},
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 403


def test_unknown_species_rejected(client, actors):
    r = client.post(
        "/api/v1/prices",
        json={"species_id": "nope", "price_per_kg_inr": 1.0},
        headers=_hdr(actors["admin"][0]),
    )
    assert r.status_code == 404
