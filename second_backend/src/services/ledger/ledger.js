/**
 * Ledger provider selector (docs/blockchain/architecture.md §ledger).
 *
 * The queue/worker never talk to a chain directly — they go through this
 * seam, so the provider can swap without touching business code:
 *
 *   LEDGER_PROVIDER=mock    (default) deterministic SQLite hash chain
 *   LEDGER_PROVIDER=fabric  Hyperledger Fabric adapter — declared for the
 *                           production network (spec recommendation); this
 *                           repo ships the interface + validation, the real
 *                           submit is a deployment-time integration. Falls
 *                           back to `mock` if the stub is selected (rows
 *                           keep processing; the chain stays verifiable).
 */
const { env } = require("../../config/env");
const { getLogger } = require("../../config/logging");

const logger = getLogger("ledger");

let override = null; // test seam — _setProviderForTest

function getLedgerProvider() {
  if (override) return override;
  const provider = (env.LEDGER_PROVIDER || "mock").toLowerCase();
  if (provider === "fabric") {
    logger.warn("LEDGER_PROVIDER=fabric selected — Fabric adapter is a deployment-time integration; using the mock hash chain.");
    return require("./mockLedger");
  }
  if (provider === "mock") return require("./mockLedger");
  logger.warn(`Unknown LEDGER_PROVIDER '${provider}' — falling back to mock.`);
  return require("./mockLedger");
}

/** Test seam: inject a fake provider (e.g. one that throws). */
function setProviderForTest(provider) {
  override = provider || null;
}

module.exports = { getLedgerProvider, setProviderForTest };