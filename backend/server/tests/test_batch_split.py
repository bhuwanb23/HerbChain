"""Tests for POST /api/v1/batches/<id>/split."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f.split@test.local"),
        "other_farmer": register("farmer", "of.split@test.local"),
        "transporter": register("transporter", "t.split@test.local"),
    }


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def _create_batch(client, token, weight=10.0):
    r = client.post(
        "/api/v1/batches",
        json={
            "species_name": "Tulsi",
            "harvest_date": "2026-04-01",
            "location": "Pune",
            "weight_kg": weight,
        },
        headers=_hdr(token),
    )
    assert r.status_code == 201, r.get_json()
    return r.get_json()["data"]["herb"]["batch_id"], r.get_json()["data"]["qr_token"]


def test_split_into_two_children(client, actors):
    token = actors["farmer"][0]
    batch_id, _qr = _create_batch(client, token, weight=10.0)

    r = client.post(
        f"/api/v1/batches/{batch_id}/split",
        json={
            "splits": [
                {"weight_kg": 6.0, "note": "Buyer A"},
                {"weight_kg": 4.0, "note": "Buyer B"},
            ]
        },
        headers=_hdr(token),
    )
    assert r.status_code == 201, r.get_json()
    body = r.get_json()["data"]
    assert body["parent_batch_id"] == batch_id
    assert body["parent_consumed"] is True
    assert len(body["children"]) == 2
    weights = sorted(c["weight_kg"] for c in body["children"])
    assert weights == [4.0, 6.0]
    for c in body["children"]:
        assert c["qr_token"]


def test_split_partial_keeps_parent(client, actors):
    token = actors["farmer"][0]
    batch_id, _qr = _create_batch(client, token, weight=10.0)
    r = client.post(
        f"/api/v1/batches/{batch_id}/split",
        json={"splits": [{"weight_kg": 3.0}]},
        headers=_hdr(token),
    )
    assert r.status_code == 201
    body = r.get_json()["data"]
    assert body["parent_consumed"] is False
    assert body["parent_remaining_kg"] == 7.0


def test_split_overflow_rejected(client, actors):
    token = actors["farmer"][0]
    batch_id, _qr = _create_batch(client, token, weight=5.0)
    r = client.post(
        f"/api/v1/batches/{batch_id}/split",
        json={"splits": [{"weight_kg": 6.0}]},
        headers=_hdr(token),
    )
    assert r.status_code == 400


def test_only_original_farmer_can_split(client, actors):
    farmer_token = actors["farmer"][0]
    batch_id, _qr = _create_batch(client, farmer_token, weight=4.0)

    other_token = actors["other_farmer"][0]
    r = client.post(
        f"/api/v1/batches/{batch_id}/split",
        json={"splits": [{"weight_kg": 1.0}]},
        headers=_hdr(other_token),
    )
    assert r.status_code == 403


def test_non_farmer_cannot_split(client, actors):
    farmer_token = actors["farmer"][0]
    batch_id, _qr = _create_batch(client, farmer_token, weight=4.0)
    r = client.post(
        f"/api/v1/batches/{batch_id}/split",
        json={"splits": [{"weight_kg": 1.0}]},
        headers=_hdr(actors["transporter"][0]),
    )
    assert r.status_code == 403
