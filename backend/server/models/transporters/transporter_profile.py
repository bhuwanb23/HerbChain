"""
Transporter Profile Model
"""
from datetime import datetime
from .. import db


class TransporterProfile(db.Model):
    __tablename__ = 'transporter_profiles'

    transporter_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    vehicle_type = db.Column(db.String(50), nullable=True)  # bike, van, truck
    vehicle_number = db.Column(db.String(50), nullable=True)
    license_number = db.Column(db.String(100), nullable=True)

    address = db.Column(db.Text, nullable=True)
    gps_device_id = db.Column(db.String(100), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    trips = db.relationship('Trip', backref='transporter', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('TransporterPayment', backref='transporter', lazy=True, cascade='all, delete-orphan')
    reports = db.relationship('TransporterReport', backref='transporter', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TransporterProfile {self.transporter_id}: {self.name}>'

    def to_dict(self):
        return {
            'transporter_id': self.transporter_id,
            'name': self.name,
            'phone_number': self.phone_number,
            'vehicle_type': self.vehicle_type,
            'vehicle_number': self.vehicle_number,
            'license_number': self.license_number,
            'address': self.address,
            'gps_device_id': self.gps_device_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
