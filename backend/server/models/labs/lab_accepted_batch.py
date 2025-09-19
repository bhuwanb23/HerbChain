"""
Lab Accepted Batch Model
Stores the relationship between labs and herb batches they have accepted
"""
from datetime import datetime
from .. import db


class LabAcceptedBatch(db.Model):
    """Model to track which herb batches have been accepted by which labs"""
    __tablename__ = 'lab_accepted_batches'

    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Foreign Keys
    lab_id = db.Column(db.Integer, nullable=False, index=True)  # Lab that accepted the batch
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)
    
    # Acceptance details
    accepted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    lab_notes = db.Column(db.Text, nullable=True)  # Optional notes from lab
    validation_status = db.Column(db.String(20), default='Approved', nullable=False)  # Approved, Rejected
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<LabAcceptedBatch Lab {self.lab_id} accepted Batch {self.batch_id}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'lab_id': self.lab_id,
            'batch_id': self.batch_id,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'lab_notes': self.lab_notes,
            'validation_status': self.validation_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            lab_id=data.get('lab_id'),
            batch_id=data.get('batch_id'),
            lab_notes=data.get('lab_notes'),
            validation_status=data.get('validation_status', 'Approved')
        )
