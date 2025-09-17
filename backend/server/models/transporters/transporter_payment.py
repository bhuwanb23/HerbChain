"""
Transporter Payment Model
"""
from datetime import datetime
from .. import db


class TransporterPayment(db.Model):
    __tablename__ = 'transporter_payments'

    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    transporter_id = db.Column(db.Integer, db.ForeignKey('transporter_profiles.transporter_id'), nullable=False, index=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.trip_id'), nullable=True, index=True)

    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)  # Delivery Fee, Bonus, Incentive
    status = db.Column(db.String(20), default='Pending', nullable=False)  # Pending, Completed, Failed
    transaction_title = db.Column(db.String(255), nullable=True)  # Weekly Payout, Bonus Payment, etc.
    transaction_type = db.Column(db.String(20), nullable=True)  # credit, debit, bonus, withdrawal

    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_reference = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<TransporterPayment {self.payment_id}: {self.amount} - {self.payment_type}>'

    def to_dict(self):
        return {
            'payment_id': self.payment_id,
            'transporter_id': self.transporter_id,
            'trip_id': self.trip_id,
            'amount': float(self.amount) if self.amount is not None else None,
            'payment_type': self.payment_type,
            'status': self.status,
            'transaction_title': self.transaction_title,
            'transaction_type': self.transaction_type,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'transaction_reference': self.transaction_reference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
