"""
Quality Test Model
"""
from datetime import datetime
from .. import db


class QualityTest(db.Model):
    __tablename__ = 'quality_tests'

    test_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK to ReceivedBatch for test context and to LabProfile for lab attribution
    batch_id = db.Column(db.Integer, db.ForeignKey('received_batches.received_id'), nullable=False, index=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('lab_profiles.lab_id'), nullable=False, index=True)

    test_type = db.Column(db.String(50), nullable=False)  # Moisture, Pesticide, etc.
    test_result = db.Column(db.String(50), nullable=True)  # Pass/Fail
    result_value = db.Column(db.String(100), nullable=True)  # numeric or textual value
    unit = db.Column(db.String(50), nullable=True)  # %, mg/kg, etc.
    test_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    verified_by = db.Column(db.String(255), nullable=True)
    certificate_link = db.Column(db.String(500), nullable=True)  # URL/IPFS
    reference_range = db.Column(db.String(100), nullable=True)
    attachments_url = db.Column(db.String(500), nullable=True)  # uploaded files bundle
    file_count = db.Column(db.Integer, nullable=True)
    is_offline = db.Column(db.Boolean, default=False, nullable=False)
    synced_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<QualityTest {self.test_id} - RB {self.batch_id} - {self.test_type}>'

    def to_dict(self):
        return {
            'test_id': self.test_id,
            'received_batch_id': self.batch_id,
            'lab_id': self.lab_id,
            'test_type': self.test_type,
            'test_result': self.test_result,
            'result_value': self.result_value,
            'unit': self.unit,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'verified_by': self.verified_by,
            'certificate_link': self.certificate_link,
            'reference_range': self.reference_range,
            'attachments_url': self.attachments_url,
            'file_count': self.file_count,
            'is_offline': self.is_offline,
            'synced_at': self.synced_at.isoformat() if self.synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
