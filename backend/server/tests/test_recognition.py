"""Tests for /api/v1/recognition/herbs and the rerank service."""

import pytest

from services.recognition_service import rerank


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.rec@test.local"),
        "admin": register("admin", "a.rec@test.local"),
    }


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def _seed_catalogue(client, admin_token):
    for body in (
        {
            "species_id": "tulsi",
            "common_name": "Tulsi",
            "scientific_name": "Ocimum sanctum",
            "synonyms": ["Holy Basil", "Sacred Basil"],
        },
        {
            "species_id": "ashwagandha",
            "common_name": "Ashwagandha",
            "scientific_name": "Withania somnifera",
            "synonyms": ["Indian Ginseng"],
        },
        {
            "species_id": "neem",
            "common_name": "Neem",
            "scientific_name": "Azadirachta indica",
            "synonyms": ["Margosa"],
        },
    ):
        r = client.post("/api/v1/catalogue", json=body, headers=_hdr(admin_token))
        assert r.status_code == 201, r.get_json()


def test_rerank_matches_synonyms(client, actors):
    _seed_catalogue(client, actors["admin"][0])

    r = client.post(
        "/api/v1/recognition/herbs",
        json={
            "candidates": [
                {"label": "Holy Basil", "score": 0.6},
                {"label": "Daisy", "score": 0.3},
            ]
        },
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 200, r.get_json()
    top = r.get_json()["data"]["top"]
    assert top, "expected at least one match"
    assert top[0]["species_id"] == "tulsi"
    assert "Holy Basil" in top[0]["matched_via"]


def test_rerank_returns_only_known_species(client, actors):
    _seed_catalogue(client, actors["admin"][0])
    r = client.post(
        "/api/v1/recognition/herbs",
        json={
            "candidates": [
                {"label": "Sunflower", "score": 0.9},
                {"label": "Daisy", "score": 0.8},
            ]
        },
        headers=_hdr(actors["farmer"][0]),
    )
    assert r.status_code == 200
    assert r.get_json()["data"]["top"] == []


def test_rerank_unauthenticated_rejected(client):
    r = client.post(
        "/api/v1/recognition/herbs",
        json={"candidates": [{"label": "Tulsi", "score": 1.0}]},
    )
    assert r.status_code == 401


def test_rerank_service_combines_scores(app, register):
    """Direct service test: high name match + low score still wins."""
    with app.app_context():
        # seed via admin
        token, _user = register("admin", "a.svc@test.local")
        c = app.test_client()
        c.post(
            "/api/v1/catalogue",
            json={"species_id": "tulsi", "common_name": "Tulsi", "scientific_name": "Ocimum sanctum"},
            headers=_hdr(token),
        )
        out = rerank([{"label": "tulsi", "score": 0.1}], top_k=3)
        assert out and out[0].species_id == "tulsi"
        assert 0 < out[0].confidence <= 1
