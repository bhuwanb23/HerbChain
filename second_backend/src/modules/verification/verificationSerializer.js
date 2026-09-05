/** Wire serializers for the consumer verification module (Phase 11). */

/** Admin/manufacturer scan list row — internal view (AYUSH forensics). */
function serializeScan(s) {
  return {
    id: s.id,
    product: s.product ? { id: s.product.id, code: s.product.code, name: s.product.name } : null,
    lot_code: s.lot?.code || null,
    outcome: s.outcome,
    country: s.country || null,
    state: s.state || null,
    city: s.city || null,
    device_type: s.device_type,
    ip_address: s.ip_address || null,
    user_agent: s.user_agent || null,
    scanned_at: s.scanned_at,
  };
}

/** Counterfeit alert row (AYUSH / manufacturer visibility). */
function serializeAlert(a) {
  return {
    id: a.id,
    product: a.product ? { id: a.product.id, code: a.product.code, name: a.product.name } : null,
    reason: a.reason,
    severity: a.severity,
    status: a.status,
    detail: a.detail_json || null,
    detected_at: a.detected_at,
    resolved_by_user_id: a.resolved_by_user_id || null,
    resolved_at: a.resolved_at || null,
    resolution_note: a.resolution_note || null,
    created_at: a.created_at,
  };
}

module.exports = { serializeScan, serializeAlert };