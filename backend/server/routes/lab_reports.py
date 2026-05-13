"""
Lab report routes — labs file structured test results against a batch.

Filled in during Phase 1e.
"""
from flask import Blueprint, jsonify

lab_reports_bp = Blueprint("lab_reports", __name__, url_prefix="/api/v1/lab-reports")


@lab_reports_bp.get("/")
def _info():
    return jsonify(
        {
            "data": {
                "endpoints": {
                    "create": "POST /api/v1/lab-reports",
                    "list_for_batch": "GET /api/v1/lab-reports/batch/<batch_id>",
                }
            },
            "error": None,
        }
    )
