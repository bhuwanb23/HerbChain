"""
Traceability service — builds the consumer-facing journey timeline.

Reads from BatchEvent (append-only) and joins on Herb, BatchState, LabReport,
Product, ProductBatchLink, and User to produce a single self-contained JSON
object the consumer app can render directly.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from models.batch_events import BatchEvent
from models.batch_state import BatchState
from models.herbs import Herb
from models.lab_reports import LabReport
from models.products import Product, ProductBatchLink
from models.users import User


# Map raw event_type -> human label, used by the mobile/web UI to colour the
# timeline. Kept here (not in the model) so it can be customised per release.
EVENT_LABELS = {
    "CREATED": "Harvested by farmer",
    "TRANSFER": "Custody changed",
    "LAB_REPORT": "Lab report filed",
    "PRODUCT_LINK": "Used in a product",
    "INTENT_LAB_REQUEST": "Lab requested testing",
    "INTENT_MANUFACTURER_ORDER": "Manufacturer placed order",
}


def _user_summary(user: Optional[User]) -> Optional[dict]:
    if not user:
        return None
    return {
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
        "location": user.location,
    }


def build_batch_journey(batch_id: str) -> Optional[dict]:
    """Return the full traceability bundle for a herb batch, or None if missing."""
    herb = Herb.query.filter_by(batch_id=batch_id).first()
    if herb is None:
        return None

    state = BatchState.query.filter_by(batch_id=batch_id).first()
    farmer = User.query.filter_by(user_id=herb.farmer_id).first()
    current_holder = (
        User.query.filter_by(user_id=state.current_holder_id).first()
        if state else None
    )

    events = (
        BatchEvent.query.filter_by(batch_id=batch_id)
        .order_by(BatchEvent.created_at.asc())
        .all()
    )

    # Group lab reports by id for inline embedding
    reports = LabReport.query.filter_by(batch_id=batch_id).all()
    reports_by_id = {r.report_id: r.to_dict() for r in reports}

    # Find any products this batch was linked into
    product_links = (
        ProductBatchLink.query.filter_by(batch_id=batch_id).all()
    )
    products = []
    for link in product_links:
        product = Product.query.filter_by(product_id=link.product_id).first()
        if product:
            products.append(
                {
                    **product.to_dict(),
                    "quantity_kg": float(link.quantity_kg)
                    if link.quantity_kg is not None
                    else None,
                }
            )

    timeline = []
    total_distance_km = 0.0
    for idx, ev in enumerate(events, start=1):
        from_user = _user_summary(ev.from_party) if ev.from_party_id else None
        to_user = _user_summary(ev.to_party) if ev.to_party_id else None
        actor = _user_summary(ev.actor) if ev.actor_id else None

        step = {
            "step": idx,
            "event_id": ev.event_id,
            "event_type": ev.event_type,
            "label": EVENT_LABELS.get(ev.event_type, ev.event_type),
            "occurred_at": ev.created_at.isoformat() if ev.created_at else None,
            "actor": actor,
            "from_party": from_user,
            "to_party": to_user,
            "phase_before": ev.phase_before,
            "phase_after": ev.phase_after,
            "location": ev.location,
            "gps_lat": ev.gps_lat,
            "gps_lng": ev.gps_lng,
            "payload": ev.payload_json,
        }

        if ev.payload_json and isinstance(ev.payload_json, dict):
            distance = ev.payload_json.get("distance_km")
            if isinstance(distance, (int, float)):
                total_distance_km += float(distance)

        # Inline the lab report if this event refers to one
        if ev.event_type == "LAB_REPORT" and ev.payload_json:
            report_id = ev.payload_json.get("report_id")
            if report_id and report_id in reports_by_id:
                step["lab_report"] = reports_by_id[report_id]

        timeline.append(step)

    created_at = herb.created_at or datetime.utcnow()
    total_days = max(0, (datetime.utcnow() - created_at).days)

    return {
        "batch_id": batch_id,
        "herb": herb.to_dict(),
        "state": state.to_dict() if state else None,
        "farmer": _user_summary(farmer),
        "current_holder": _user_summary(current_holder),
        "journey": timeline,
        "lab_reports": list(reports_by_id.values()),
        "products": products,
        "summary": {
            "total_steps": len(timeline),
            "total_days": total_days,
            "quality_certified": bool(state and state.test_result == "approved"),
            "total_distance_km": round(total_distance_km, 2),
            "current_phase": state.phase if state else None,
            "current_holder_id": state.current_holder_id if state else None,
        },
    }


def build_product_journey(product_id: str) -> Optional[dict]:
    """Return a product's lineage: itself + every linked source batch's journey."""
    product = Product.query.filter_by(product_id=product_id).first()
    if product is None:
        return None

    manufacturer = User.query.filter_by(user_id=product.manufacturer_id).first()

    source_batches = []
    for link in product.batch_links:
        journey = build_batch_journey(link.batch_id)
        if journey is None:
            continue
        source_batches.append(
            {
                "batch_id": link.batch_id,
                "quantity_kg": float(link.quantity_kg)
                if link.quantity_kg is not None
                else None,
                "journey": journey,
            }
        )

    return {
        "product": product.to_dict(),
        "manufacturer": _user_summary(manufacturer),
        "source_batches": source_batches,
        "summary": {
            "total_source_batches": len(source_batches),
            "all_certified": all(
                b["journey"]["summary"]["quality_certified"] for b in source_batches
            ),
        },
    }
