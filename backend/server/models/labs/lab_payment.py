"""
Lab Payment Model
"""
from datetime import datetime
from .. import db


class LabPayment(db.Model):
    __tablename__ = 'lab_payments'

    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    lab_id = db.Column(db.Integer, db.ForeignKey('lab_profiles.lab_id'), nullable=False, index=True)
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=True, index=True)

    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_status = db.Column(db.String(20), default='Pending', nullable=False)  # Pending, Completed, Failed

    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_reference = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<LabPayment {self.payment_id}: {self.amount} - {self.payment_status}>'

    def to_dict(self):
        return {
            'payment_id': self.payment_id,
            'lab_id': self.lab_id,
            'batch_id': self.batch_id,
            'amount': float(self.amount) if self.amount is not None else None,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'transaction_reference': self.transaction_reference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
