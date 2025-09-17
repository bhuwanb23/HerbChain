"""
Transporter Report Model
"""
from datetime import datetime
from .. import db


class TransporterReport(db.Model):
    __tablename__ = 'transporter_reports'

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    transporter_id = db.Column(db.Integer, db.ForeignKey('transporter_profiles.transporter_id'), nullable=False, index=True)

    # Aggregated metrics (e.g., monthly)
    period = db.Column(db.String(20), nullable=True)  # e.g., '2025-09' or '2025-W37'
    trip_count = db.Column(db.Integer, default=0, nullable=False)
    on_time_percentage = db.Column(db.Float, nullable=True)
    average_distance = db.Column(db.Float, nullable=True)
    average_delivery_time_minutes = db.Column(db.Integer, nullable=True)
    earnings_total = db.Column(db.Numeric(12, 2), nullable=True)
    earnings_pending = db.Column(db.Numeric(12, 2), nullable=True)
    earnings_bonuses = db.Column(db.Numeric(12, 2), nullable=True)
    eco_compliance_score = db.Column(db.Float, nullable=True)

    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<TransporterReport {self.report_id} - Transporter {self.transporter_id} - {self.period}>'

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'transporter_id': self.transporter_id,
            'period': self.period,
            'trip_count': self.trip_count,
            'on_time_percentage': self.on_time_percentage,
            'average_distance': self.average_distance,
            'average_delivery_time_minutes': self.average_delivery_time_minutes,
            'earnings_total': float(self.earnings_total) if self.earnings_total is not None else None,
            'earnings_pending': float(self.earnings_pending) if self.earnings_pending is not None else None,
            'earnings_bonuses': float(self.earnings_bonuses) if self.earnings_bonuses is not None else None,
            'eco_compliance_score': self.eco_compliance_score,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
