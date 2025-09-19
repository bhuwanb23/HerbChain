"""
Transport Records Model - Tracks transport journeys and logistics
"""
from datetime import datetime
from . import db

class TransportRecord(db.Model):
    """Transport record for tracking herb transportation"""
    __tablename__ = 'transport_records'
    
    # Primary Key
    transport_id = db.Column(db.String(50), primary_key=True)
    
    # Herb and Transporter Information
    batch_id = db.Column(db.String(50), db.ForeignKey('herbs.batch_id'), nullable=False)
    transporter_id = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    
    # Location Information
    pickup_location = db.Column(db.String(200), nullable=False)
    dropoff_location = db.Column(db.String(200), nullable=False)
    
    # Timing Information
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)  # Can be null if still in transit
    
    # Tracking Information
    gps_tracking_url = db.Column(db.String(500), nullable=True)
    
    # Status
    status = db.Column(db.Enum('in_transit', 'delivered', 'delayed', 'cancelled', name='transport_status'), default='in_transit', nullable=False)
    
    # Additional Information
    estimated_duration = db.Column(db.Integer, nullable=True)  # in minutes
    actual_duration = db.Column(db.Integer, nullable=True)  # in minutes
    distance_km = db.Column(db.Numeric(10, 2), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<TransportRecord {self.transport_id} - {self.batch_id} - {self.status}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'transport_id': self.transport_id,
            'batch_id': self.batch_id,
            'transporter_id': self.transporter_id,
            'pickup_location': self.pickup_location,
            'dropoff_location': self.dropoff_location,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'gps_tracking_url': self.gps_tracking_url,
            'status': self.status,
            'estimated_duration': self.estimated_duration,
            'actual_duration': self.actual_duration,
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_transport(cls, transport_id, batch_id, transporter_id, pickup_location, dropoff_location, start_time, **kwargs):
        """Create a new transport record"""
        if not all([transport_id, batch_id, transporter_id, pickup_location, dropoff_location, start_time]):
            raise ValueError("Missing required fields")
        
        transport = cls(
            transport_id=transport_id,
            batch_id=batch_id,
            transporter_id=transporter_id,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            start_time=start_time,
            **kwargs
        )
        return transport
    
    def complete_transport(self, end_time=None):
        """Mark transport as completed"""
        self.status = 'delivered'
        self.end_time = end_time or datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        # Calculate actual duration if start_time is available
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            self.actual_duration = int(duration.total_seconds() / 60)  # Convert to minutes
    
    def update_status(self, new_status, notes=None):
        """Update transport status"""
        self.status = new_status
        if notes:
            self.notes = notes
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_active_transports(cls, transporter_id=None):
        """Get all active transport records"""
        query = cls.query.filter_by(status='in_transit')
        if transporter_id:
            query = query.filter_by(transporter_id=transporter_id)
        return query.all()
    
    @classmethod
    def get_transport_history(cls, batch_id):
        """Get transport history for a specific batch"""
        return cls.query.filter_by(batch_id=batch_id).order_by(cls.start_time.desc()).all()
