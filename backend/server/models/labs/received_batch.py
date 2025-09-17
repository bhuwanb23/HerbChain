"""
Received Batch Model
"""
from datetime import datetime
from .. import db


class ReceivedBatch(db.Model):
    __tablename__ = 'received_batches'

    received_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('lab_profiles.lab_id'), nullable=False, index=True)
    transporter_id = db.Column(db.Integer, db.ForeignKey('transporter_profiles.transporter_id'), nullable=True, index=True)

    received_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    condition_status = db.Column(db.String(20), nullable=True)  # Good, Damaged, Contaminated
    remarks = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<ReceivedBatch {self.received_id} - Batch {self.batch_id}>'

    def to_dict(self):
        return {
            'received_id': self.received_id,
            'batch_id': self.batch_id,
            'lab_id': self.lab_id,
            'transporter_id': self.transporter_id,
            'received_time': self.received_time.isoformat() if self.received_time else None,
            'condition_status': self.condition_status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
