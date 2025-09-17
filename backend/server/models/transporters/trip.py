"""
Trip Model
"""
from datetime import datetime
from .. import db


class Trip(db.Model):
    __tablename__ = 'trips'

    trip_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    transporter_id = db.Column(db.Integer, db.ForeignKey('transporter_profiles.transporter_id'), nullable=False, index=True)
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)

    pickup_location = db.Column(db.String(100), nullable=True)  # lat,lon
    drop_location = db.Column(db.String(255), nullable=True)    # lab/processor location
    route_summary = db.Column(db.String(255), nullable=True)    # e.g., "Hub → District"

    start_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    eta_time = db.Column(db.DateTime, nullable=True)
    scheduled_time = db.Column(db.DateTime, nullable=True)

    status = db.Column(db.String(20), default='Pending', nullable=False)  # Pending, Active, Completed, Failed
    distance_travelled = db.Column(db.Float, nullable=True)
    progress_percent = db.Column(db.Float, nullable=True)
    current_location = db.Column(db.String(255), nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    compliance_note = db.Column(db.String(255), nullable=True)
    herb_type_cache = db.Column(db.String(255), nullable=True)  # denormalized from batch species

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    transfers = db.relationship('BatchTransfer', backref='trip', lazy=True, cascade='all, delete-orphan')
    confirmations = db.relationship('DeliveryConfirmation', backref='trip', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('TransporterPayment', backref='trip', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Trip {self.trip_id} - Batch {self.batch_id} - {self.status}>'

    def to_dict(self):
        return {
            'trip_id': self.trip_id,
            'transporter_id': self.transporter_id,
            'batch_id': self.batch_id,
            'pickup_location': self.pickup_location,
            'drop_location': self.drop_location,
            'route_summary': self.route_summary,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'eta_time': self.eta_time.isoformat() if self.eta_time else None,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'status': self.status,
            'distance_travelled': self.distance_travelled,
            'progress_percent': self.progress_percent,
            'current_location': self.current_location,
            'duration_minutes': self.duration_minutes,
            'compliance_note': self.compliance_note,
            'herb_type': self.herb_type_cache,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
