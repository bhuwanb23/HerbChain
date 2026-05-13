"""
Lab report routes.

Endpoints:
    POST /api/v1/lab-reports                         lab files a report (must be holder)
    GET  /api/v1/lab-reports/batch/<batch_id>        list reports for a batch
    GET  /api/v1/lab-reports/<report_id>             get a single report
"""
from __future__ import annotations

import uuid
from datetime import datetime

from flask import Blueprint, g, request
from marshmallow import ValidationError

from models import db
from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.lab_reports import LabReport
from schemas.lab_reports import CreateLabReportSchema
from utils.auth import require_auth, require_role
from utils.responses import error, ok

lab_reports_bp = Blueprint("lab_reports", __name__, url_prefix="/api/v1/lab-reports")


@lab_reports_bp.get("/")
def info():
    return ok(
        {
            "endpoints": {
                "create": "POST /api/v1/lab-reports",
                "list_for_batch": "GET /api/v1/lab-reports/batch/<batch_id>",
                "get_one": "GET /api/v1/lab-reports/<report_id>",
            }
        }
    )


@lab_reports_bp.post("")
@lab_reports_bp.post("/")
@require_role("lab")
def create():
    payload = request.get_json(silent=True) or {}
    try:
        data = CreateLabReportSchema().load(payload)
    except ValidationError as exc:
        return error("validation_error", "Invalid lab report data", 400, extra=exc.messages)

    batch_id = data["batch_id"]
    herb = Herb.query.filter_by(batch_id=batch_id).first()
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if herb is None or state is None:
        return error("not_found", f"Batch '{batch_id}' not found", 404)

    if state.current_holder_id != g.current_user.user_id:
        return error("forbidden", "Only the lab currently holding this batch can file a report", 403)

    if state.phase != "at_lab":
        return error(
            "invalid_state",
            f"Lab reports can only be filed when phase is 'at_lab' (current: '{state.phase}')",
            409,
        )

    report_id = f"REPORT-{uuid.uuid4().hex[:10].upper()}"
    report = LabReport(
        report_id=report_id,
        batch_id=batch_id,
        lab_id=g.current_user.user_id,
        test_type=data["test_type"],
        test_date=data["test_date"],
        results_summary=data["results_summary"],
        outcome=data["outcome"],
        certification_level=data.get("certification_level"),
        purity_percentage=data.get("purity_percentage"),
        moisture_content=data.get("moisture_content"),
        ash_content=data.get("ash_content"),
        heavy_metals_present=data.get("heavy_metals_present"),
        pesticides_detected=data.get("pesticides_detected"),
        active_compounds=data.get("active_compounds"),
        potency_rating=data.get("potency_rating"),
        report_url=data.get("report_url"),
        notes=data.get("notes"),
        recommendations=data.get("recommendations"),
    )
    db.session.add(report)

    state.test_result = data["outcome"]
    state.updated_at = datetime.utcnow()

    event = BatchEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
        batch_id=batch_id,
        event_type="LAB_REPORT",
        actor_id=g.current_user.user_id,
        from_party_id=None,
        to_party_id=g.current_user.user_id,
        phase_before=state.phase,
        phase_after=state.phase,
        location=g.current_user.location,
        payload_json={
            "report_id": report_id,
            "outcome": data["outcome"],
            "certification_level": data.get("certification_level"),
        },
    )
    db.session.add(event)
    db.session.commit()

    return ok({"report": report.to_dict(), "state": state.to_dict()}, 201)


@lab_reports_bp.get("/batch/<batch_id>")
@require_auth
def list_for_batch(batch_id: str):
    if Herb.query.filter_by(batch_id=batch_id).first() is None:
        return error("not_found", f"Batch '{batch_id}' not found", 404)
    reports = (
        LabReport.query.filter_by(batch_id=batch_id)
        .order_by(LabReport.created_at.desc())
        .all()
    )
    return ok({"reports": [r.to_dict() for r in reports], "total": len(reports)})


@lab_reports_bp.get("/<report_id>")
@require_auth
def get_one(report_id: str):
    report = LabReport.query.filter_by(report_id=report_id).first()
    if report is None:
        return error("not_found", f"Lab report '{report_id}' not found", 404)
    return ok({"report": report.to_dict()})
