"""
Pytest fixtures for HerbChain backend.

All tests run against an in-memory SQLite, isolated per test, with fixed
secrets so JWTs and QR tokens are deterministic and inspectable.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable

import pytest

# Make `app`, `models`, `services`, ... importable when tests run from `backend/server`.
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parent.parent))

from app import create_app  # noqa: E402
from models import db  # noqa: E402


@pytest.fixture
def app():
    """Fresh Flask app + in-memory SQLite for each test."""
    application = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-jwt-key",
            "QR_SIGNING_KEY": "test-qr-key",
        }
    )
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def register(client) -> Callable[..., tuple[str, dict]]:
    """Return a helper that registers a user and returns (access_token, user_dict)."""

    def _register(role: str, email: str | None = None, password: str = "password123"):
        email = email or f"{role}+{abs(hash(role + password)) % 10_000_000}@test.local"
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "role": role,
                "name": f"Test {role.title()}",
                "email": email,
                "password": password,
            },
        )
        assert resp.status_code == 201, resp.get_json()
        body = resp.get_json()["data"]
        return body["access_token"], body["user"]

    return _register


@pytest.fixture
def auth_headers():
    return lambda token: {"Authorization": f"Bearer {token}"}
