"""
Lab Profile Model
"""
from datetime import datetime
from .. import db


class LabProfile(db.Model):
    __tablename__ = 'lab_profiles'

    lab_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    lab_name = db.Column(db.String(255), nullable=False)
    contact_person = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    address = db.Column(db.Text, nullable=True)
    license_number = db.Column(db.String(100), nullable=True)  # AYUSH/FSSAI accreditation

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    received_batches = db.relationship('ReceivedBatch', backref='lab', lazy=True, cascade='all, delete-orphan')
    tests = db.relationship('QualityTest', backref='lab', lazy=True, cascade='all, delete-orphan')
    validations = db.relationship('BatchValidation', backref='lab', lazy=True, cascade='all, delete-orphan')
    reports = db.relationship('LabReport', backref='lab', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('LabPayment', backref='lab', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<LabProfile {self.lab_id}: {self.lab_name}>'

    def to_dict(self):
        return {
            'lab_id': self.lab_id,
            'lab_name': self.lab_name,
            'contact_person': self.contact_person,
            'phone_number': self.phone_number,
            'address': self.address,
            'license_number': self.license_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
