/**
 * Choice constants and the transfer state machine.
 *
 * 1:1 port of the enums defined in backend/server/models/*.py and the
 * TRANSITIONS table in backend/server/services/transfer_service.py.
 */

const ROLE_CHOICES = ["farmer", "transporter", "lab", "manufacturer", "consumer", "admin"];

const PHASE_CHOICES = [
  "with_farmer", // newly created or returned to farmer after lab
  "in_transit_to_lab", // transporter is carrying it to the lab
  "at_lab", // lab has received it and may test
  "with_farmer_after_lab", // lab released the batch back to farmer (approved)
  "in_transit_to_manufacturer", // transporter is carrying it to the manufacturer
  "with_manufacturer", // manufacturer holds it; may link into Product
  "consumed", // terminal — used up in a Product, can no longer transfer
];

const TEST_RESULT_CHOICES = ["pending", "approved", "rejected"];

const EVENT_TYPE_CHOICES = [
  "CREATED", // farmer registers a new batch
  "TRANSFER", // ownership scan: from_party -> to_party
  "LAB_REPORT", // lab files a quality report
  "PRODUCT_LINK", // manufacturer consumes the batch into a product
  "INTENT_LAB_REQUEST", // lab has expressed intent to test this batch
  "INTENT_MANUFACTURER_ORDER", // manufacturer wants to order this batch
  "BATCH_SPLIT", // parent batch split into N child batches
];

const AYUSH_CATEGORIES = ["ayurveda", "unani", "siddha", "homeopathy", "general"];

const SOIL_TYPES = [
  "alluvial",
  "black",
  "red",
  "laterite",
  "sandy",
  "loamy",
  "clay",
  "saline",
  "other",
];

const IRRIGATION_TYPES = [
  "rainfed",
  "drip",
  "sprinkler",
  "flood",
  "borewell",
  "canal",
  "mixed",
  "other",
];

const CROP_PLAN_STATUS = ["planned", "sown", "growing", "harvested", "cancelled"];

// (from_phase, scanner_role) -> to_phase — single source of truth.
const TRANSITIONS = {
  "with_farmer|transporter": "in_transit_to_lab",
  "in_transit_to_lab|lab": "at_lab",
  "at_lab|transporter": "in_transit_to_manufacturer",
  "in_transit_to_manufacturer|manufacturer": "with_manufacturer",
};

// Phases for which any transfer attempt should be rejected outright.
const TERMINAL_PHASES = new Set(["consumed"]);

module.exports = {
  ROLE_CHOICES,
  PHASE_CHOICES,
  TEST_RESULT_CHOICES,
  EVENT_TYPE_CHOICES,
  AYUSH_CATEGORIES,
  SOIL_TYPES,
  IRRIGATION_TYPES,
  CROP_PLAN_STATUS,
  TRANSITIONS,
  TERMINAL_PHASES,
};