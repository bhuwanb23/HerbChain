"""
Training Progress Model
Farmer's training progress and completion status
"""
from datetime import datetime
from .. import db


class TrainingProgress(db.Model):
    """Training Progress Model"""
    __tablename__ = 'training_progress'
    
    # Primary Key
    progress_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Foreign Keys
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer_profiles.farmer_id'), nullable=False, index=True)
    training_id = db.Column(db.Integer, db.ForeignKey('training_content.training_id'), nullable=False, index=True)
    
    # Progress Information
    status = db.Column(db.String(20), default='Not Started', nullable=False)  # Not Started, In Progress, Completed
    score = db.Column(db.Float, nullable=True)  # optional quiz result, if added later
    completion_percentage = db.Column(db.Float, default=0.0, nullable=False)  # 0.0 to 100.0
    
    # Timestamps
    last_accessed = db.Column(db.DateTime, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint to prevent duplicate progress records
    __table_args__ = (db.UniqueConstraint('farmer_id', 'training_id', name='unique_farmer_training'),)
    
    def __repr__(self):
        return f'<TrainingProgress {self.progress_id}: {self.farmer_id} - {self.training_id} ({self.status})>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'progress_id': self.progress_id,
            'farmer_id': self.farmer_id,
            'training_id': self.training_id,
            'status': self.status,
            'score': self.score,
            'completion_percentage': self.completion_percentage,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create model instance from dictionary"""
        return cls(
            farmer_id=data.get('farmer_id'),
            training_id=data.get('training_id'),
            status=data.get('status', 'Not Started'),
            score=data.get('score'),
            completion_percentage=data.get('completion_percentage', 0.0),
            last_accessed=data.get('last_accessed'),
            started_at=data.get('started_at'),
            completed_at=data.get('completed_at')
        )
    
    @property
    def is_completed(self):
        """Check if training is completed"""
        return self.status == 'Completed'
    
    @property
    def is_in_progress(self):
        """Check if training is in progress"""
        return self.status == 'In Progress'
    
    @property
    def is_not_started(self):
        """Check if training is not started"""
        return self.status == 'Not Started'
    
    def mark_started(self):
        """Mark training as started"""
        if self.is_not_started:
            self.status = 'In Progress'
            self.started_at = datetime.utcnow()
            self.last_accessed = datetime.utcnow()
    
    def mark_completed(self, score=None):
        """Mark training as completed"""
        self.status = 'Completed'
        self.completion_percentage = 100.0
        self.completed_at = datetime.utcnow()
        self.last_accessed = datetime.utcnow()
        if score is not None:
            self.score = score
    
    def update_progress(self, percentage):
        """Update training progress percentage"""
        if self.is_not_started:
            self.mark_started()
        
        self.completion_percentage = min(100.0, max(0.0, percentage))
        self.last_accessed = datetime.utcnow()
        
        if self.completion_percentage >= 100.0 and not self.is_completed:
            self.mark_completed()
