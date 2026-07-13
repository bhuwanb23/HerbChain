"""Tests for /api/v1/crop-plans."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.cp@test.local"),
        "admin": register("admin", "a.cp@test.local"),
    }


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def _seed_species(client, admin_token, species_id="tulsi"):
    return client.post(
        "/api/v1/catalogue",
        json={"species_id": species_id, "common_name": "Tulsi", "scientific_name": "Ocimum sanctum"},
        headers=_hdr(admin_token),
    )


def test_farmer_lifecycle(client, actors):
    admin, farmer = actors["admin"][0], actors["farmer"][0]
    _seed_species(client, admin)

    # create
    r = client.post(
        "/api/v1/crop-plans",
        json={
            "species_id": "tulsi",
            "area_acres": 1.0,
            "planting_date": "2026-04-01",
            "expected_harvest_date": "2026-08-01",
        },
        headers=_hdr(farmer),
    )
    assert r.status_code == 201, r.get_json()
    plan_id = r.get_json()["data"]["plan"]["plan_id"]

    # list
    r2 = client.get("/api/v1/crop-plans", headers=_hdr(farmer))
    assert r2.status_code == 200
    assert r2.get_json()["data"]["total"] >= 1

    # update status
    r3 = client.put(
        f"/api/v1/crop-plans/{plan_id}",
        json={"status": "sown"},
        headers=_hdr(farmer),
    )
    assert r3.status_code == 200
    assert r3.get_json()["data"]["plan"]["status"] == "sown"

    # delete
    r4 = client.delete(f"/api/v1/crop-plans/{plan_id}", headers=_hdr(farmer))
    assert r4.status_code == 200


def test_unknown_species_rejected(client, actors):
    r = client.post(
        "/api/v1/crop-plans",
        json={
            "species_id": "does-not-exist",
            "planting_date": "2026-04-01",
            "expected_harvest_date": "2026-08-01",
        },
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 400


def test_non_farmer_blocked(client, actors):
    r = client.get("/api/v1/crop-plans", headers=_hdr(actors["admin"][0]))
    assert r.status_code == 403
