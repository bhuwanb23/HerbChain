"""Traceability: public batch journey, product journey, raw-QR resolve."""

import pytest


@pytest.fixture
def full_pipeline(client, register):
    """Drive a batch all the way to consumed-in-product, return ids+tokens."""
    farmer_t, _ = register("farmer", "fp@test.local")
    transporter_t, _ = register("transporter", "tp@test.local")
    lab_t, _ = register("lab", "lp@test.local")
    manufacturer_t, _ = register("manufacturer", "mp@test.local")

    h = lambda tok: {"Authorization": f"Bearer {tok}"}

    r = client.post(
        "/api/v1/batches",
        json={
            "species_name": "Ashwagandha",
            "harvest_date": "2026-03-15",
            "location": "Nashik",
            "weight_kg": 25.0,
            "gps_lat": 19.99,
            "gps_lng": 73.78,
        },
        headers=h(farmer_t),
    )
    batch_id = r.get_json()["data"]["herb"]["batch_id"]
    qr = r.get_json()["data"]["qr_token"]

    def _transfer(token, qr_in):
        r = client.post(
            f"/api/v1/batches/{batch_id}/transfer",
            json={"scanned_qr_token": qr_in, "location": "X"},
            headers=h(token),
        )
        assert r.status_code == 200, r.get_json()
        return r.get_json()["data"]["new_qr_token"]

    qr = _transfer(transporter_t, qr)
    qr = _transfer(lab_t, qr)

    r = client.post(
        "/api/v1/lab-reports",
        json={
            "batch_id": batch_id,
            "test_type": "purity",
            "test_date": "2026-03-20",
            "results_summary": "passed",
            "outcome": "approved",
            "certification_level": "Grade A",
        },
        headers=h(lab_t),
    )
    assert r.status_code == 201

    qr = _transfer(transporter_t, qr)
    qr = _transfer(manufacturer_t, qr)

    r = client.post(
        "/api/v1/products",
        json={
            "name": "Calm-It Capsules",
            "sku": "CIC-1",
            "source_batches": [{"batch_id": batch_id, "quantity_kg": 25.0}],
        },
        headers=h(manufacturer_t),
    )
    product_id = r.get_json()["data"]["product"]["product_id"]
    product_qr = r.get_json()["data"]["qr_token"]

    return {
        "batch_id": batch_id,
        "product_id": product_id,
        "product_qr": product_qr,
    }


def test_batch_journey_is_public(client, full_pipeline):
    r = client.get(f"/api/v1/traceability/batch/{full_pipeline['batch_id']}")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["batch_id"] == full_pipeline["batch_id"]
    assert data["summary"]["quality_certified"] is True
    types = [step["event_type"] for step in data["journey"]]
    assert types == [
        "CREATED",
        "TRANSFER",
        "TRANSFER",
        "LAB_REPORT",
        "TRANSFER",
        "TRANSFER",
        "PRODUCT_LINK",
    ]
    # Lab report should be inlined under the LAB_REPORT step
    lab_step = next(s for s in data["journey"] if s["event_type"] == "LAB_REPORT")
    assert lab_step["lab_report"]["outcome"] == "approved"


def test_product_journey_is_public(client, full_pipeline):
    r = client.get(f"/api/v1/traceability/product/{full_pipeline['product_id']}")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["product"]["product_id"] == full_pipeline["product_id"]
    assert data["summary"]["all_certified"] is True
    assert data["summary"]["total_source_batches"] == 1


def test_unknown_batch_404(client):
    r = client.get("/api/v1/traceability/batch/NOPE-XXXX")
    assert r.status_code == 404
    assert r.get_json()["error"]["code"] == "not_found"


def test_resolve_product_qr(client, full_pipeline):
    r = client.post(
        "/api/v1/traceability/resolve",
        json={"qr_token": full_pipeline["product_qr"]},
    )
    assert r.status_code == 200
    body = r.get_json()["data"]
    assert body["kind"] == "product"
    assert body["journey"]["product"]["product_id"] == full_pipeline["product_id"]


def test_resolve_invalid_token(client):
    r = client.post("/api/v1/traceability/resolve", json={"qr_token": "not.a.token"})
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "invalid_qr"
