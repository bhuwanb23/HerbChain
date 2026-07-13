"""
WeatherSnapshot — cached weather provider response.

The weather_service rounds (lat, lng) to 2dp and reuses cached snapshots for
~1 hour to stay under the free-tier limits and to give the app a deterministic
demo experience when offline.
"""
from datetime import datetime

from . import db


class WeatherSnapshot(db.Model):
    __tablename__ = "weather_snapshots"

    snapshot_id = db.Column(db.String(50), primary_key=True)

    # Rounded to ~1km precision so neighbouring farms share a snapshot.
    gps_lat = db.Column(db.Float, nullable=False, index=True)
    gps_lng = db.Column(db.Float, nullable=False, index=True)

    provider = db.Column(db.String(40), nullable=False, default="openweathermap")
    payload_json = db.Column(db.JSON, nullable=False)

    fetched_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, index=True
    )

    def __repr__(self):
        return (
            f"<WeatherSnapshot {self.snapshot_id} "
            f"({self.gps_lat:.2f},{self.gps_lng:.2f}) "
            f"@ {self.fetched_at.isoformat() if self.fetched_at else '?'}>"
        )

    def to_dict(self) -> dict:
        return {
            "snapshot_id": self.snapshot_id,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "provider": self.provider,
            "payload": self.payload_json,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
        }
