"""
Delivery Confirmation Model
"""
from datetime import datetime
from .. import db


class DeliveryConfirmation(db.Model):
    __tablename__ = 'delivery_confirmations'

    confirmation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    trip_id = db.Column(db.Integer, db.ForeignKey('trips.trip_id'), nullable=False, index=True)
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)

    receiver_id = db.Column(db.String(50), nullable=False)  # lab:<id> or processor:<id>
    receiver_name = db.Column(db.String(255), nullable=True)
    receiver_department = db.Column(db.String(255), nullable=True)
    confirmation_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), default='Pending', nullable=False)  # Confirmed, Pending, Disputed
    digital_signature = db.Column(db.String(500), nullable=True)
    receipt_url = db.Column(db.String(500), nullable=True)
    integrity_status = db.Column(db.String(50), nullable=True)  # verified, disputed

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<DeliveryConfirmation {self.confirmation_id} - Batch {self.batch_id} - {self.status}>'

    def to_dict(self):
        return {
            'confirmation_id': self.confirmation_id,
            'trip_id': self.trip_id,
            'batch_id': self.batch_id,
            'receiver_id': self.receiver_id,
            'receiver_name': self.receiver_name,
            'receiver_department': self.receiver_department,
            'confirmation_time': self.confirmation_time.isoformat() if self.confirmation_time else None,
            'status': self.status,
            'digital_signature': self.digital_signature,
            'receipt_url': self.receipt_url,
            'integrity_status': self.integrity_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
