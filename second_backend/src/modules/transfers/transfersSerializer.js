/** Wire serializers for the transfers module (Phase 6). */

function serializeUser(u) {
  return u ? { id: u.id, name: u.name, role: u.role } : null;
}

function serializeProof(p) {
  return {
    id: p.id,
    transfer_request_id: p.transfer_request_id,
    ownership_history_id: p.ownership_history_id ?? null,
    photo: p.asset ? { id: p.asset.id, url: p.asset.url, filename: p.asset.filename } : null,
    photo_url: p.photo_url ?? null,
    sender_signature: p.sender_signature ?? null,
    receiver_signature: p.receiver_signature ?? null,
    remarks: p.remarks ?? null,
    created_by: serializeUser(p.created_by),
    created_at: p.created_at,
  };
}

function serializeRequest(r) {
  return {
    id: r.id,
    batch: r.batch
      ? { id: r.batch.id, code: r.batch.code, phase: r.batch.phase, current_holder_user_id: r.batch.current_holder_user_id }
      : null,
    from: serializeUser(r.from_user),
    from_role: r.from_role,
    to: serializeUser(r.to_user),
    to_role: r.to_role,
    type: r.type,
    status: r.status,
    reason: r.reason ?? null,
    rejection_reason: r.rejection_reason ?? null,
    created_by: serializeUser(r.created_by),
    approved_by: serializeUser(r.approved_by),
    decided_at: r.decided_at ?? null,
    completed_at: r.completed_at ?? null,
    batch_event_id: r.batch_event_id ?? null,
    proofs: (r.proofs || []).map(serializeProof),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function serializeTransferResult(out) {
  // Engine transfer payload + the completed request row.
  const { request, ...rest } = out;
  return {
    ...rest,
    request: request ? serializeRequest(request) : null,
  };
}

module.exports = { serializeRequest, serializeProof, serializeTransferResult };
