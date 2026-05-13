"""Full farmer -> transporter -> lab -> transporter -> manufacturer -> consumer flow."""

import pytest


@pytest.fixture
def actors(register):
    return {
        "farmer": register("farmer", "f@test.local"),
        "transporter": register("transporter", "t@test.local"),
        "lab": register("lab", "l@test.local"),
        "manufacturer": register("manufacturer", "m@test.local"),
        "admin": register("admin", "a@test.local"),
    }


def _create_batch(client, farmer_token):
    r = client.post(
        "/api/v1/batches",
        json={
            "species_name": "Tulsi",
            "harvest_date": "2026-04-01",
            "location": "Pune",
            "weight_kg": 10.0,
            "gps_lat": 18.52,
            "gps_lng": 73.85,
        },
        headers={"Authorization": f"Bearer {farmer_token}"},
    )
    assert r.status_code == 201, r.get_json()
    body = r.get_json()["data"]
    return body["herb"]["batch_id"], body["qr_token"]


def _transfer(client, batch_id, scanner_token, qr_token):
    return client.post(
        f"/api/v1/batches/{batch_id}/transfer",
        json={"scanned_qr_token": qr_token, "location": "X"},
        headers={"Authorization": f"Bearer {scanner_token}"},
    )


def test_happy_path_end_to_end(client, actors):
    farmer_t, _ = actors["farmer"]
    transporter_t, _ = actors["transporter"]
    lab_t, _ = actors["lab"]
    manufacturer_t, _ = actors["manufacturer"]

    batch_id, qr1 = _create_batch(client, farmer_t)

    r = _transfer(client, batch_id, transporter_t, qr1)
    assert r.status_code == 200
    qr2 = r.get_json()["data"]["new_qr_token"]
    assert r.get_json()["data"]["transfer"]["to_phase"] == "in_transit_to_lab"

    r = _transfer(client, batch_id, lab_t, qr2)
    assert r.status_code == 200
    qr3 = r.get_json()["data"]["new_qr_token"]
    assert r.get_json()["data"]["transfer"]["to_phase"] == "at_lab"

    # Lab must approve before transporter can pick up for manufacturer
    r = _transfer(client, batch_id, transporter_t, qr3)
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "not_approved"

    # File approved report
    r = client.post(
        "/api/v1/lab-reports",
        json={
            "batch_id": batch_id,
            "test_type": "purity",
            "test_date": "2026-04-05",
            "results_summary": "all clear",
            "outcome": "approved",
        },
        headers={"Authorization": f"Bearer {lab_t}"},
    )
    assert r.status_code == 201

    r = _transfer(client, batch_id, transporter_t, qr3)
    assert r.status_code == 200
    qr4 = r.get_json()["data"]["new_qr_token"]
    assert r.get_json()["data"]["transfer"]["to_phase"] == "in_transit_to_manufacturer"

    r = _transfer(client, batch_id, manufacturer_t, qr4)
    assert r.status_code == 200
    assert r.get_json()["data"]["transfer"]["to_phase"] == "with_manufacturer"

    # Create a product consuming the batch
    r = client.post(
        "/api/v1/products",
        json={
            "name": "Tulsi Tea",
            "sku": "TT-1",
            "source_batches": [{"batch_id": batch_id, "quantity_kg": 10.0}],
        },
        headers={"Authorization": f"Bearer {manufacturer_t}"},
    )
    assert r.status_code == 201
    product_id = r.get_json()["data"]["product"]["product_id"]

    # Consumer (no token) can fetch traceability
    r = client.get(f"/api/v1/traceability/product/{product_id}")
    assert r.status_code == 200
    journey = r.get_json()["data"]
    assert journey["summary"]["total_source_batches"] == 1
    assert journey["summary"]["all_certified"] is True
    assert journey["source_batches"][0]["journey"]["summary"]["quality_certified"] is True
    # Steps: CREATED + 4 TRANSFERs + LAB_REPORT + PRODUCT_LINK = 7
    assert journey["source_batches"][0]["journey"]["summary"]["total_steps"] == 7


def test_wrong_role_cannot_transfer(client, actors):
    farmer_t, _ = actors["farmer"]
    manufacturer_t, _ = actors["manufacturer"]
    batch_id, qr1 = _create_batch(client, farmer_t)

    # Manufacturer trying to be the first scanner: invalid transition
    r = _transfer(client, batch_id, manufacturer_t, qr1)
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "invalid_transition"


def test_farmer_cannot_transfer(client, actors):
    """Farmers don't have the role guard, so they get a 403 before state machine."""
    farmer_t, _ = actors["farmer"]
    batch_id, qr1 = _create_batch(client, farmer_t)
    r = _transfer(client, batch_id, farmer_t, qr1)
    # require_role(transporter, lab, manufacturer) -> 403
    assert r.status_code == 403


def test_transferred_batch_lists_in_mine(client, actors):
    farmer_t, _ = actors["farmer"]
    transporter_t, _ = actors["transporter"]
    batch_id, qr1 = _create_batch(client, farmer_t)
    _transfer(client, batch_id, transporter_t, qr1)

    r = client.get(
        "/api/v1/batches/mine",
        headers={"Authorization": f"Bearer {transporter_t}"},
    )
    assert r.status_code == 200
    ids = [b["herb"]["batch_id"] for b in r.get_json()["data"]["batches"]]
    assert batch_id in ids


def test_qr_endpoint_visibility(client, actors):
    farmer_t, _ = actors["farmer"]
    transporter_t, _ = actors["transporter"]
    lab_t, _ = actors["lab"]

    batch_id, _qr1 = _create_batch(client, farmer_t)

    # Farmer can fetch the QR of their own batch even after handoff (read-only).
    # Other parties can only fetch if they're the current holder.
    r = client.get(
        f"/api/v1/batches/{batch_id}/qr",
        headers={"Authorization": f"Bearer {lab_t}"},
    )
    assert r.status_code == 403, r.get_json()

    r = client.get(
        f"/api/v1/batches/{batch_id}/qr",
        headers={"Authorization": f"Bearer {farmer_t}"},
    )
    assert r.status_code == 200
    assert r.get_json()["data"]["qr_png"].startswith("data:image/png")
