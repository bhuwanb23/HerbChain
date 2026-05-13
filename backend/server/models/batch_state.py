"""
BatchState — the mutable, denormalized "now" of a batch.

One row per Herb. Updated atomically by the transfer service whenever a scan
succeeds. Old QR tokens are invalidated by overwriting `current_qr_token`.
"""
from datetime import datetime

from . import db


PHASE_CHOICES = (
    "with_farmer",                # newly created or returned to farmer after lab
    "in_transit_to_lab",          # transporter is carrying it to the lab
    "at_lab",                     # lab has received it and may test
    "with_farmer_after_lab",      # lab released the batch back to farmer (approved)
    "in_transit_to_manufacturer", # transporter is carrying it to the manufacturer
    "with_manufacturer",          # manufacturer holds it; may link into Product
    "consumed",                   # terminal — used up in a Product, can no longer transfer
)

TEST_RESULT_CHOICES = ("pending", "approved", "rejected")


class BatchState(db.Model):
    __tablename__ = "batch_states"

    batch_id = db.Column(
        db.String(50),
        db.ForeignKey("herbs.batch_id", ondelete="CASCADE"),
        primary_key=True,
    )

    current_holder_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=False,
        index=True,
    )

    phase = db.Column(
        db.Enum(*PHASE_CHOICES, name="batch_phase"),
        nullable=False,
        default="with_farmer",
        index=True,
    )

    test_result = db.Column(
        db.Enum(*TEST_RESULT_CHOICES, name="batch_test_result"),
        nullable=False,
        default="pending",
    )

    # The signed JWT/HMAC token that the current QR encodes. Used to verify
    # subsequent scans. Empty string means "no active QR" (e.g. consumed).
    current_qr_token = db.Column(db.Text, nullable=False, default="")

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return (
            f"<BatchState {self.batch_id} phase={self.phase} "
            f"holder={self.current_holder_id}>"
        )

    def to_dict(self) -> dict:
        return {
            "batch_id": self.batch_id,
            "current_holder_id": self.current_holder_id,
            "phase": self.phase,
            "test_result": self.test_result,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
