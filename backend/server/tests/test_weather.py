"""Tests for /api/v1/weather (stub provider when no API key)."""

import os

import pytest


@pytest.fixture
def actor(register):
    return register("farmer", "f.wx@test.local")


def _hdr(t):
    return {"Authorization": f"Bearer {t}"}


def test_returns_stub_when_no_key(client, actor, monkeypatch):
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)
    r = client.get("/api/v1/weather?lat=18.5&lng=73.8", headers=_hdr(actor[0]))
    assert r.status_code == 200, r.get_json()
    body = r.get_json()["data"]
    assert body["provider"] == "stub"
    assert "current" in body["weather"]
    assert "forecast" in body["weather"]
    assert isinstance(body["weather"]["forecast"], list)


def test_cache_hit_on_second_call(client, actor, monkeypatch):
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)
    a = client.get("/api/v1/weather?lat=18.5&lng=73.8", headers=_hdr(actor[0])).get_json()["data"]
    b = client.get("/api/v1/weather?lat=18.5&lng=73.8", headers=_hdr(actor[0])).get_json()["data"]
    assert a["cached"] is False
    assert b["cached"] is True
    assert a["weather"] == b["weather"]


def test_invalid_coords_rejected(client, actor):
    r = client.get("/api/v1/weather?lat=999&lng=0", headers=_hdr(actor[0]))
    assert r.status_code == 400
    r2 = client.get("/api/v1/weather", headers=_hdr(actor[0]))
    assert r2.status_code == 400


def test_unauthenticated_rejected(client):
    r = client.get("/api/v1/weather?lat=18.5&lng=73.8")
    assert r.status_code == 401
