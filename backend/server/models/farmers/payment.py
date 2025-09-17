"""
Payment Model
Keeps track of payments to farmers
"""
from datetime import datetime
from .. import db


class Payment(db.Model):
    """Payment Model"""
    __tablename__ = 'payments'
    
    # Primary Key
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Foreign Keys
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.farmer_id'), nullable=False, index=True)
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=True, index=True)
    
    # Payment Details
    amount = db.Column(db.Numeric(10, 2), nullable=False)  # Amount in currency
    payment_type = db.Column(db.String(50), nullable=False)  # Incentive, Bonus, Base Price, Sustainability Credit
    status = db.Column(db.String(20), default='Pending', nullable=False)  # Pending, Completed, Failed
    
    # Transaction Details
    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_reference = db.Column(db.String(255), nullable=True)  # UPI/Bank ref
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Payment {self.payment_id}: {self.amount} - {self.payment_type}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'payment_id': self.payment_id,
            'farmer_id': self.farmer_id,
            'batch_id': self.batch_id,
            'amount': float(self.amount) if self.amount else None,
            'payment_type': self.payment_type,
            'status': self.status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'transaction_reference': self.transaction_reference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            farmer_id=data.get('farmer_id'),
            batch_id=data.get('batch_id'),
            amount=data.get('amount'),
            payment_type=data.get('payment_type'),
            status=data.get('status', 'Pending'),
            payment_date=data.get('payment_date'),
            transaction_reference=data.get('transaction_reference')
        )
    
    @property
    def is_completed(self):
        """Check if payment is completed"""
        return self.status == 'Completed'
    
    @property
    def is_pending(self):
        """Check if payment is pending"""
        return self.status == 'Pending'
