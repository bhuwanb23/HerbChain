"""
HerbCatalogue — master list of AYUSH herb species.

This is the source-of-truth for the species a farmer can register, the prices
the price-discovery feature shows, and the AI re-ranking step that turns a
generic plant classifier output into a known AYUSH species. Admin-curated.
"""
from datetime import datetime

from . import db


AYUSH_CATEGORIES = ("ayurveda", "unani", "siddha", "homeopathy", "general")


class HerbCatalogue(db.Model):
    __tablename__ = "herb_catalogue"

    species_id = db.Column(db.String(50), primary_key=True)

    common_name = db.Column(db.String(120), nullable=False, index=True)
    scientific_name = db.Column(db.String(160), nullable=False, index=True)

    ayush_category = db.Column(
        db.Enum(*AYUSH_CATEGORIES, name="ayush_category"),
        nullable=False,
        default="ayurveda",
    )

    # JSON list of alternate names/spellings, used by recognition_service for fuzzy matching.
    # e.g. ["Holy Basil", "Tulasi", "Sacred Basil", "Ocimum sanctum"]
    synonyms = db.Column(db.JSON, nullable=False, default=list)

    description = db.Column(db.Text, nullable=True)
    medicinal_uses = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

    season_planting = db.Column(db.String(80), nullable=True)
    season_harvest = db.Column(db.String(80), nullable=True)

    # Optional cached "current price" snapshot. The authoritative live price is
    # in `PriceQuote`; this is just convenient for catalogue list views.
    default_unit_price_inr = db.Column(db.Numeric(10, 2), nullable=True)

    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return f"<HerbCatalogue {self.species_id} {self.common_name!r}>"

    def to_dict(self, include_prices: bool = False) -> dict:
        out = {
            "species_id": self.species_id,
            "common_name": self.common_name,
            "scientific_name": self.scientific_name,
            "ayush_category": self.ayush_category,
            "synonyms": self.synonyms or [],
            "description": self.description,
            "medicinal_uses": self.medicinal_uses,
            "image_url": self.image_url,
            "season_planting": self.season_planting,
            "season_harvest": self.season_harvest,
            "default_unit_price_inr": float(self.default_unit_price_inr)
            if self.default_unit_price_inr is not None
            else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_prices:
            latest = (
                PriceQuote.query.filter_by(species_id=self.species_id)
                .order_by(PriceQuote.effective_at.desc())
                .first()
            )
            out["latest_price"] = latest.to_dict() if latest else None
        return out


class PriceQuote(db.Model):
    """Admin-curated market price per species. Latest one wins for display."""

    __tablename__ = "price_quotes"

    quote_id = db.Column(db.String(50), primary_key=True)

    species_id = db.Column(
        db.String(50),
        db.ForeignKey("herb_catalogue.species_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    price_per_kg_inr = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(8), nullable=False, default="INR")
    source = db.Column(db.String(40), nullable=False, default="admin")

    effective_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, index=True
    )
    created_by_admin_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=True,
    )
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    species = db.relationship("HerbCatalogue", foreign_keys=[species_id])
    admin = db.relationship("User", foreign_keys=[created_by_admin_id])

    def __repr__(self):
        return f"<PriceQuote {self.quote_id} species={self.species_id} price={self.price_per_kg_inr}>"

    def to_dict(self) -> dict:
        return {
            "quote_id": self.quote_id,
            "species_id": self.species_id,
            "price_per_kg_inr": float(self.price_per_kg_inr)
            if self.price_per_kg_inr is not None
            else None,
            "currency": self.currency,
            "source": self.source,
            "effective_at": self.effective_at.isoformat() if self.effective_at else None,
            "created_by_admin_id": self.created_by_admin_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
