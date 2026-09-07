/**
 * Species resolver — the "never trust AI text" mapping layer
 * (docs/phase_4.md "Herb Species Mapping").
 *
 * A provider label (common name, scientific name, synonym, trade name) is
 * resolved against the MASTER catalogue through the alias web: species.code,
 * common_name, scientific_name and every row of species_synonyms. Labels that
 * don't resolve stay unmapped (`species: null`) so the farmer picks from the
 * catalogue — nothing unrecognized ever becomes a batch.
 */
const { prisma } = require("../../db/client");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Load the active catalogue alias map once per detection call.
 * @returns {Promise<Map<string, object>>} lowercased alias -> species
 */
async function buildAliasMap() {
  const species = await prisma.species.findMany({
    where: { is_active: true },
    select: {
      id: true,
      code: true,
      common_name: true,
      scientific_name: true,
      synonyms: { select: { name: true } },
    },
  });

  const map = new Map();
  for (const s of species) {
    const keys = [s.code, s.common_name, s.scientific_name];
    for (const syn of s.synonyms || []) keys.push(syn.name);
    for (const key of keys) {
      const norm = normalize(key);
      if (norm && !map.has(norm)) map.set(norm, s);
    }
  }
  return map;
}

/** Deterministic fuzzy fallback: containment or genus-only (binomial first token). */
function fuzzyHit(aliasMap, label) {
  if (!label) return null;
  for (const [key, s] of aliasMap) {
    if (key.includes(label) || label.includes(key)) return s; // len checked by caller
  }
  const firstWord = label.split(" ")[0];
  if (firstWord && firstWord.length >= 4) {
    for (const [, s] of aliasMap) {
      const sci = normalize(s.scientific_name);
      if (sci && sci.startsWith(firstWord)) return s; // genus match: "withania …"
    }
  }
  return null;
}

/**
 * Map provider predictions onto catalogue species.
 * @param {Array<{label: string, confidence: number}>} predictions
 * @returns {Promise<Array<{label, confidence, species: object|null}>>}
 */
async function mapPredictions(predictions) {
  if (!predictions || !predictions.length) return [];
  const aliasMap = await buildAliasMap();

  return predictions.map((p) => {
    const label = normalize(p.label ?? p.species);
    let hit = label ? aliasMap.get(label) : null;
    if (!hit && label && label.length >= 4) hit = fuzzyHit(aliasMap, label);
    return {
      label: p.label ?? p.species,
      confidence: p.confidence,
      species: hit
        ? {
            id: hit.id,
            code: hit.code,
            common_name: hit.common_name,
            scientific_name: hit.scientific_name,
          }
        : null,
    };
  });
}

/** Resolve a single species by id or code (must exist and be active). */
async function resolveSpeciesInput({ species_id = null, species_code = null } = {}) {
  if (!species_id && !species_code) return null;
  const species = await prisma.species.findFirst({
    where: {
      is_active: true,
      ...(species_id ? { id: species_id } : { code: normalize(species_code) }),
    },
  });
  return species || null;
}

module.exports = { mapPredictions, resolveSpeciesInput, buildAliasMap, normalize };
