/** Wire serializers for the shipments module (Phase 7 logistics). */

function serializeUser(u) {
  return u ? { id: u.id, name: u.name, role: u.role } : null;
}

function serializeAssignment(a) {
  return {
    id: a.id,
    transporter_user_id: a.transporter_user_id,
    assigned_by_user_id: a.assigned_by_user_id,
    status: a.status,
    assigned_at: a.assigned_at,
    decided_at: a.decided_at ?? null,
    decline_reason: a.decline_reason ?? null,
  };
}

function serializeMetric(m) {
  return m
    ? {
        expected_hours: m.expected_hours,
        actual_hours: m.actual_hours,
        delay_minutes: m.delay_minutes,
        delay_reason: m.delay_reason ?? null,
        computed_at: m.computed_at,
      }
    : null;
}

function serializePod(p) {
  return p
    ? {
        id: p.id,
        receiver_name: p.receiver_name ?? null,
        receiver_signature: p.receiver_signature ?? null,
        receiver_photo_url: p.receiver_photo_url ?? null,
        delivery_photo_url: p.delivery_photo_url ?? null,
        remarks: p.remarks ?? null,
        uploaded_by_user_id: p.uploaded_by_user_id ?? null,
        uploaded_at: p.uploaded_at,
      }
    : null;
}

function serializeShipmentEvent(e) {
  return {
    id: e.id,
    event_type: e.event_type,
    event_data: e.event_data ?? null,
    created_by_user_id: e.created_by_user_id ?? null,
    created_at: e.created_at,
  };
}

/**
 * Main shipment wire shape. `extra` may carry { batch } (resolved ref row)
 * for detail views; nested arrays are included only when the loader fetched
 * them (detail/timeline endpoints).
 */
function serializeShipment(s, extra = {}) {
  return {
    id: s.id,
    shipment_no: s.shipment_no,
    ref: { type: s.ref_type, id: s.ref_id },
    batch: extra.batch || null,
    shipment_type: s.shipment_type,
    priority: s.priority,
    status: s.status,
    parties: {
      requested_by: serializeUser(s.requested_by),
      from: serializeUser(s.from_user || s.from),
      from_role: s.from_role ?? null,
      to: serializeUser(s.to_user || s.to),
      to_role: s.to_role ?? null,
      transporter: serializeUser(s.transporter),
    },
    route: {
      origin_location: s.origin_location ?? null,
      origin_gps: { lat: s.origin_gps_lat ?? null, lng: s.origin_gps_lng ?? null },
      destination_location: s.destination_location ?? null,
      destination_gps: { lat: s.destination_gps_lat ?? null, lng: s.destination_gps_lng ?? null },
      geofence_radius_m: s.geofence_radius_m ?? null,
    },
    quantity_kg: s.quantity_kg ?? null,
    quantity_units: s.quantity_units ?? null,
    scheduled_pickup_at: s.scheduled_pickup_at ?? null,
    expected_delivery_at: s.expected_delivery_at ?? null,
    actual_pickup_at: s.actual_pickup_at ?? null,
    arrived_destination_at: s.arrived_destination_at ?? null,
    delivered_at: s.delivered_at ?? null,
    failure_reason: s.failure_reason ?? null,
    notes: s.notes ?? null,
    assignments: (s.assignments || []).map(serializeAssignment),
    metric: serializeMetric(s.metric),
    proof: serializePod(s.proof),
    tracking: (s.tracking || []).map((t) => ({
      id: t.id,
      gps: { lat: t.gps_lat, lng: t.gps_lng },
      speed_kph: t.speed_kph ?? null,
      accuracy_m: t.accuracy_m ?? null,
      captured_at: t.captured_at,
      captured_by_user_id: t.captured_by_user_id ?? null,
      note: t.note ?? null,
    })),
    pickup_events: (s.pickup_events || []).map((p) => ({
      id: p.id,
      transporter_user_id: p.transporter_user_id,
      pickup: { lat: p.pickup_lat ?? null, lng: p.pickup_lng ?? null, accuracy_m: p.accuracy_m ?? null },
      photo_url: p.photo_url ?? null,
      remarks: p.remarks ?? null,
      pickup_time: p.pickup_time,
    })),
    delivery_events: (s.delivery_events || []).map((d) => ({
      id: d.id,
      receiver_user_id: d.receiver_user_id,
      receiver_role: d.receiver_role,
      delivery: { lat: d.delivery_lat ?? null, lng: d.delivery_lng ?? null, accuracy_m: d.accuracy_m ?? null },
      remarks: d.remarks ?? null,
      delivered_at: d.delivered_at,
    })),
    documents: (s.documents || []).map((d) => ({
      id: d.id,
      document_type: d.document_type,
      document_url: d.document_url ?? null,
      document_asset_id: d.document_asset_id ?? null,
      uploaded_by_user_id: d.uploaded_by_user_id ?? null,
      created_at: d.created_at,
    })),
    failed_logs: (s.failed_logs || []).map((f) => ({
      id: f.id,
      reason: f.reason,
      photo_url: f.photo_url ?? null,
      remarks: f.remarks ?? null,
      created_by_user_id: f.created_by_user_id ?? null,
      created_at: f.created_at,
    })),
    timeline: (s.events || []).map(serializeShipmentEvent),
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

module.exports = { serializeShipment, serializeShipmentEvent, serializePod };
