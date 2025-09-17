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
    scan_type = db.Column(db.String(20), nullable=False)  # Pickup, Transit, Delivery, Checkpoint
    scan_timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    geo_location = db.Column(db.String(100), nullable=True)
    location_name = db.Column(db.String(255), nullable=True)  # e.g., "Warehouse A - Downtown"
    checkpoint_index = db.Column(db.Integer, nullable=True)  # order in timeline
    is_current = db.Column(db.Boolean, default=False, nullable=False)
    expected_time = db.Column(db.DateTime, nullable=True)
    verified = db.Column(db.Boolean, default=False, nullable=False)
    blockchain_tx_hash = db.Column(db.String(128), nullable=True)
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
            'location_name': self.location_name,
            'checkpoint_index': self.checkpoint_index,
            'is_current': self.is_current,
            'expected_time': self.expected_time.isoformat() if self.expected_time else None,
            'verified': self.verified,
            'blockchain_tx_hash': self.blockchain_tx_hash,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
