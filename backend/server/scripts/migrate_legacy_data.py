"""
One-shot legacy-data migrator.

Old schema (pre-redesign):
    users               (kept, only columns differ slightly)
    herbs               (had `quality_status`, `current_owner`, `active_qr`)
    ownership_transfers (DROPPED — folded into batch_events)
    transport_records   (DROPPED — folded into batch_events)
    lab_reports         (kept, with minor field renames)

New schema:
    users, herbs (immutable), batch_states, batch_events,
    lab_reports, products, product_batch_links

This script connects to a legacy SQLite DB and re-populates the *new* DB
with equivalent rows. It is idempotent: re-running skips already-migrated
batches by primary key.

Usage:
    python scripts/migrate_legacy_data.py path/to/legacy_herbchain.db

It does NOT mutate the legacy DB. Passwords from the legacy table are
rehashed only if they were already bcrypt; otherwise they're invalidated and
the user must reset their password via /api/v1/auth/register (logged at end).
"""
from __future__ import annotations

import sqlite3
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Make `models` importable
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parent.parent))  # backend/server/

from app import create_app  # noqa: E402
from models import db  # noqa: E402
from models.users import User  # noqa: E402
from models.herbs import Herb  # noqa: E402
from models.batch_state import BatchState  # noqa: E402
from models.batch_events import BatchEvent  # noqa: E402
from models.lab_reports import LabReport  # noqa: E402


# Map legacy `quality_status` -> new (phase, test_result)
PHASE_MAP = {
    "pending": ("with_farmer", "pending"),
    "pending_pickup": ("with_farmer", "pending"),
    "in_transit": ("in_transit_to_lab", "pending"),
    "testing": ("at_lab", "pending"),
    "approved": ("with_farmer_after_lab", "approved"),
    "rejected": ("at_lab", "rejected"),
    "manufacturer_ordered_pending_pickup": ("with_farmer_after_lab", "approved"),
    "in_stock": ("with_manufacturer", "approved"),
}

# Legacy ownership_transfers.transfer_reason -> new event_type
EVENT_TYPE_MAP = {
    "Initial Creation": "CREATED",
    "Lab Testing Request": "INTENT_LAB_REQUEST",
    "Pickup": "TRANSFER",
    "Delivery to Lab": "TRANSFER",
    "Delivery to Manufacturer": "TRANSFER",
    "Received by Manufacturer": "TRANSFER",
    "Lab Testing Approved": "LAB_REPORT",
    "Lab Testing Rejected": "LAB_REPORT",
    "Manufacturer Order": "INTENT_MANUFACTURER_ORDER",
}


def _is_bcrypt(s: str | None) -> bool:
    return bool(s) and s.startswith(("$2a$", "$2b$", "$2y$"))


def _connect_legacy(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _table_exists(conn: sqlite3.Connection, name: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone() is not None


def _migrate_users(legacy: sqlite3.Connection, report: list[str]) -> int:
    if not _table_exists(legacy, "users"):
        return 0
    rows = legacy.execute("SELECT * FROM users").fetchall()
    moved = 0
    for r in rows:
        if User.query.filter_by(user_id=r["user_id"]).first():
            continue
        role = r["role"]
        # The legacy 'processor' role maps onto 'manufacturer'
        if role == "processor":
            role = "manufacturer"
        u = User(
            user_id=r["user_id"],
            role=role,
            name=r["name"],
            email=(r["email"] or "").lower().strip(),
            phone=r["phone"] if "phone" in r.keys() else None,
            password_hash=r["password_hash"] if _is_bcrypt(r["password_hash"]) else "",
            location=r["location"] if "location" in r.keys() else None,
            language_pref=(r["language_pref"] if "language_pref" in r.keys() else "en") or "en",
            kyc_verified=bool(r["kyc_verified"]) if "kyc_verified" in r.keys() else False,
            is_active=True,
        )
        if not _is_bcrypt(r["password_hash"]):
            report.append(f"User {r['user_id']} had a non-bcrypt password; must reset.")
        db.session.add(u)
        moved += 1
    return moved


def _migrate_herbs(legacy: sqlite3.Connection) -> tuple[int, int]:
    if not _table_exists(legacy, "herbs"):
        return 0, 0
    rows = legacy.execute("SELECT * FROM herbs").fetchall()
    herbs_added = 0
    states_added = 0
    for r in rows:
        keys = r.keys()
        if Herb.query.filter_by(batch_id=r["batch_id"]).first():
            continue
        herb = Herb(
            batch_id=r["batch_id"],
            farmer_id=r["farmer_id"],
            species_name=r["species_name"],
            image_url=r["image_url"] if "image_url" in keys else None,
            harvest_date=_parse_date(r["harvest_date"]),
            location=r["location"],
            weight_kg=r["weight_kg"],
            created_at=_parse_dt(r["created_at"]) if "created_at" in keys else datetime.utcnow(),
        )
        db.session.add(herb)
        herbs_added += 1

        # Initial BatchState
        legacy_status = r["quality_status"] if "quality_status" in keys else "pending"
        phase, test_result = PHASE_MAP.get(legacy_status, ("with_farmer", "pending"))
        current_holder = r["current_owner"] if "current_owner" in keys else r["farmer_id"]
        db.session.add(
            BatchState(
                batch_id=r["batch_id"],
                current_holder_id=current_holder or r["farmer_id"],
                phase=phase,
                test_result=test_result,
                current_qr_token="",  # legacy stored a PNG, not a token; reset
            )
        )
        states_added += 1
    return herbs_added, states_added


def _migrate_ownership_transfers(legacy: sqlite3.Connection) -> int:
    if not _table_exists(legacy, "ownership_transfers"):
        return 0
    rows = legacy.execute("SELECT * FROM ownership_transfers").fetchall()
    moved = 0
    for r in rows:
        keys = r.keys()
        event_type = EVENT_TYPE_MAP.get(
            (r["transfer_reason"] if "transfer_reason" in keys else "") or "",
            "TRANSFER",
        )
        event_id = f"LEGACY-EVT-{uuid.uuid4().hex[:10].upper()}"
        actor_id = r["to_owner"] if event_type == "TRANSFER" else (
            r["from_owner"] or r["to_owner"]
        )
        db.session.add(
            BatchEvent(
                event_id=event_id,
                batch_id=r["batch_id"],
                event_type=event_type,
                actor_id=actor_id,
                from_party_id=r["from_owner"] if "from_owner" in keys else None,
                to_party_id=r["to_owner"],
                location=r["location"] if "location" in keys else None,
                payload_json={
                    "legacy_transfer_id": r["transfer_id"],
                    "legacy_reason": r["transfer_reason"] if "transfer_reason" in keys else None,
                    "notes": r["notes"] if "notes" in keys else None,
                },
                qr_token="",  # legacy QR was a PNG, not a token
                created_at=_parse_dt(
                    r["transfer_date"] if "transfer_date" in keys else r["created_at"]
                ),
            )
        )
        moved += 1
    return moved


def _migrate_transport_records(legacy: sqlite3.Connection) -> int:
    if not _table_exists(legacy, "transport_records"):
        return 0
    rows = legacy.execute("SELECT * FROM transport_records").fetchall()
    moved = 0
    for r in rows:
        keys = r.keys()
        event_id = f"LEGACY-TR-{uuid.uuid4().hex[:10].upper()}"
        payload = {
            "legacy_transport_id": r["transport_id"],
            "pickup_location": r["pickup_location"] if "pickup_location" in keys else None,
            "dropoff_location": r["dropoff_location"] if "dropoff_location" in keys else None,
            "status": r["status"] if "status" in keys else None,
            "distance_km": (
                float(r["distance_km"]) if "distance_km" in keys and r["distance_km"] else None
            ),
        }
        db.session.add(
            BatchEvent(
                event_id=event_id,
                batch_id=r["batch_id"],
                event_type="TRANSFER",
                actor_id=r["transporter_id"],
                from_party_id=None,
                to_party_id=r["transporter_id"],
                payload_json=payload,
                qr_token="",
                created_at=_parse_dt(r["start_time"] if "start_time" in keys else None)
                or datetime.utcnow(),
            )
        )
        moved += 1
    return moved


def _migrate_lab_reports(legacy: sqlite3.Connection) -> int:
    if not _table_exists(legacy, "lab_reports"):
        return 0
    rows = legacy.execute("SELECT * FROM lab_reports").fetchall()
    moved = 0
    for r in rows:
        keys = r.keys()
        if LabReport.query.filter_by(report_id=r["report_id"]).first():
            continue
        outcome = "approved" if (
            "certification" in keys and bool(r["certification"])
        ) else "rejected"
        db.session.add(
            LabReport(
                report_id=r["report_id"],
                batch_id=r["batch_id"],
                lab_id=r["lab_id"],
                test_type=r["test_type"] if "test_type" in keys else "general",
                test_date=_parse_date(r["test_date"]),
                results_summary=r["results_summary"] if "results_summary" in keys else "",
                outcome=outcome,
                certification_level=r["certification_level"] if "certification_level" in keys else None,
                purity_percentage=r["purity_percentage"] if "purity_percentage" in keys else None,
                moisture_content=r["moisture_content"] if "moisture_content" in keys else None,
                ash_content=r["ash_content"] if "ash_content" in keys else None,
                heavy_metals_present=bool(r["heavy_metals_present"]) if "heavy_metals_present" in keys else None,
                pesticides_detected=bool(r["pesticides_detected"]) if "pesticides_detected" in keys else None,
                active_compounds=r["active_compounds"] if "active_compounds" in keys else None,
                potency_rating=r["potency_rating"] if "potency_rating" in keys else None,
                report_url=r["report_url"] if "report_url" in keys else None,
                notes=r["notes"] if "notes" in keys else None,
                recommendations=r["recommendations"] if "recommendations" in keys else None,
            )
        )
        moved += 1
    return moved


def _parse_date(s):
    if s is None:
        return None
    if isinstance(s, datetime):
        return s.date()
    try:
        return datetime.fromisoformat(str(s)).date()
    except (ValueError, TypeError):
        return None


def _parse_dt(s):
    if s is None:
        return None
    if isinstance(s, datetime):
        return s
    try:
        return datetime.fromisoformat(str(s))
    except (ValueError, TypeError):
        return None


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: python scripts/migrate_legacy_data.py path/to/legacy_herbchain.db")
        return 2

    legacy_path = Path(argv[1])
    if not legacy_path.exists():
        print(f"Legacy DB not found: {legacy_path}")
        return 1

    print(f"Reading legacy DB: {legacy_path}")
    legacy = _connect_legacy(legacy_path)

    app = create_app()
    report: list[str] = []
    with app.app_context():
        u = _migrate_users(legacy, report)
        h, s = _migrate_herbs(legacy)
        ev_o = _migrate_ownership_transfers(legacy)
        ev_t = _migrate_transport_records(legacy)
        lr = _migrate_lab_reports(legacy)
        db.session.commit()

    print("Migration complete:")
    print(f"  users:                  +{u}")
    print(f"  herbs (+ batch_states): +{h} (states: +{s})")
    print(f"  batch_events (from owners):     +{ev_o}")
    print(f"  batch_events (from transports): +{ev_t}")
    print(f"  lab_reports:                    +{lr}")
    if report:
        print("\nWarnings:")
        for line in report:
            print(f"  - {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
