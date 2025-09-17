"""
Lab Report Model
"""
from datetime import datetime
from .. import db


class LabReport(db.Model):
    __tablename__ = 'lab_reports'

    report_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('lab_profiles.lab_id'), nullable=False, index=True)

    summary_result = db.Column(db.String(20), nullable=True)  # Pass/Fail
    compliance_certification = db.Column(db.String(100), nullable=True)  # ISO/AYUSH/GACP
    report_file_link = db.Column(db.String(500), nullable=True)

    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<LabReport {self.report_id} - Batch {self.batch_id} - {self.summary_result}>'

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'batch_id': self.batch_id,
            'lab_id': self.lab_id,
            'summary_result': self.summary_result,
            'compliance_certification': self.compliance_certification,
            'report_file_link': self.report_file_link,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
