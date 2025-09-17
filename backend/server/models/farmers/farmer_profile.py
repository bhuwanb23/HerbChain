"""
Farmer Profile Model
Stores farmer's personal and farm details
"""
from datetime import datetime
from .. import db


class FarmerProfile(db.Model):
    """Farmer Profile Model"""
    __tablename__ = 'farmer_profiles'
    
    # Primary Key
    farmer_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Personal Information
    name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    language_preference = db.Column(db.String(10), default='en')  # en, hi, te, etc.
    
    # Address Information
    address = db.Column(db.Text, nullable=True)  # village, district, state
    gps_location = db.Column(db.String(100), nullable=True)  # lat, lon of farm
    
    # Farm Details
    land_area = db.Column(db.Float, nullable=True)  # hectares/acre
    farming_type = db.Column(db.String(20), nullable=True)  # organic / conventional
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    herb_batches = db.relationship('HerbBatch', backref='farmer', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='farmer', lazy=True, cascade='all, delete-orphan')
    training_progress = db.relationship('TrainingProgress', backref='farmer', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<FarmerProfile {self.farmer_id}: {self.name}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'farmer_id': self.farmer_id,
            'name': self.name,
            'phone_number': self.phone_number,
            'language_preference': self.language_preference,
            'address': self.address,
            'gps_location': self.gps_location,
            'land_area': self.land_area,
            'farming_type': self.farming_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            name=data.get('name'),
            phone_number=data.get('phone_number'),
            password_hash=data.get('password_hash'),
            language_preference=data.get('language_preference', 'en'),
            address=data.get('address'),
            gps_location=data.get('gps_location'),
            land_area=data.get('land_area'),
            farming_type=data.get('farming_type')
        )
