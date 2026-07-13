"""
FarmProfile — extended info about a farmer's land.

One-to-one with `User` (only farmer-role users have one). Optional metadata
that powers the weather feature, the crop calendar, and the regulator reports.
"""
from datetime import datetime

from . import db


SOIL_TYPES = (
    "alluvial",
    "black",
    "red",
    "laterite",
    "sandy",
    "loamy",
    "clay",
    "saline",
    "other",
)

IRRIGATION_TYPES = (
    "rainfed",
    "drip",
    "sprinkler",
    "flood",
    "borewell",
    "canal",
    "mixed",
    "other",
)


class FarmProfile(db.Model):
    __tablename__ = "farm_profiles"

    farm_id = db.Column(db.String(50), primary_key=True)

    farmer_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    farm_name = db.Column(db.String(120), nullable=True)
    land_size_acres = db.Column(db.Numeric(10, 2), nullable=True)

    soil_type = db.Column(
        db.Enum(*SOIL_TYPES, name="farm_soil_type"),
        nullable=True,
    )
    irrigation_type = db.Column(
        db.Enum(*IRRIGATION_TYPES, name="farm_irrigation_type"),
        nullable=True,
    )

    # JSON list of certifications, e.g. ["organic", "gap", "good_agri_practices"].
    certifications = db.Column(db.JSON, nullable=False, default=list)

    address = db.Column(db.String(300), nullable=True)
    gps_lat = db.Column(db.Float, nullable=True)
    gps_lng = db.Column(db.Float, nullable=True)

    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    farmer = db.relationship("User", foreign_keys=[farmer_id])

    def __repr__(self):
        return f"<FarmProfile {self.farm_id} farmer={self.farmer_id}>"

    def to_dict(self) -> dict:
        return {
            "farm_id": self.farm_id,
            "farmer_id": self.farmer_id,
            "farm_name": self.farm_name,
            "land_size_acres": float(self.land_size_acres)
            if self.land_size_acres is not None
            else None,
            "soil_type": self.soil_type,
            "irrigation_type": self.irrigation_type,
            "certifications": self.certifications or [],
            "address": self.address,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
