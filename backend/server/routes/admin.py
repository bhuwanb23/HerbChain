"""
Admin routes — real DB-backed stats, user list, batch list, and logs.

All endpoints (except `/admin/`) require the caller to be an admin.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from pathlib import Path

from flask import Blueprint, request
from sqlalchemy import func

from models import db
from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.lab_reports import LabReport
from models.products import Product
from models.users import User
from utils.auth import require_role
from utils.responses import error, ok

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.get("/")
def index():
    return ok(
        {
            "name": "HerbChain Admin",
            "endpoints": {
                "stats": "GET /admin/api/stats",
                "users": "GET /admin/api/users",
                "batches": "GET /admin/api/batches",
                "products": "GET /admin/api/products",
                "lab_reports": "GET /admin/api/lab-reports",
                "events": "GET /admin/api/events",
                "logs": "GET /admin/api/logs",
                "health": "GET /admin/api/health",
            },
        }
    )


@admin_bp.get("/api/health")
def health():
    try:
        users = db.session.query(func.count(User.user_id)).scalar() or 0
        batches = db.session.query(func.count(Herb.batch_id)).scalar() or 0
        return ok(
            {
                "status": "healthy",
                "db": "ok",
                "users": users,
                "batches": batches,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
    except Exception as exc:
        return error("db_error", f"Database health check failed: {exc}", 500)


@admin_bp.get("/api/stats")
@require_role("admin")
def stats():
    # Users by role
    role_counts = dict(
        db.session.query(User.role, func.count(User.user_id)).group_by(User.role).all()
    )
    # Batches by phase
    phase_counts = dict(
        db.session.query(BatchState.phase, func.count(BatchState.batch_id))
        .group_by(BatchState.phase)
        .all()
    )
    # Test results
    test_counts = dict(
        db.session.query(BatchState.test_result, func.count(BatchState.batch_id))
        .group_by(BatchState.test_result)
        .all()
    )

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    recent_batches = (
        db.session.query(func.count(Herb.batch_id))
        .filter(Herb.created_at >= one_week_ago)
        .scalar()
        or 0
    )
    recent_events = (
        db.session.query(func.count(BatchEvent.event_id))
        .filter(BatchEvent.created_at >= one_week_ago)
        .scalar()
        or 0
    )

    return ok(
        {
            "users": {
                "total": sum(role_counts.values()),
                "by_role": role_counts,
            },
            "batches": {
                "total": sum(phase_counts.values()),
                "by_phase": phase_counts,
                "by_test_result": test_counts,
                "new_last_7_days": recent_batches,
            },
            "events": {
                "last_7_days": recent_events,
            },
            "products": {
                "total": db.session.query(func.count(Product.product_id)).scalar() or 0,
            },
            "lab_reports": {
                "total": db.session.query(func.count(LabReport.report_id)).scalar() or 0,
            },
        }
    )


@admin_bp.get("/api/users")
@require_role("admin")
def list_users():
    role = request.args.get("role")
    q = User.query
    if role:
        q = q.filter_by(role=role)
    users = q.order_by(User.created_at.desc()).limit(500).all()
    return ok({"users": [u.to_dict() for u in users], "total": len(users)})


@admin_bp.get("/api/batches")
@require_role("admin")
def list_batches():
    phase = request.args.get("phase")
    q = db.session.query(Herb, BatchState).join(
        BatchState, BatchState.batch_id == Herb.batch_id
    )
    if phase:
        q = q.filter(BatchState.phase == phase)
    rows = q.order_by(BatchState.updated_at.desc()).limit(500).all()
    items = []
    for herb, state in rows:
        items.append({"herb": herb.to_dict(), "state": state.to_dict()})
    return ok({"batches": items, "total": len(items)})


@admin_bp.get("/api/products")
@require_role("admin")
def list_products():
    rows = Product.query.order_by(Product.created_at.desc()).limit(500).all()
    return ok({"products": [p.to_dict(include_links=True) for p in rows], "total": len(rows)})


@admin_bp.get("/api/lab-reports")
@require_role("admin")
def list_lab_reports():
    rows = LabReport.query.order_by(LabReport.created_at.desc()).limit(500).all()
    return ok({"reports": [r.to_dict() for r in rows], "total": len(rows)})


@admin_bp.get("/api/events")
@require_role("admin")
def list_events():
    batch_id = request.args.get("batch_id")
    q = BatchEvent.query
    if batch_id:
        q = q.filter_by(batch_id=batch_id)
    rows = q.order_by(BatchEvent.created_at.desc()).limit(500).all()
    return ok({"events": [e.to_dict() for e in rows], "total": len(rows)})


@admin_bp.get("/api/logs")
@require_role("admin")
def list_logs():
    """Tail of the main herbchain.log file."""
    lines = request.args.get("lines", type=int) or 200
    log_path = Path("logs/herbchain.log")
    if not log_path.exists():
        return ok({"logs": []})
    try:
        with log_path.open("r", encoding="utf-8", errors="replace") as f:
            tail = f.readlines()[-lines:]
        return ok({"logs": [line.rstrip("\n") for line in tail], "count": len(tail)})
    except OSError as exc:
        return error("io_error", f"Could not read log file: {exc}", 500)
