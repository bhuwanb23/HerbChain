"""
Ownership Transfer Model - Tracks all ownership changes with QR codes
"""
from datetime import datetime
from . import db

class OwnershipTransfer(db.Model):
    """Ownership transfer log for tracking herb ownership changes"""
    __tablename__ = 'ownership_transfers'
    
    # Primary Key
    transfer_id = db.Column(db.String(50), primary_key=True)
    
    # Herb and Ownership Information
    batch_id = db.Column(db.String(50), db.ForeignKey('herbs.batch_id'), nullable=False)
    from_owner = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=True)  # Can be null for initial creation
    to_owner = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    
    # Transfer Details
    transfer_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    qr_code = db.Column(db.String(500), nullable=False)  # QR code generated for this transfer
    status = db.Column(db.Enum('active', 'inactive', name='qr_status'), default='active', nullable=False)
    
    # Additional Information
    transfer_reason = db.Column(db.String(200), nullable=True)  # e.g., "Pickup", "Delivery", "Lab Testing"
    location = db.Column(db.String(200), nullable=True)  # Where transfer occurred
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<OwnershipTransfer {self.transfer_id} - {self.batch_id} - {self.from_owner} → {self.to_owner}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'transfer_id': self.transfer_id,
            'batch_id': self.batch_id,
            'from_owner': self.from_owner,
            'to_owner': self.to_owner,
            'transfer_date': self.transfer_date.isoformat() if self.transfer_date else None,
            'qr_code': self.qr_code,
            'status': self.status,
            'transfer_reason': self.transfer_reason,
            'location': self.location,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_transfer(cls, transfer_id, batch_id, from_owner, to_owner, qr_code, **kwargs):
        """Create a new ownership transfer record"""
        if not all([transfer_id, batch_id, to_owner, qr_code]):
            raise ValueError("Missing required fields")
        
        transfer = cls(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=from_owner,
            to_owner=to_owner,
            qr_code=qr_code,
            **kwargs
        )
        return transfer
    
    def deactivate_qr(self):
        """Deactivate the QR code for this transfer"""
        self.status = 'inactive'
    
    @classmethod
    def get_transfer_history(cls, batch_id):
        """Get complete transfer history for a batch"""
        return cls.query.filter_by(batch_id=batch_id).order_by(cls.transfer_date.asc()).all()
    
    @classmethod
    def get_active_transfer(cls, batch_id):
        """Get the current active transfer for a batch"""
        return cls.query.filter_by(batch_id=batch_id, status='active').first()
