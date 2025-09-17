"""
Herb Batch Model
Stores details when farmer registers a new herb batch
"""
import uuid
from datetime import datetime
from .. import db


class HerbBatch(db.Model):
    """Herb Batch Model"""
    __tablename__ = 'herb_batches'
    
    # Primary Key
    batch_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Key
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.farmer_id'), nullable=False, index=True)
    
    # Species Information
    species_detected = db.Column(db.String(255), nullable=True)  # from AI/Google Lens
    species_entered = db.Column(db.String(255), nullable=True)  # manual input, cross-check with AI
    
    # Media and Location
    image_url = db.Column(db.String(500), nullable=True)  # uploaded herb image, cloud/IPFS link
    geo_location = db.Column(db.String(100), nullable=True)  # lat, lon of collection
    
    # Farmer-entry details for frontend herb registration
    weight_kg = db.Column(db.Float, nullable=True)  # batch weight in kilograms
    harvest_date = db.Column(db.Date, nullable=True)
    cultivation_method = db.Column(db.String(50), nullable=True)  # organic, conventional, natural farming, etc.
    
    # Timestamps and Metadata
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    harvest_season = db.Column(db.String(50), nullable=True)  # auto-extracted from timestamp
    
    # Tracking
    qr_code = db.Column(db.String(500), nullable=True)  # unique link to batch
    status = db.Column(db.String(50), default='Registered', nullable=False)  # Registered, In Transit, Lab Validated, Processed, etc.
    remarks = db.Column(db.Text, nullable=True)  # optional notes from farmer
    
    # AI metadata (optional, supports frontend AIRecognition)
    ai_model = db.Column(db.String(100), nullable=True)
    ai_confidence = db.Column(db.Float, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships (trimmed to active models)
    
    def __repr__(self):
        return f'<HerbBatch {self.batch_id}: {self.species_entered or self.species_detected}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'batch_id': self.batch_id,
            'farmer_id': self.farmer_id,
            'species_detected': self.species_detected,
            'species_entered': self.species_entered,
            'image_url': self.image_url,
            'geo_location': self.geo_location,
            'weight_kg': self.weight_kg,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'cultivation_method': self.cultivation_method,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'harvest_season': self.harvest_season,
            'qr_code': self.qr_code,
            'status': self.status,
            'remarks': self.remarks,
            'notes': self.remarks,
            'ai_model': self.ai_model,
            'ai_confidence': self.ai_confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            farmer_id=data.get('farmer_id'),
            species_detected=data.get('species_detected'),
            species_entered=data.get('species_entered'),
            image_url=data.get('image_url'),
            geo_location=data.get('geo_location'),
            weight_kg=data.get('weight_kg'),
            harvest_date=data.get('harvest_date'),
            cultivation_method=data.get('cultivation_method'),
            harvest_season=data.get('harvest_season'),
            qr_code=data.get('qr_code'),
            status=data.get('status', 'Registered'),
            remarks=data.get('remarks'),
            ai_model=data.get('ai_model'),
            ai_confidence=data.get('ai_confidence'),
        )
    
    @property
    def is_active(self):
        """Check if batch is in active status"""
        active_statuses = ['Registered', 'In Transit', 'Lab Validated']
        return self.status in active_statuses
