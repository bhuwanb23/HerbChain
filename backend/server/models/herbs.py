"""
Herb model — immutable facts about a harvested batch.

All mutable state (current holder, phase, test_result, active QR token) lives
in `BatchState`. The audit timeline lives in `BatchEvent`.
"""
from datetime import datetime

from . import db


class Herb(db.Model):
    __tablename__ = "herbs"

    batch_id = db.Column(db.String(50), primary_key=True)
    farmer_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=False,
        index=True,
    )

    species_name = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    harvest_date = db.Column(db.Date, nullable=False)

    location = db.Column(db.String(200), nullable=False)
    gps_lat = db.Column(db.Float, nullable=True)
    gps_lng = db.Column(db.Float, nullable=True)

    weight_kg = db.Column(db.Numeric(10, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    state = db.relationship(
        "BatchState",
        backref="herb",
        uselist=False,
        cascade="all, delete-orphan",
    )
    events = db.relationship(
        "BatchEvent",
        backref="herb",
        order_by="BatchEvent.created_at.asc()",
        cascade="all, delete-orphan",
    )
    lab_reports = db.relationship(
        "LabReport",
        backref="herb",
        order_by="LabReport.created_at.desc()",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Herb {self.batch_id} species={self.species_name}>"

    def to_dict(self) -> dict:
        return {
            "batch_id": self.batch_id,
            "farmer_id": self.farmer_id,
            "species_name": self.species_name,
            "image_url": self.image_url,
            "harvest_date": self.harvest_date.isoformat() if self.harvest_date else None,
            "location": self.location,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "weight_kg": float(self.weight_kg) if self.weight_kg is not None else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
