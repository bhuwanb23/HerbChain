"""
BatchEvent — single append-only timeline of everything that ever happened to
a herb batch. Replaces the old `ownership_transfers` and `transport_records`
tables, which had overlapping responsibilities.

Every state change pushes a new row here; analytics, traceability, and
consumer-facing journey views all read from this table.
"""
from datetime import datetime

from . import db


EVENT_TYPE_CHOICES = (
    "CREATED",                      # farmer registers a new batch
    "TRANSFER",                     # ownership scan: from_party -> to_party
    "LAB_REPORT",                   # lab files a quality report
    "PRODUCT_LINK",                 # manufacturer consumes the batch into a product
    "INTENT_LAB_REQUEST",           # lab has expressed intent to test this batch
    "INTENT_MANUFACTURER_ORDER",    # manufacturer wants to order this batch
)


class BatchEvent(db.Model):
    __tablename__ = "batch_events"

    event_id = db.Column(db.String(50), primary_key=True)

    batch_id = db.Column(
        db.String(50),
        db.ForeignKey("herbs.batch_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    event_type = db.Column(
        db.Enum(*EVENT_TYPE_CHOICES, name="batch_event_type"),
        nullable=False,
        index=True,
    )

    actor_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=False,
    )
    from_party_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=True,
    )
    to_party_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=True,
    )

    # snapshot of phase BEFORE -> AFTER, useful for replay & auditing
    phase_before = db.Column(db.String(50), nullable=True)
    phase_after = db.Column(db.String(50), nullable=True)

    location = db.Column(db.String(200), nullable=True)
    gps_lat = db.Column(db.Float, nullable=True)
    gps_lng = db.Column(db.Float, nullable=True)

    # Arbitrary structured details (lab report id, product id, distance_km, etc.)
    payload_json = db.Column(db.JSON, nullable=True)

    # The signed QR token that authorised this event (for audit). May be empty
    # for events that don't involve a scan (e.g. CREATED, LAB_REPORT).
    qr_token = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    actor = db.relationship("User", foreign_keys=[actor_id])
    from_party = db.relationship("User", foreign_keys=[from_party_id])
    to_party = db.relationship("User", foreign_keys=[to_party_id])

    def __repr__(self):
        return (
            f"<BatchEvent {self.event_id} type={self.event_type} "
            f"batch={self.batch_id}>"
        )

    def to_dict(self, expand_parties: bool = False) -> dict:
        out = {
            "event_id": self.event_id,
            "batch_id": self.batch_id,
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "from_party_id": self.from_party_id,
            "to_party_id": self.to_party_id,
            "phase_before": self.phase_before,
            "phase_after": self.phase_after,
            "location": self.location,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "payload": self.payload_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if expand_parties:
            out["actor"] = self.actor.to_dict(include_email=False) if self.actor else None
            out["from_party"] = (
                self.from_party.to_dict(include_email=False) if self.from_party else None
            )
            out["to_party"] = (
                self.to_party.to_dict(include_email=False) if self.to_party else None
            )
        return out
