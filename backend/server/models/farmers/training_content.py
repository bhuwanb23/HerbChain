"""
Training Content Model
Training content and modules
"""
from datetime import datetime
from .. import db


class TrainingContent(db.Model):
    """Training Content Model"""
    __tablename__ = 'training_content'
    
    # Primary Key
    training_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Content Information
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    content_url = db.Column(db.String(500), nullable=True)  # video/pdf/text link
    language = db.Column(db.String(10), default='en', nullable=False)  # en, hi, te, etc.
    
    # Content Type and Category
    content_type = db.Column(db.String(50), nullable=True)  # video, pdf, text, interactive
    category = db.Column(db.String(100), nullable=True)  # farming_techniques, sustainability, etc.
    difficulty_level = db.Column(db.String(20), nullable=True)  # beginner, intermediate, advanced
    
    # Metadata
    duration_minutes = db.Column(db.Integer, nullable=True)  # estimated duration
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    training_progress = db.relationship('TrainingProgress', backref='training_content', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<TrainingContent {self.training_id}: {self.title}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'training_id': self.training_id,
            'title': self.title,
            'description': self.description,
            'content_url': self.content_url,
            'language': self.language,
            'content_type': self.content_type,
            'category': self.category,
            'difficulty_level': self.difficulty_level,
            'duration_minutes': self.duration_minutes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            title=data.get('title'),
            description=data.get('description'),
            content_url=data.get('content_url'),
            language=data.get('language', 'en'),
            content_type=data.get('content_type'),
            category=data.get('category'),
            difficulty_level=data.get('difficulty_level'),
            duration_minutes=data.get('duration_minutes'),
            is_active=data.get('is_active', True)
        )
    
    @property
    def is_available(self):
        """Check if training content is available and active"""
        return self.is_active and self.content_url is not None
