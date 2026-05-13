"""
LabReport — structured lab test results attached to a batch.

The pass/fail outcome (approved / rejected) lives in `BatchState.test_result`;
this table holds the structured metrics and notes for audit.
"""
from datetime import datetime

from . import db


class LabReport(db.Model):
    __tablename__ = "lab_reports"

    report_id = db.Column(db.String(50), primary_key=True)

    batch_id = db.Column(
        db.String(50),
        db.ForeignKey("herbs.batch_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lab_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=False,
    )

    test_type = db.Column(db.String(100), nullable=False)
    test_date = db.Column(db.Date, nullable=False)
    results_summary = db.Column(db.Text, nullable=False)

    # Outcome
    outcome = db.Column(
        db.Enum("approved", "rejected", name="lab_outcome"),
        nullable=False,
    )
    certification_level = db.Column(db.String(50), nullable=True)

    # Quality metrics (all optional — different test types use different ones)
    purity_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    moisture_content = db.Column(db.Numeric(5, 2), nullable=True)
    ash_content = db.Column(db.Numeric(5, 2), nullable=True)
    heavy_metals_present = db.Column(db.Boolean, nullable=True)
    pesticides_detected = db.Column(db.Boolean, nullable=True)

    # Medicinal properties
    active_compounds = db.Column(db.Text, nullable=True)
    potency_rating = db.Column(db.String(20), nullable=True)

    report_url = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    lab = db.relationship("User", foreign_keys=[lab_id])

    def __repr__(self):
        return f"<LabReport {self.report_id} batch={self.batch_id} outcome={self.outcome}>"

    def to_dict(self) -> dict:
        return {
            "report_id": self.report_id,
            "batch_id": self.batch_id,
            "lab_id": self.lab_id,
            "test_type": self.test_type,
            "test_date": self.test_date.isoformat() if self.test_date else None,
            "results_summary": self.results_summary,
            "outcome": self.outcome,
            "certification_level": self.certification_level,
            "purity_percentage": float(self.purity_percentage) if self.purity_percentage is not None else None,
            "moisture_content": float(self.moisture_content) if self.moisture_content is not None else None,
            "ash_content": float(self.ash_content) if self.ash_content is not None else None,
            "heavy_metals_present": self.heavy_metals_present,
            "pesticides_detected": self.pesticides_detected,
            "active_compounds": self.active_compounds,
            "potency_rating": self.potency_rating,
            "report_url": self.report_url,
            "notes": self.notes,
            "recommendations": self.recommendations,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
