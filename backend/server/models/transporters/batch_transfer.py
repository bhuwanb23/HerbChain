"""
Batch Transfer Model
"""
from datetime import datetime
from .. import db


class BatchTransfer(db.Model):
    __tablename__ = 'batch_transfers'

    transfer_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    trip_id = db.Column(db.Integer, db.ForeignKey('trips.trip_id'), nullable=False, index=True)
    batch_id = db.Column(db.String(36), db.ForeignKey('herb_batches.batch_id'), nullable=False, index=True)

    scanned_by = db.Column(db.String(50), nullable=True)  # transporter:<id>, lab:<id>, processor:<id>
    scan_type = db.Column(db.String(20), nullable=False)  # Pickup, Transit, Delivery
    scan_timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    geo_location = db.Column(db.String(100), nullable=True)
    remarks = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<BatchTransfer {self.transfer_id} - Batch {self.batch_id} - {self.scan_type}>'

    def to_dict(self):
        return {
            'transfer_id': self.transfer_id,
            'trip_id': self.trip_id,
            'batch_id': self.batch_id,
            'scanned_by': self.scanned_by,
            'scan_type': self.scan_type,
            'scan_timestamp': self.scan_timestamp.isoformat() if self.scan_timestamp else None,
            'geo_location': self.geo_location,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
