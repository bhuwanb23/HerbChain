"""
Users Model - Stores all system users with different roles
"""
from datetime import datetime
from . import db

class User(db.Model):
    """User model for all system participants"""
    __tablename__ = 'users'
    
    # Primary Key
    user_id = db.Column(db.String(50), primary_key=True)
    
    # User Role (farmer, transporter, lab, processor, consumer, admin)
    role = db.Column(db.Enum('farmer', 'transporter', 'lab', 'processor', 'consumer', 'admin', 'manufacturer', name='user_role'), nullable=False)
    
    # Basic Information
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Location and Preferences
    location = db.Column(db.String(200), nullable=True)
    language_pref = db.Column(db.String(10), default='en', nullable=False)
    
    # Verification Status
    kyc_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owned_herbs = db.relationship('Herb', foreign_keys='Herb.current_owner', backref='current_owner_user', lazy=True)
    created_herbs = db.relationship('Herb', foreign_keys='Herb.farmer_id', backref='farmer_user', lazy=True)
    ownership_transfers_from = db.relationship('OwnershipTransfer', foreign_keys='OwnershipTransfer.from_owner', backref='from_owner_user', lazy=True)
    ownership_transfers_to = db.relationship('OwnershipTransfer', foreign_keys='OwnershipTransfer.to_owner', backref='to_owner_user', lazy=True)
    transport_records = db.relationship('TransportRecord', backref='transporter_user', lazy=True)
    lab_reports = db.relationship('LabReport', backref='lab_user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.user_id} - {self.role} - {self.name}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'user_id': self.user_id,
            'role': self.role,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'location': self.location,
            'language_pref': self.language_pref,
            'kyc_verified': self.kyc_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_user(cls, user_id, role, name, email, password_hash, **kwargs):
        """Create a new user with validation"""
        if not all([user_id, role, name, email, password_hash]):
            raise ValueError("Missing required fields")
        
        if role not in ['farmer', 'transporter', 'lab', 'processor', 'consumer', 'admin', 'manufacturer']:
            raise ValueError("Invalid role")
        
        user = cls(
            user_id=user_id,
            role=role,
            name=name,
            email=email,
            password_hash=password_hash,
            **kwargs
        )
        return user
