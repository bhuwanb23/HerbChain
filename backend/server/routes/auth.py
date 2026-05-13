"""
Authentication routes: register, login, refresh, me.

Identity is always carried in the JWT subject, which we set to the user's
`user_id`. Passwords are bcrypt-hashed via `User.set_password`.
"""
from __future__ import annotations

import uuid

from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from models import db
from models.users import User
from schemas.auth import LoginSchema, RegisterSchema
from utils.auth import require_auth
from utils.responses import error, ok

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


# ----------------------------------------------------------------- token helpers


def _make_tokens(user: User) -> dict:
    claims = {"role": user.role, "name": user.name}
    return {
        "access_token": create_access_token(identity=user.user_id, additional_claims=claims),
        "refresh_token": create_refresh_token(identity=user.user_id, additional_claims=claims),
        "token_type": "Bearer",
    }


def _generate_user_id(role: str) -> str:
    return f"{role}_{uuid.uuid4().hex[:10]}"


# --------------------------------------------------------------------- routes


@auth_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "register": "POST /api/v1/auth/register",
                "login": "POST /api/v1/auth/login",
                "refresh": "POST /api/v1/auth/refresh",
                "me": "GET /api/v1/auth/me",
            }
        }
    )


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    try:
        data = RegisterSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid registration data", 400, extra=exc.messages)

    email = data["email"].lower().strip()
    if User.query.filter_by(email=email).first():
        return error("email_taken", "An account with this email already exists", 409)

    user_id = _generate_user_id(data["role"])
    try:
        user = User.create(
            user_id=user_id,
            role=data["role"],
            name=data["name"].strip(),
            email=email,
            password=data["password"],
            phone=data.get("phone"),
            location=data.get("location"),
            gps_lat=data.get("gps_lat"),
            gps_lng=data.get("gps_lng"),
            language_pref=data.get("language_pref", "en"),
        )
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error("email_taken", "An account with this email already exists", 409)
    except ValueError as exc:
        db.session.rollback()
        return error("bad_request", str(exc), 400)

    tokens = _make_tokens(user)
    return ok({"user": user.to_dict(), **tokens}, 201)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    try:
        data = LoginSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid login data", 400, extra=exc.messages)

    identifier = data["identifier"].strip().lower()
    user: User | None = (
        User.query.filter_by(email=identifier).first()
        or User.query.filter_by(user_id=data["identifier"].strip()).first()
    )
    if user is None or not user.check_password(data["password"]):
        return error("invalid_credentials", "Email/user_id or password is incorrect", 401)
    if not user.is_active:
        return error("forbidden", "User account is disabled", 403)

    tokens = _make_tokens(user)
    return ok({"user": user.to_dict(), **tokens})


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    sub = get_jwt_identity()
    user = User.query.filter_by(user_id=sub).first()
    if user is None or not user.is_active:
        return error("unauthorized", "Token references a missing or disabled user", 401)
    new_access = create_access_token(
        identity=user.user_id,
        additional_claims={"role": user.role, "name": user.name},
    )
    return ok({"access_token": new_access, "token_type": "Bearer"})


@auth_bp.get("/me")
@require_auth
def me():
    from flask import g

    return ok({"user": g.current_user.to_dict()})
