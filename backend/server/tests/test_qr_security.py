"""QR security: replay, forge, expiry, wrong-role rejection."""

import time

import jwt as pyjwt
import pytest


@pytest.fixture
def setup_batch(client, register):
    farmer_t, _ = register("farmer", "f_qrsec@test.local")
    transporter_t, _ = register("transporter", "t_qrsec@test.local")
    lab_t, _ = register("lab", "l_qrsec@test.local")

    r = client.post(
        "/api/v1/batches",
        json={
            "species_name": "Tulsi",
            "harvest_date": "2026-04-01",
            "location": "Pune",
            "weight_kg": 5.0,
        },
        headers={"Authorization": f"Bearer {farmer_t}"},
    )
    batch_id = r.get_json()["data"]["herb"]["batch_id"]
    qr1 = r.get_json()["data"]["qr_token"]
    return {
        "batch_id": batch_id,
        "qr1": qr1,
        "tokens": {
            "farmer": farmer_t,
            "transporter": transporter_t,
            "lab": lab_t,
        },
    }


def test_replay_old_qr_rejected(client, setup_batch):
    s = setup_batch
    # First scan should succeed -> mints qr2
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": s["qr1"], "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['transporter']}"},
    )
    assert r.status_code == 200

    # Re-scanning the original (now-dead) qr1 must be rejected
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": s["qr1"], "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['lab']}"},
    )
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "stale_qr"


def test_forged_signature_rejected(client, setup_batch):
    s = setup_batch
    # Tamper with the last char of the signature
    tampered = s["qr1"][:-1] + ("a" if s["qr1"][-1] != "a" else "b")
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": tampered, "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['transporter']}"},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "invalid_qr"


def test_wrong_signing_key_rejected(client, setup_batch, app):
    """A token signed with a DIFFERENT key must be rejected."""
    s = setup_batch
    # Forge a token that claims the right batch but is signed with a different key
    forged = pyjwt.encode(
        {
            "typ": "batch",
            "sub": s["batch_id"],
            "holder": "attacker",
            "phase": "with_farmer",
            "nonce": "deadbeef",
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
        },
        "completely-different-key",
        algorithm="HS256",
    )
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": forged, "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['transporter']}"},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "invalid_qr"


def test_expired_qr_rejected(client, setup_batch, app):
    """A token whose `exp` is in the past must be rejected even if signed correctly."""
    s = setup_batch
    # Mint a deliberately-expired token using the service's own key so the
    # signature check passes but the expiry check fails.
    with app.app_context():
        expired = pyjwt.encode(
            {
                "typ": "batch",
                "sub": s["batch_id"],
                "holder": "some_farmer",
                "phase": "with_farmer",
                "nonce": "expired-test",
                "iat": int(time.time()) - 7200,
                "exp": int(time.time()) - 60,
            },
            app.config["QR_SIGNING_KEY"],
            algorithm="HS256",
        )
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": expired, "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['transporter']}"},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "invalid_qr"
    assert "expired" in r.get_json()["error"]["message"].lower()


def test_wrong_role_rejected(client, setup_batch):
    """An authenticated user with the wrong role can't kick off the transition."""
    s = setup_batch
    # Lab tries to scan the with_farmer QR — invalid transition
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": s["qr1"], "location": "x"},
        headers={"Authorization": f"Bearer {s['tokens']['lab']}"},
    )
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "invalid_transition"


def test_cross_batch_qr_rejected(client, register):
    """A valid QR for batch A cannot transfer batch B."""
    farmer_t, _ = register("farmer", "fxb@test.local")
    transporter_t, _ = register("transporter", "txb@test.local")

    def _new_batch():
        r = client.post(
            "/api/v1/batches",
            json={
                "species_name": "Tulsi",
                "harvest_date": "2026-04-01",
                "location": "Pune",
                "weight_kg": 5.0,
            },
            headers={"Authorization": f"Bearer {farmer_t}"},
        )
        return r.get_json()["data"]["herb"]["batch_id"], r.get_json()["data"]["qr_token"]

    batch_a, qr_a = _new_batch()
    batch_b, qr_b = _new_batch()
    assert batch_a != batch_b

    # Try to transfer batch B using batch A's QR
    r = client.post(
        f"/api/v1/batches/{batch_b}/transfer",
        json={"scanned_qr_token": qr_a, "location": "x"},
        headers={"Authorization": f"Bearer {transporter_t}"},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "invalid_qr"


def test_unauthenticated_transfer_rejected(client, setup_batch):
    s = setup_batch
    r = client.post(
        f"/api/v1/batches/{s['batch_id']}/transfer",
        json={"scanned_qr_token": s["qr1"], "location": "x"},
    )
    assert r.status_code == 401
