"""
CropPlan — a farmer's planting/harvest schedule for a single species + plot.

Drives the in-app crop calendar and "days until harvest" reminders.
"""
from datetime import datetime

from . import db


CROP_PLAN_STATUS = (
    "planned",     # decided on paper, not yet sown
    "sown",        # seeds in the ground
    "growing",     # active growth phase
    "harvested",   # finished, batch should have been registered
    "cancelled",   # abandoned (e.g. weather damage)
)


class CropPlan(db.Model):
    __tablename__ = "crop_plans"

    plan_id = db.Column(db.String(50), primary_key=True)

    farmer_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    species_id = db.Column(
        db.String(50),
        db.ForeignKey("herb_catalogue.species_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    area_acres = db.Column(db.Numeric(10, 2), nullable=True)
    planting_date = db.Column(db.Date, nullable=False)
    expected_harvest_date = db.Column(db.Date, nullable=False)
    actual_harvest_date = db.Column(db.Date, nullable=True)

    status = db.Column(
        db.Enum(*CROP_PLAN_STATUS, name="crop_plan_status"),
        nullable=False,
        default="planned",
        index=True,
    )

    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    farmer = db.relationship("User", foreign_keys=[farmer_id])
    species = db.relationship("HerbCatalogue", foreign_keys=[species_id])

    def __repr__(self):
        return (
            f"<CropPlan {self.plan_id} farmer={self.farmer_id} "
            f"species={self.species_id} status={self.status}>"
        )

    def to_dict(self, include_species: bool = False) -> dict:
        out = {
            "plan_id": self.plan_id,
            "farmer_id": self.farmer_id,
            "species_id": self.species_id,
            "area_acres": float(self.area_acres) if self.area_acres is not None else None,
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "expected_harvest_date": self.expected_harvest_date.isoformat()
            if self.expected_harvest_date
            else None,
            "actual_harvest_date": self.actual_harvest_date.isoformat()
            if self.actual_harvest_date
            else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_species and self.species is not None:
            out["species"] = {
                "species_id": self.species.species_id,
                "common_name": self.species.common_name,
                "scientific_name": self.species.scientific_name,
                "image_url": self.species.image_url,
            }
        return out
