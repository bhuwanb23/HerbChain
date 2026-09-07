/**
 * Hybrid plant-recognition re-ranker — port of services/recognition_service.py.
 *
 * The mobile client runs a generic plant TFLite model on-device and gets
 * back top-N candidates like [{label: "Holy Basil", score: 0.71}, ...].
 * We don't trust those labels directly; instead we re-rank them against the
 * admin-curated HerbCatalogue (common name + scientific name + synonyms),
 * combining on-device confidence with how strongly each candidate matches a
 * known AYUSH species. Output is the top-K best AYUSH matches.
 */
const { prisma } = require("../db/client");

function normalize(text) {
  if (!text) return "";
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).join(" ");
}

async function nameTokens(species) {
  const pool = [species.common_name || "", species.scientific_name || ""];
  pool.push(...(species.synonyms || []));
  return pool.filter(Boolean).map(normalize);
}

/**
 * Cheap fuzzy match: exact-substring beats token-overlap beats nothing.
 * Returns a score in [0, 1] (same formula as Flask).
 */
function labelMatchStrength(labelNorm, nameNorm) {
  if (!labelNorm || !nameNorm) return 0.0;
  if (labelNorm === nameNorm) return 1.0;
  if (labelNorm.includes(nameNorm) || nameNorm.includes(labelNorm)) return 0.85;

  const labelTokens = new Set(labelNorm.split(" "));
  const nameTokensSet = new Set(nameNorm.split(" "));
  if (labelTokens.size === 0 || nameTokensSet.size === 0) return 0.0;

  let inter = 0;
  for (const t of labelTokens) if (nameTokensSet.has(t)) inter += 1;
  const union = new Set([...labelTokens, ...nameTokensSet]).size;
  return 0.6 * (inter / union);
}

/**
 * Given on-device candidates, return the top-K matching AYUSH species.
 *
 *   confidence = on_device_score * 0.4 + name_match_strength * 0.6
 */
async function rerank(candidates, topK = 3) {
  const normCandidates = candidates.map((c) => ({
    label: String(c.label ?? ""),
    score: Number(c.score ?? 0),
  }));

  const speciesRows = await prisma.herbCatalogue.findMany({ where: { is_active: true } });
  if (speciesRows.length === 0) return [];

  const scored = new Map();
  for (const cand of normCandidates) {
    const labelNorm = normalize(cand.label);
    if (!labelNorm) continue;
    for (const sp of speciesRows) {
      let bestMatch = 0.0;
      for (const name of await nameTokens(sp)) {
        const match = labelMatchStrength(labelNorm, name);
        if (match > bestMatch) bestMatch = match;
      }
      if (bestMatch <= 0) continue;
      const combined = Math.max(0.0, Math.min(1.0, cand.score * 0.4 + bestMatch * 0.6));
      const existing = scored.get(sp.species_id);
      if (!existing || combined > existing.confidence) {
        scored.set(sp.species_id, {
          species_id: sp.species_id,
          common_name: sp.common_name,
          scientific_name: sp.scientific_name,
          image_url: sp.image_url,
          medicinal_uses: sp.medicinal_uses,
          confidence: Math.round(combined * 1000) / 1000,
          matched_via: [cand.label],
        });
      } else if (!existing.matched_via.includes(cand.label)) {
        existing.matched_via.push(cand.label);
      }
    }
  }

  const ranked = [...scored.values()].sort((a, b) => b.confidence - a.confidence);
  return ranked.slice(0, Math.max(1, topK));
}

module.exports = { rerank };