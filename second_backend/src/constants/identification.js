/**
 * Identification constants (docs/phase_4.md confidence rules).
 *
 * Recognition NEVER certifies a herb — it only accelerates farmer batch
 * registration. These bands drive the confirmation UI copy:
 *   high (>=90)   -> "Highly likely"
 *   medium (70-89)-> "Likely match — please verify"
 *   low (<70)     -> "AI not confident — select manually"
 *   manual        -> nothing mapped to the catalogue (no trust in free text)
 */
const HIGH_CONFIDENCE = 90;
const MEDIUM_CONFIDENCE = 70;

const VERDICTS = {
  high: "high",
  medium: "medium",
  low: "low",
  manual: "manual",
};

const VERDICT_LABEL = {
  high: "Highly likely",
  medium: "Likely match — please verify",
  low: "AI not confident — please select manually",
  manual: "Please select the species manually",
};

const STATUSES = ["pending", "confirmed", "rejected", "quality_failed", "error"];

const REJECT_REASONS = ["wrong_species", "poor_image", "other"];

/** Confidence band for a score (null/undefined -> manual). */
function verdictFor(confidence) {
  if (confidence === null || confidence === undefined) return VERDICTS.manual;
  if (confidence >= HIGH_CONFIDENCE) return VERDICTS.high;
  if (confidence >= MEDIUM_CONFIDENCE) return VERDICTS.medium;
  return VERDICTS.low;
}

module.exports = {
  HIGH_CONFIDENCE,
  MEDIUM_CONFIDENCE,
  VERDICTS,
  VERDICT_LABEL,
  STATUSES,
  REJECT_REASONS,
  verdictFor,
};
