"""
Herbs Model - Stores herb batch information and current ownership
"""
from datetime import datetime
from . import db

class Herb(db.Model):
    """Herb model for raw materials created by farmers"""
    __tablename__ = 'herbs'
    
    # Primary Key
    batch_id = db.Column(db.String(50), primary_key=True)
    
    # Farmer Information
    farmer_id = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    
    # Herb Details
    species_name = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    harvest_date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    weight_kg = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Quality and Status
    quality_status = db.Column(
        db.Enum('pending', 'pending_pickup', 'in_transit', 'testing', 'approved', 'rejected', 'manufacturer_ordered_pending_pickup', name='quality_status'),
        default='pending',
        nullable=False
    )
    
    # Ownership Information
    current_owner = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    active_qr = db.Column(db.String(500), nullable=True)  # Current active QR code
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    ownership_transfers = db.relationship('OwnershipTransfer', backref='herb_batch', lazy=True, cascade='all, delete-orphan')
    transport_records = db.relationship('TransportRecord', backref='herb_batch', lazy=True, cascade='all, delete-orphan')
    lab_reports = db.relationship('LabReport', backref='herb_batch', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Herb {self.batch_id} - {self.species_name} - Owner: {self.current_owner}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'batch_id': self.batch_id,
            'farmer_id': self.farmer_id,
            'species_name': self.species_name,
            'image_url': self.image_url,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'location': self.location,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'quality_status': self.quality_status,
            'current_owner': self.current_owner,
            'active_qr': self.active_qr,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_herb(cls, batch_id, farmer_id, species_name, harvest_date, location, weight_kg, **kwargs):
        """Create a new herb batch with validation"""
        if not all([batch_id, farmer_id, species_name, harvest_date, location, weight_kg]):
            raise ValueError("Missing required fields")
        
        if weight_kg <= 0:
            raise ValueError("Weight must be positive")
        
        herb = cls(
            batch_id=batch_id,
            farmer_id=farmer_id,
            species_name=species_name,
            harvest_date=harvest_date,
            location=location,
            weight_kg=weight_kg,
            current_owner=farmer_id,  # Initially owned by farmer
            **kwargs
        )
        return herb
    
    def transfer_ownership(self, new_owner_id, new_qr_code):
        """Transfer ownership to new owner and update QR code"""
        self.current_owner = new_owner_id
        self.active_qr = new_qr_code
        self.updated_at = datetime.utcnow()
    
    def get_ownership_history(self):
        """Get complete ownership transfer history"""
        return self.ownership_transfers.order_by(OwnershipTransfer.transfer_date.desc()).all()
