"""
Auth helpers for routes — role-guard decorators and a current-user lookup.

Identity comes from the JWT subject, which we always set to the `user_id`.
"""
from __future__ import annotations

from functools import wraps
from typing import Optional

from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from models.users import User
from utils.responses import error


def current_user() -> Optional[User]:
    """Return the User row for the JWT subject, or None if not logged in."""
    if hasattr(g, "_current_user"):
        return g._current_user
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    sub = get_jwt_identity()
    if not sub:
        return None
    user = User.query.filter_by(user_id=sub).first()
    g._current_user = user
    return user


def require_auth(fn):
    """Require a valid JWT. Loads `g.current_user` for the wrapped handler."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        sub = get_jwt_identity()
        user = User.query.filter_by(user_id=sub).first()
        if user is None:
            return error("unauthorized", "Token references a missing user", 401)
        if not user.is_active:
            return error("forbidden", "User account is disabled", 403)
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    """Require a valid JWT AND that the user's role is one of `roles`."""
    allowed = set(roles)

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            sub = get_jwt_identity()
            user = User.query.filter_by(user_id=sub).first()
            if user is None:
                return error("unauthorized", "Token references a missing user", 401)
            if not user.is_active:
                return error("forbidden", "User account is disabled", 403)
            if user.role not in allowed:
                return error(
                    "forbidden",
                    f"This endpoint requires one of roles: {sorted(allowed)}",
                    403,
                )
            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator
