"""Tests for /api/v1/catalogue."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.cat@test.local"),
        "admin": register("admin", "a.cat@test.local"),
    }


def _hdr(token):
    return {"Authorization": f"Bearer {token}"}


def test_admin_creates_and_lists_species(client, actors):
    admin_token = actors["admin"][0]
    r = client.post(
        "/api/v1/catalogue",
        json={
            "common_name": "Tulsi",
            "scientific_name": "Ocimum sanctum",
            "synonyms": ["Holy Basil"],
            "default_unit_price_inr": 200.0,
        },
        headers=_hdr(admin_token),
    )
    assert r.status_code == 201, r.get_json()
    species = r.get_json()["data"]["species"]
    assert species["species_id"].startswith("SPC-")
    assert species["common_name"] == "Tulsi"

    r2 = client.get("/api/v1/catalogue", headers=_hdr(admin_token))
    assert r2.status_code == 200
    rows = r2.get_json()["data"]["species"]
    assert any(x["common_name"] == "Tulsi" for x in rows)


def test_farmer_cannot_create_species(client, actors):
    r = client.post(
        "/api/v1/catalogue",
        json={"common_name": "Neem", "scientific_name": "Azadirachta indica"},
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 403


def test_search_and_filter(client, actors):
    admin = actors["admin"][0]
    for spec in (
        {"common_name": "Ashwagandha", "scientific_name": "Withania somnifera", "ayush_category": "ayurveda"},
        {"common_name": "Mulethi", "scientific_name": "Glycyrrhiza glabra", "ayush_category": "unani"},
    ):
        client.post("/api/v1/catalogue", json=spec, headers=_hdr(admin))

    r = client.get("/api/v1/catalogue?q=ashwa", headers=_hdr(admin))
    rows = r.get_json()["data"]["species"]
    assert any("Ashwagandha" in x["common_name"] for x in rows)

    r2 = client.get("/api/v1/catalogue?category=unani", headers=_hdr(admin))
    cats = [x["ayush_category"] for x in r2.get_json()["data"]["species"]]
    assert all(c == "unani" for c in cats)


def test_admin_soft_deletes_species(client, actors):
    admin = actors["admin"][0]
    r = client.post(
        "/api/v1/catalogue",
        json={"common_name": "DemoX", "scientific_name": "Demo x", "species_id": "spc-demox"},
        headers=_hdr(admin),
    )
    species_id = r.get_json()["data"]["species"]["species_id"]
    r2 = client.delete(f"/api/v1/catalogue/{species_id}", headers=_hdr(admin))
    assert r2.status_code == 200
    assert r2.get_json()["data"]["species"]["is_active"] is False
