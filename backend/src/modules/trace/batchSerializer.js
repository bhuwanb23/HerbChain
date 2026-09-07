/** Wire serializers for the batch module. */
const { statusLabel } = require("../../constants/batch");

function serializeBatch(batch) {
  return {
    id: batch.id,
    code: batch.code,
    status: statusLabel(batch.phase, batch.test_status),
    phase: batch.phase,
    test_status: batch.test_status,
    species: batch.species,
    farmer: batch.farmer,
    harvest_date: batch.harvest_date,
    weight_kg: batch.weight_kg,
    cultivation_type: batch.cultivation_type,
    attributes: batch.attributes_json,
    location: batch.location,
    gps: { lat: batch.gps_lat, lng: batch.gps_lng, accuracy_m: batch.gps_accuracy_m ?? null },
    images: (batch.images || []).map((d) => ({
      id: d.asset.id,
      url: d.asset.url,
      filename: d.asset.filename,
      mime_type: d.asset.mime_type,
      doc_kind: d.doc_kind,
      is_primary: d.is_primary,
      metadata: d.asset.metadata_json,
      attached_at: d.created_at,
    })),
    notes: batch.notes,
    created_at: batch.created_at,
  };
}

function serializeEvent(e) {
  return {
    id: e.id,
    event_type: e.event_type,
    actor: e.actor ? { id: e.actor.id, name: e.actor.name, role: e.actor.role } : null,
    from_user: e.from_user ? { id: e.from_user.id, name: e.from_user.name, role: e.from_user.role } : null,
    to_user: e.to_user ? { id: e.to_user.id, name: e.to_user.name, role: e.to_user.role } : null,
    phase_before: e.phase_before,
    phase_after: e.phase_after,
    location: e.location,
    gps: e.gps_lat != null ? { lat: e.gps_lat, lng: e.gps_lng } : null,
    payload: e.payload_json,
    created_at: e.created_at,
  };
}

module.exports = { serializeBatch, serializeEvent };
