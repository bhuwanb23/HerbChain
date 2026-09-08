/**
 * Identification serializer — wire shape for /identifications responses.
 */
const { VERDICT_LABEL } = require("../../constants/identification");

const SP = (s) =>
  s ? { id: s.id, code: s.code, common_name: s.common_name, scientific_name: s.scientific_name } : null;

function serializeIdentification(row) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status, // pending | confirmed | rejected | error
    verdict: row.verdict, // high | medium | low | manual
    verdict_label: VERDICT_LABEL[row.verdict] || null,
    confidence: row.confidence,
    accepted: row.accepted,
    mismatch: row.mismatch,
    rejected_reason: row.rejected_reason,
    predictions: row.predictions_json || [],
    quality: row.quality_json || null,
    model: { provider: row.provider, name: row.model_name, version: row.model_version },
    top_species: SP(row.top_species),
    selected_species: SP(row.selected_species),
    asset: row.asset ? { id: row.asset.id, url: row.asset.url } : null,
    batch: row.batch ? { id: row.batch.id, code: row.batch.code } : null,
    user: row.user ? { id: row.user.id, name: row.user.name, email: row.user.email } : null,
    image_hash: row.image_hash,
    created_at: row.created_at,
    confirmed_at: row.confirmed_at,
    updated_at: row.updated_at,
  };
}

module.exports = { serializeIdentification };
