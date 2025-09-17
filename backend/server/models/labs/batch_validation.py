"""
Batch Validation Model
"""
from datetime import datetime
from .. import db


class BatchValidation(db.Model):
    __tablename__ = 'batch_validations'

    validation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    batch_id = db.Column(db.Integer, db.ForeignKey('received_batches.received_id'), nullable=False, index=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('lab_profiles.lab_id'), nullable=False, index=True)

    validation_status = db.Column(db.String(20), default='Pending', nullable=False)  # Approved, Rejected, Pending
    validation_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    digital_signature = db.Column(db.String(500), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<BatchValidation {self.validation_id} - RB {self.batch_id} - {self.validation_status}>'

    def to_dict(self):
        return {
            'validation_id': self.validation_id,
            'received_batch_id': self.batch_id,
            'lab_id': self.lab_id,
            'validation_status': self.validation_status,
            'validation_date': self.validation_date.isoformat() if self.validation_date else None,
            'comments': self.comments,
            'digital_signature': self.digital_signature,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
