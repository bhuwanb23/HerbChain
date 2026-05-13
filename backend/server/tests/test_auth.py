"""Auth: register, login, refresh, /me, role guards."""


def test_register_and_login(client, register):
    token, user = register("farmer", "f1@test.local", password="hunter2hunter")
    assert user["role"] == "farmer"
    assert user["email"] == "f1@test.local"
    assert token  # JWT issued

    # Login by email
    r = client.post(
        "/api/v1/auth/login",
        json={"identifier": "f1@test.local", "password": "hunter2hunter"},
    )
    assert r.status_code == 200, r.get_json()
    assert r.get_json()["data"]["access_token"]

    # Login by user_id
    r = client.post(
        "/api/v1/auth/login",
        json={"identifier": user["user_id"], "password": "hunter2hunter"},
    )
    assert r.status_code == 200, r.get_json()


def test_register_validation_errors(client):
    r = client.post("/api/v1/auth/register", json={})
    assert r.status_code == 400
    body = r.get_json()
    assert body["error"]["code"] == "validation_error"
    assert "email" in body["error"]["details"]


def test_login_wrong_password(client, register):
    register("transporter", "t1@test.local", password="rightone")
    r = client.post(
        "/api/v1/auth/login",
        json={"identifier": "t1@test.local", "password": "wrongone"},
    )
    assert r.status_code == 401
    assert r.get_json()["error"]["code"] == "invalid_credentials"


def test_duplicate_email_rejected(client, register):
    register("lab", "dup@test.local")
    r = client.post(
        "/api/v1/auth/register",
        json={
            "role": "manufacturer",
            "name": "X",
            "email": "dup@test.local",
            "password": "password123",
        },
    )
    assert r.status_code == 409
    assert r.get_json()["error"]["code"] == "email_taken"


def test_me_requires_token(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_me_returns_user(client, register, auth_headers):
    token, user = register("consumer", "c1@test.local")
    r = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.get_json()["data"]["user"]["user_id"] == user["user_id"]


def test_role_guard_blocks_other_roles(client, register, auth_headers):
    """Only farmers can POST /batches."""
    token, _ = register("transporter", "tt@test.local")
    r = client.post(
        "/api/v1/batches",
        json={
            "species_name": "Tulsi",
            "harvest_date": "2026-04-01",
            "location": "Pune",
            "weight_kg": 5.0,
        },
        headers=auth_headers(token),
    )
    assert r.status_code == 403
    assert r.get_json()["error"]["code"] == "forbidden"


def test_refresh_token_issues_new_access(client, register):
    register("farmer", "ref@test.local", password="password123")
    r = client.post(
        "/api/v1/auth/login",
        json={"identifier": "ref@test.local", "password": "password123"},
    )
    refresh = r.get_json()["data"]["refresh_token"]
    r = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"},
    )
    assert r.status_code == 200
    assert r.get_json()["data"]["access_token"]
