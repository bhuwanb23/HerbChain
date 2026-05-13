"""
QR signing & verification.

Every QR encodes a compact JWT (HS256) whose claims describe the batch and
its current holder. The token is stored on `BatchState.current_qr_token` and
overwritten on every successful transfer, so old QRs become "dead" the moment
the next one is minted.

A separate code path mints product QRs (consumer-facing read-only) that
encode just the product id.

Public API
----------
    issue_batch_qr(batch_id, holder_id, phase, ttl_seconds=None) -> str  (token)
    issue_product_qr(product_id) -> str
    render_png_data_url(token) -> str           # data:image/png;base64,...
    verify_batch_qr(token, expected_batch_id=None) -> BatchQrClaims
    verify_product_qr(token) -> ProductQrClaims
    QrError                                     # raised on any verification failure
"""
from __future__ import annotations

import secrets
import time
from dataclasses import dataclass
from typing import Optional

import jwt as pyjwt
from flask import current_app

from utils.qr_utils import generate_qr_base64


# Default validity window for a batch QR. 7 days is generous enough that a
# transporter doesn't get stuck if a delivery slips, but short enough that a
# leaked QR can't be replayed forever.
DEFAULT_BATCH_TTL_SECONDS = 7 * 24 * 60 * 60

# Product QRs are public-read forever — no expiry by default.
DEFAULT_PRODUCT_TTL_SECONDS = 0  # 0 = never expires

QR_TYPE_BATCH = "batch"
QR_TYPE_PRODUCT = "product"


class QrError(ValueError):
    """Raised for any QR verification failure (invalid sig / expired / mismatch)."""


@dataclass(frozen=True)
class BatchQrClaims:
    batch_id: str
    holder_id: str
    phase: str
    nonce: str
    issued_at: int
    expires_at: Optional[int]
    token: str


@dataclass(frozen=True)
class ProductQrClaims:
    product_id: str
    nonce: str
    issued_at: int
    token: str


# --------------------------------------------------------------------- helpers


def _signing_key() -> str:
    key = current_app.config.get("QR_SIGNING_KEY")
    if not key:
        raise RuntimeError("QR_SIGNING_KEY is not configured")
    return key


def _now() -> int:
    return int(time.time())


def _encode(payload: dict) -> str:
    return pyjwt.encode(payload, _signing_key(), algorithm="HS256")


def _decode(token: str) -> dict:
    try:
        return pyjwt.decode(
            token,
            _signing_key(),
            algorithms=["HS256"],
            options={"require": ["typ", "sub", "iat", "nonce"]},
        )
    except pyjwt.ExpiredSignatureError as exc:
        raise QrError("QR has expired") from exc
    except pyjwt.InvalidTokenError as exc:
        raise QrError(f"Invalid QR token: {exc}") from exc


# ------------------------------------------------------------------- issuance


def issue_batch_qr(
    batch_id: str,
    holder_id: str,
    phase: str,
    ttl_seconds: Optional[int] = None,
) -> str:
    """Mint a fresh signed token for the given batch+holder. Returns the token."""
    if not batch_id or not holder_id or not phase:
        raise ValueError("batch_id, holder_id and phase are required")

    ttl = DEFAULT_BATCH_TTL_SECONDS if ttl_seconds is None else int(ttl_seconds)
    now = _now()
    payload = {
        "typ": QR_TYPE_BATCH,
        "sub": batch_id,
        "holder": holder_id,
        "phase": phase,
        "nonce": secrets.token_urlsafe(8),
        "iat": now,
    }
    if ttl and ttl > 0:
        payload["exp"] = now + ttl
    return _encode(payload)


def issue_product_qr(product_id: str, ttl_seconds: Optional[int] = None) -> str:
    if not product_id:
        raise ValueError("product_id is required")
    ttl = DEFAULT_PRODUCT_TTL_SECONDS if ttl_seconds is None else int(ttl_seconds)
    now = _now()
    payload = {
        "typ": QR_TYPE_PRODUCT,
        "sub": product_id,
        "nonce": secrets.token_urlsafe(8),
        "iat": now,
    }
    if ttl and ttl > 0:
        payload["exp"] = now + ttl
    return _encode(payload)


# --------------------------------------------------------------- verification


def verify_batch_qr(
    token: str,
    expected_batch_id: Optional[str] = None,
) -> BatchQrClaims:
    if not token or not isinstance(token, str):
        raise QrError("Empty QR token")

    claims = _decode(token)
    if claims.get("typ") != QR_TYPE_BATCH:
        raise QrError("QR is not a batch token")

    batch_id = claims.get("sub")
    holder_id = claims.get("holder")
    phase = claims.get("phase")
    nonce = claims.get("nonce")
    if not all([batch_id, holder_id, phase, nonce]):
        raise QrError("QR is missing required claims")

    if expected_batch_id and batch_id != expected_batch_id:
        raise QrError(
            f"QR belongs to batch '{batch_id}', not '{expected_batch_id}'"
        )

    return BatchQrClaims(
        batch_id=batch_id,
        holder_id=holder_id,
        phase=phase,
        nonce=nonce,
        issued_at=int(claims.get("iat", 0)),
        expires_at=int(claims["exp"]) if "exp" in claims else None,
        token=token,
    )


def verify_product_qr(token: str) -> ProductQrClaims:
    if not token or not isinstance(token, str):
        raise QrError("Empty QR token")

    claims = _decode(token)
    if claims.get("typ") != QR_TYPE_PRODUCT:
        raise QrError("QR is not a product token")

    product_id = claims.get("sub")
    nonce = claims.get("nonce")
    if not all([product_id, nonce]):
        raise QrError("Product QR is missing required claims")

    return ProductQrClaims(
        product_id=product_id,
        nonce=nonce,
        issued_at=int(claims.get("iat", 0)),
        token=token,
    )


# ---------------------------------------------------------------- rendering


def render_png_data_url(token: str) -> str:
    """Render a token as a QR PNG data URL (data:image/png;base64,...)."""
    if not token:
        raise ValueError("Empty token")
    return generate_qr_base64(token)
