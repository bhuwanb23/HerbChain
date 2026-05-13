"""
Seed the local SQLite database with a complete demo dataset.

Usage (from `backend/server`):

    python scripts/seed_demo.py            # idempotent: re-uses existing users
    python scripts/seed_demo.py --fresh    # wipe DB first then seed

After running, the following credentials are valid:

    farmer1 / farmerpass
    transporter1 / transpass
    lab1 / labpass
    manufacturer1 / mfgpass
    consumer1 / conspass
    admin / adminpass

You can log in to the mobile app or website with these.
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import date, timedelta
from pathlib import Path

# Make `models`, `services`, etc. importable when run as a script.
SERVER_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_ROOT))

from app import create_app  # noqa: E402
from models import db  # noqa: E402
from models.batch_events import BatchEvent  # noqa: E402
from models.batch_state import BatchState  # noqa: E402
from models.herbs import Herb  # noqa: E402
from models.lab_reports import LabReport  # noqa: E402
from models.products import Product, ProductBatchLink  # noqa: E402
from models.users import User  # noqa: E402
from services import qr_service, transfer_service  # noqa: E402


DEMO_USERS = [
    {
        "user_id": "FARMER001",
        "role": "farmer",
        "name": "Demo Farmer",
        "email": "farmer1@herbchain.local",
        "password": "farmerpass",
        "location": "Bengaluru, KA",
        "gps_lat": 12.9716,
        "gps_lng": 77.5946,
        "kyc_verified": True,
    },
    {
        "user_id": "TRANS001",
        "role": "transporter",
        "name": "Demo Transporter",
        "email": "transporter1@herbchain.local",
        "password": "transpass",
        "location": "Bengaluru, KA",
        "kyc_verified": True,
    },
    {
        "user_id": "LAB001",
        "role": "lab",
        "name": "AYUSH Test Lab",
        "email": "lab1@herbchain.local",
        "password": "labpass",
        "location": "Bengaluru, KA",
        "kyc_verified": True,
    },
    {
        "user_id": "MFG001",
        "role": "manufacturer",
        "name": "Demo Manufacturer",
        "email": "manufacturer1@herbchain.local",
        "password": "mfgpass",
        "location": "Mysuru, KA",
        "kyc_verified": True,
    },
    {
        "user_id": "CONS001",
        "role": "consumer",
        "name": "Demo Consumer",
        "email": "consumer1@herbchain.local",
        "password": "conspass",
    },
    {
        "user_id": "ADMIN001",
        "role": "admin",
        "name": "System Admin",
        "email": "admin@herbchain.local",
        "password": "adminpass",
    },
]


def _wipe():
    """Drop every row in every table — useful for `--fresh`."""
    print("Wiping existing data…")
    for model in (
        BatchEvent,
        ProductBatchLink,
        Product,
        LabReport,
        BatchState,
        Herb,
        User,
    ):
        deleted = db.session.query(model).delete()
        print(f"  {model.__tablename__}: {deleted} rows")
    db.session.commit()


def _get_or_create_users() -> dict[str, User]:
    out = {}
    for spec in DEMO_USERS:
        existing = User.query.filter_by(user_id=spec["user_id"]).first()
        if existing:
            # always re-hash the password so demo creds stay known
            existing.set_password(spec["password"])
            existing.is_active = True
            db.session.add(existing)
            out[spec["role"]] = existing
            continue
        user = User.create(**spec)
        db.session.add(user)
        out[spec["role"]] = user
    db.session.commit()
    return out


def _new_batch(farmer: User, species: str, weight: float, location: str) -> Herb:
    herb, state, event, token = transfer_service.create_batch(
        farmer=farmer,
        species_name=species,
        harvest_date=date.today() - timedelta(days=3),
        location=location,
        weight_kg=weight,
        gps_lat=farmer.gps_lat,
        gps_lng=farmer.gps_lng,
        notes="Seeded demo batch",
    )
    print(f"  created {herb.batch_id} ({species}) — phase=with_farmer")
    return herb


def _transfer(batch_id: str, scanner: User, location: str | None = None):
    state = BatchState.query.filter_by(batch_id=batch_id).first()
    if state is None:
        raise RuntimeError(f"No state for {batch_id}")
    result = transfer_service.transfer_by_scan(
        batch_id=batch_id,
        scanner=scanner,
        scanned_qr_token=state.current_qr_token,
        location=location or scanner.location,
    )
    print(
        f"  transfer {batch_id}: {result.from_phase} -> {result.to_phase}"
        f" (now held by {scanner.role}:{scanner.user_id})"
    )
    return result


def _file_lab_report(batch_id: str, lab: User, outcome: str = "approved"):
    import uuid

    state = BatchState.query.filter_by(batch_id=batch_id).first()
    report = LabReport(
        report_id=f"REPORT-{uuid.uuid4().hex[:10].upper()}",
        batch_id=batch_id,
        lab_id=lab.user_id,
        test_type="full_panel",
        test_date=date.today(),
        results_summary="Demo seed lab report — all metrics nominal.",
        outcome=outcome,
        certification_level="A" if outcome == "approved" else None,
        purity_percentage=98.5 if outcome == "approved" else 62.0,
        moisture_content=8.4,
        ash_content=4.1,
        heavy_metals_present=False,
        pesticides_detected=False,
    )
    db.session.add(report)
    state.test_result = outcome

    event = BatchEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
        batch_id=batch_id,
        event_type="LAB_REPORT",
        actor_id=lab.user_id,
        from_party_id=None,
        to_party_id=lab.user_id,
        phase_before=state.phase,
        phase_after=state.phase,
        location=lab.location,
        payload_json={"report_id": report.report_id, "outcome": outcome},
    )
    db.session.add(event)
    db.session.commit()
    print(f"  lab report filed for {batch_id}: outcome={outcome}")


def _create_product(manufacturer: User, name: str, batch_ids: list[str]):
    import uuid

    product_id = f"PROD-{uuid.uuid4().hex[:8].upper()}"
    token = qr_service.issue_product_qr(product_id=product_id)
    product = Product(
        product_id=product_id,
        manufacturer_id=manufacturer.user_id,
        name=name,
        sku=f"DEMO-{product_id[-4:]}",
        qr_token=token,
        description="Demo seed product",
    )
    db.session.add(product)

    for bid in batch_ids:
        link = ProductBatchLink(
            product_id=product_id,
            batch_id=bid,
            quantity_kg=1.0,
        )
        db.session.add(link)

        state = BatchState.query.filter_by(batch_id=bid).first()
        if state and state.phase == "with_manufacturer":
            state.phase = "consumed"
            db.session.add(state)

        event = BatchEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
            batch_id=bid,
            event_type="PRODUCT_LINK",
            actor_id=manufacturer.user_id,
            from_party_id=None,
            to_party_id=manufacturer.user_id,
            phase_before="with_manufacturer",
            phase_after="consumed",
            payload_json={"product_id": product_id, "quantity_kg": 1.0},
        )
        db.session.add(event)

    db.session.commit()
    print(f"  product {product_id} ({name}) linked to {len(batch_ids)} batches")
    return product


def seed(fresh: bool = False):
    app = create_app()
    with app.app_context():
        # Belt-and-braces: ensure tables exist even if migrations haven't run.
        db.create_all()

        if fresh:
            _wipe()

        print("Creating demo users…")
        users = _get_or_create_users()
        farmer = users["farmer"]
        transporter = users["transporter"]
        lab = users["lab"]
        manufacturer = users["manufacturer"]

        existing_batches = Herb.query.count()
        if existing_batches >= 3 and not fresh:
            print(
                f"Found {existing_batches} existing batches — skipping batch seeding."
                " Use --fresh to re-seed."
            )
            _summary()
            return

        print("\nSeeding batches at different phases…")
        b1 = _new_batch(farmer, "Ashwagandha", 10.0, farmer.location)
        b2 = _new_batch(farmer, "Tulsi", 7.5, farmer.location)
        b3 = _new_batch(farmer, "Brahmi", 5.0, farmer.location)

        # Batch 2 -> in transit to lab
        _transfer(b2.batch_id, transporter)

        # Batch 3 -> in transit to lab -> at lab -> approved -> in transit to manufacturer -> with manufacturer -> product
        _transfer(b3.batch_id, transporter)
        _transfer(b3.batch_id, lab)
        _file_lab_report(b3.batch_id, lab, outcome="approved")
        _transfer(b3.batch_id, transporter)
        _transfer(b3.batch_id, manufacturer)

        _create_product(manufacturer, "Demo Triphala Mix", [b3.batch_id])

        _summary()


def _summary():
    print("\n=== Seed summary ===")
    print(f"Users:     {User.query.count()}")
    print(f"Batches:   {Herb.query.count()}")
    print(f"Events:    {BatchEvent.query.count()}")
    print(f"Reports:   {LabReport.query.count()}")
    print(f"Products:  {Product.query.count()}")
    print("\nLogin credentials (identifier / password):")
    for u in DEMO_USERS:
        print(f"  {u['email']:35} / {u['password']}   ({u['role']})")
    print("\nDone. Start the backend with `flask --app app run` or `make run-backend`.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Wipe the database before seeding",
    )
    args = parser.parse_args()
    seed(fresh=args.fresh)


if __name__ == "__main__":
    main()
