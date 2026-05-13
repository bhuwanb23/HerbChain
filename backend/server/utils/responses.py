"""
Consistent JSON response envelope.

Successful responses:
    {"data": <payload>, "error": null}

Error responses:
    {"data": null, "error": {"code": "<machine_code>", "message": "<human>"}}

Use:
    from utils.responses import ok, error

    return ok({"hello": "world"})            # 200
    return ok(payload, 201)                  # custom status
    return error("not_found", "...", 404)
"""
from __future__ import annotations

from typing import Any

from flask import jsonify


def ok(data: Any = None, status: int = 200):
    return jsonify({"data": data, "error": None}), status


def error(code: str, message: str, status: int = 400, *, extra: dict | None = None):
    err = {"code": code, "message": message}
    if extra:
        err["details"] = extra
    return jsonify({"data": None, "error": err}), status
