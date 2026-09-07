/** Wire serializers for the laboratory module (Phase 8). */

function serializeSpecies(sp) {
  return sp ? { code: sp.code, common_name: sp.common_name, scientific_name: sp.scientific_name ?? null } : null;
}

function serializeReceipt(r) {
  return {
    id: r.id,
    receiver_name: r.receiver_name ?? null,
    received_quantity_kg: r.received_quantity_kg ?? null,
    condition_status: r.condition_status,
    remarks: r.remarks ?? null,
    received_at: r.received_at,
  };
}

function serializeSample(s) {
  return {
    id: s.id,
    sample_code: s.sample_code,
    batch: s.batch ? { id: s.batch.id, code: s.batch.code, species: serializeSpecies(s.batch.species), farmer: s.batch.farmer ? { id: s.batch.farmer.id, name: s.batch.farmer.name } : null } : null,
    batch_id: s.batch_id,
    sample_weight_kg: s.sample_weight_kg ?? null,
    collected_by_user_id: s.lab_user_id,
    collected_at: s.collected_at,
    remarks: s.remarks ?? null,
    tests: (s.tests || []).map((t) => ({
      id: t.id,
      test_name: t.test_name,
      test_category: t.test_category,
      status: t.status,
      outcome: t.outcome ?? null,
    })),
    created_at: s.created_at,
  };
}

function serializeResult(r) {
  return {
    id: r.id,
    parameter: r.parameter ? { code: r.parameter.code, name: r.parameter.name, category: r.parameter.category, unit: r.parameter.unit ?? null, method: r.parameter.method ?? null } : null,
    parameter_code: r.parameter?.code ?? null,
    observed_value: r.observed_value_numeric ?? null,
    observed_text: r.observed_text ?? null,
    unit: r.unit ?? null,
    acceptable_range: r.acceptable_range ?? null,
    result: r.result,
    notes: r.notes ?? null,
    updated_at: r.updated_at,
  };
}

function serializeReview(rv) {
  return {
    id: rv.id,
    review_status: rv.review_status,
    review_notes: rv.review_notes ?? null,
    reviewed_by_user_id: rv.reviewed_by_user_id,
    reviewer_role: rv.reviewer_role,
    reviewed_at: rv.reviewed_at,
  };
}

function serializeTest(t) {
  return {
    id: t.id,
    batch: t.batch ? { id: t.batch.id, code: t.batch.code } : null,
    batch_id: t.batch_id,
    sample: t.sample ? { id: t.sample.id, sample_code: t.sample.sample_code } : null,
    sample_id: t.sample_id,
    test_name: t.test_name,
    test_category: t.test_category,
    test_method: t.test_method ?? null,
    status: t.status,
    outcome: t.outcome ?? null,
    analyst_user_id: t.lab_user_id,
    started_at: t.started_at ?? null,
    completed_at: t.completed_at ?? null,
    notes: t.notes ?? null,
    results: (t.results || []).map(serializeResult),
    reviews: (t.reviews || []).map(serializeReview),
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

function serializeVerification(v) {
  return {
    id: v.id,
    farmer_species: v.farmer_species,
    ai_prediction_code: v.ai_prediction_code ?? null,
    lab_species: v.lab_species,
    status: v.status,
    verified_at: v.verified_at,
  };
}

function serializeCertification(c) {
  return {
    id: c.id,
    certificate_number: c.certificate_number,
    batch: c.batch ? { id: c.batch.id, code: c.batch.code, test_status: c.batch.test_status } : null,
    batch_id: c.batch_id,
    lab_code: c.lab_code ?? null,
    lab_name: c.lab_name ?? null,
    species: c.species ? serializeSpecies(c.species) : { code: c.species_code },
    species_code: c.species_code,
    sample_count: c.sample_count,
    test_count: c.test_count,
    parameter_count: c.parameter_count,
    pass_count: c.pass_count,
    fail_count: c.fail_count,
    test_summary: c.test_summary_json ?? null,
    certificate_url: c.certificate_url ?? null,
    certificate_hash: c.certificate_hash,
    issued_by_user_id: c.issued_by_user_id,
    signed_by_user_id: c.signed_by_user_id ?? null,
    digital_signature: c.digital_signature ?? null,
    issued_at: c.issued_at,
    expiry_date: c.expiry_date ?? null,
    status: c.status,
    notes: c.notes ?? null,
  };
}

function serializeRejection(r) {
  return {
    id: r.id,
    batch: r.batch ? { id: r.batch.id, code: r.batch.code, test_status: r.batch.test_status } : null,
    batch_id: r.batch_id,
    reason: r.reason,
    description: r.description ?? null,
    action: r.action,
    rejected_by_user_id: r.rejected_by_user_id,
    rejected_at: r.rejected_at,
  };
}

function serializeDocument(d) {
  return {
    id: d.id,
    batch_id: d.batch_id,
    test_id: d.test_id ?? null,
    document_type: d.document_type,
    document_url: d.document_url ?? null,
    uploaded_by_user_id: d.uploaded_by_user_id ?? null,
    created_at: d.created_at,
  };
}

function serializeDossierBatch(b) {
  return {
    id: b.id,
    code: b.code,
    phase: b.phase,
    test_status: b.test_status,
    weight_kg: b.weight_kg,
    harvest_date: b.harvest_date,
    location: b.location,
    gps: { lat: b.gps_lat ?? null, lng: b.gps_lng ?? null },
    species: serializeSpecies(b.species),
    farmer: b.farmer ? { id: b.farmer.id, name: b.farmer.name } : null,
    current_holder_user_id: b.current_holder_user_id,
    receipts: (b.lab_receipts || []).map(serializeReceipt),
    samples: (b.samples || []).map(serializeSample),
    tests: (b.lab_tests || []).map((t) => ({
      id: t.id,
      sample_id: t.sample_id,
      test_name: t.test_name,
      test_category: t.test_category,
      status: t.status,
      outcome: t.outcome ?? null,
      analyst_user_id: t.lab_user_id,
    })),
    certifications: (b.certifications || []).map(serializeCertification),
    rejections: (b.rejection_records || []).map(serializeRejection),
    species_verifications: (b.species_verifications || []).map(serializeVerification),
    created_at: b.created_at,
  };
}

module.exports = {
  serializeReceipt,
  serializeSample,
  serializeTest,
  serializeResult,
  serializeReview,
  serializeVerification,
  serializeCertification,
  serializeRejection,
  serializeDocument,
  serializeDossierBatch,
};
