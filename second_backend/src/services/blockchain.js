/**
 * Blockchain service (docs/phase_12.md + docs/blockchain/architecture.md).
 *
 * The permissioned trust layer. The DATABASE is the operational system of
 * record; this service moves trusted milestones onto the ledger:
 *
 *   API → PostgreSQL → blockchain_event_queue (same tx) → worker → ledger
 *
 * Rules baked in:
 *  - NEVER call the ledger from a REST handler — the worker owns every
 *    submission (queue rows are written in the domain transaction).
 *  - Only trusted milestone event kinds are anchored; images/PDFs/GPS logs/
 *    profiles/inventory never go on-chain.
 *  - Hashing strategy: SHA-256 of a CANONICAL payload derived from live DB
 *    facts (never the whole record). Recomputed at verify time →
 *    VALID | TAMPERED.
 *  - Smart-contract rules 1–5 are a defense-in-depth gate in the worker
 *    (domain services remain the primary enforcement).
 *  - Failure handling: business operations never wait on the chain; rows
 *    retry with exponential backoff (1m/5m/15m/30m/1h by default) until
 *    max_retries, then FAILED and requeueable.
 */
const crypto = require("crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { env } = require("../config/env");
const { getLedgerProvider, setProviderForTest } = require("./ledger/ledger");
const {
  QUEUE_STATUSES,
  TXN_STATUSES,
  NODE_ORG_TYPES,
  NODE_ROLES,
  NODE_STATUSES,
  RETRY_BACKOFF_MINUTES,
  CONTRACT_FUNCTIONS,
  CONTRACT_RULES,
  EVENT_CONTRACT_FN,
} = require("../constants/blockchain");

const sha256 = (input) => crypto.createHash("sha256").update(input).digest("hex");

// Ledger submissions are serialized through a module-level promise chain: the
// mock provider assigns block numbers from the current tip, so two concurrent
// ticks (interval worker + a manual /process) must never interleave — they
// would mint the same block_number and break the chain. Row-level claims
// already prevent double-processing the same event; this prevents
// double-minting across different events.
let ledgerChain = Promise.resolve();
function submitBlockSerialized(args) {
  const run = ledgerChain.then(() => getLedgerProvider().submitBlock(args));
  ledgerChain = run.catch(() => {}); // failures must not poison the chain
  return run;
}

/** Deterministic canonical encoding — dates ISO, numbers stable, null literal. */
function canonicalize(...parts) {
  return parts
    .map((p) => {
      if (p === null || p === undefined) return "null";
      if (p instanceof Date) return p.toISOString();
      if (typeof p === "object") return JSON.stringify(p, Object.keys(p).sort());
      return String(p);
    })
    .join("|");
}

// ------------------------------------------------------------ hashing

async function loadEvent(entityId) {
  const ev = await prisma.batchEvent.findUnique({
    where: { id: entityId },
    include: { batch: { include: { species: { select: { code: true } } } } },
  });
  if (!ev) throw new ApiError("anchor_source_missing", `Batch event ${entityId} not found`, 404);
  return ev;
}

async function loadLotEvent(entityId) {
  const ev = await prisma.productLotEvent.findUnique({
    where: { id: entityId },
    include: { lot: { include: { product: true, run: true } } },
  });
  if (!ev) throw new ApiError("anchor_source_missing", `Product lot event ${entityId} not found`, 404);
  return ev;
}

/**
 * Canonical hash material for an anchor — the immutable/live business facts
 * that define the milestone. This is what gets hashed ON-CHAIN; verify()
 * recomputes the exact same bytes from the current DB.
 */
async function hashMaterialFor({ anchor_code, entity_type, entity_id }) {
  if (entity_type === "batch_event") {
    const ev = await loadEvent(entity_id);
    const b = ev.batch;
    switch (anchor_code) {
      case "BATCH_CREATED":
        return [
          b.code,
          b.farmer_id,
          b.species_id,
          b.harvest_date,
          b.weight_kg,
          b.gps_lat,
          b.gps_lng,
          b.cultivation_type,
          ev.created_at,
        ];
      case "TRANSFERRED":
        return [b.code, ev.event_type, ev.actor_user_id, ev.from_user_id, ev.to_user_id, ev.phase_before, ev.phase_after, ev.created_at];
      case "RECEIVED":
        return [b.code, ev.event_type, ev.actor_user_id, ev.created_at];
      case "CERTIFIED": {
        const cert = await prisma.certification.findUnique({ where: { batch_id: b.id } });
        if (!cert) throw new ApiError("contract_rule", `No certificate exists for batch ${b.code}`, 409);
        return [cert.certificate_number, b.code, cert.lab_code, cert.species_code, cert.issued_at, cert.expiry_date, ev.created_at];
      }
      case "REJECTED": {
        const rej = await prisma.rejectionRecord.findUnique({ where: { batch_id: b.id } });
        if (!rej) throw new ApiError("contract_rule", `No rejection record exists for batch ${b.code}`, 409);
        return [b.code, rej.reason, rej.action, rej.rejected_at, ev.created_at];
      }
      case "LINKED":
        return [
          b.code,
          ev.payload_json?.product_code || null,
          ev.payload_json?.lot_code || null,
          ev.payload_json?.run_code || null,
          ev.payload_json?.quantity_kg ?? null,
          ev.created_at,
        ];
      default:
        // Unknown batch-event code: canonicalize the event row's stable fields.
        return [b.code, ev.event_type, ev.actor_user_id, ev.phase_before, ev.phase_after, ev.created_at];
    }
  }
  if (entity_type === "product_lot_event") {
    const ev = await loadLotEvent(entity_id);
    const lot = ev.lot;
    return [
      lot.code,
      lot.product?.code || null,
      lot.product?.manufacturer_user_id || null,
      lot.run?.code || null,
      lot.quantity_units,
      ev.created_at,
    ];
  }
  if (entity_type === "audit_log") {
    const audit = await prisma.auditLog.findUnique({ where: { id: entity_id } });
    if (!audit) throw new ApiError("anchor_source_missing", `Audit row ${entity_id} not found`, 404);
    return [audit.action, audit.target_type, audit.target_id, audit.actor_user_id, audit.created_at, audit.meta_json || null];
  }
  if (entity_type === "document") {
    // Phase 15: document hash anchoring — the sha256 of the file bytes plus
    // the registry facts. Tampering the file flips the checksum -> TAMPERED.
    const doc = await prisma.document.findUnique({ where: { id: entity_id } });
    if (!doc) throw new ApiError("anchor_source_missing", `Document ${entity_id} not found`, 404);
    return [doc.document_no, doc.checksum_sha256, doc.category, doc.entity_type, doc.entity_id || null, doc.file_name, doc.file_size, doc.uploaded_at];
  }
  throw new ApiError("anchor_source_missing", `Unsupported entity_type '${entity_type}'`, 400);
}

const payloadHashOf = (material) => sha256(canonicalize(...material));

// ------------------------------------------------------------ contract gate

/**
 * Smart-contract security rules (spec rules 1–5) — the worker refuses to
 * anchor a milestone that violates them. Defense-in-depth: the domain
 * services already enforce the same invariants at the source.
 */
async function validateContract({ anchor_code, entity_type, entity_id }) {
  if (entity_type === "batch_event") {
    const ev = await loadEvent(entity_id);
    const b = ev.batch;
    switch (anchor_code) {
      case "TRANSFERRED": {
        // Rule 2: cannot transfer if already transferred — a TRANSFERRED
        // anchor may only exist once per ownership leg (from ≠ to).
        if (!ev.from_user_id || !ev.to_user_id) return { valid: false, rule: 2, reason: "transfer_after_transfer", message: "Transfer event lacks both parties" };
        if (ev.from_user_id === ev.to_user_id) return { valid: false, rule: 2, reason: "transfer_after_transfer", message: "Self-transfer is not a custody event" };
        const existing = await prisma.blockchainEvent.count({ where: { anchor_code: "TRANSFERRED", entity_type: "batch_event", entity_id: ev.id } });
        if (existing > 1) return { valid: false, rule: 2, reason: "transfer_after_transfer", message: "Duplicate transfer anchor" };
        return { valid: true };
      }
      case "CERTIFIED": {
        // Rule 1: cannot certify a non-existing batch / without a certificate.
        const cert = await prisma.certification.findUnique({ where: { batch_id: b.id } });
        if (!cert) return { valid: false, rule: 1, reason: "certify_non_existing_batch", message: "No certificate issued for this batch" };
        return { valid: true };
      }
      case "LINKED": {
        // Rule 3: cannot link a rejected batch to a product.
        if (b.test_status === "rejected") return { valid: false, rule: 3, reason: "link_rejected_batch", message: `Batch ${b.code} is rejected — cannot link to a product` };
        const cert = await prisma.certification.findUnique({ where: { batch_id: b.id } });
        if (!cert || cert.status !== "active") return { valid: false, rule: 3, reason: "link_rejected_batch", message: `Batch ${b.code} is not certified — cannot link to a product` };
        return { valid: true };
      }
      default:
        return { valid: true };
    }
  }
  if (entity_type === "product_lot_event" && anchor_code === "PRODUCT_CREATED") {
    // Rule 4: a product/lot can be created once (lot_id unique).
    const ev = await loadLotEvent(entity_id);
    if (!ev.lot?.product) return { valid: false, rule: 4, reason: "duplicate_product", message: "Lot has no product" };
    return { valid: true };
  }
  return { valid: true };
}

// ------------------------------------------------------------ worker

function backoffMs(attempts) {
  const idx = Math.min(Math.max(attempts - 1, 0), RETRY_BACKOFF_MINUTES.length - 1);
  return env.BLOCKCHAIN_RETRY_BASE_MS * RETRY_BACKOFF_MINUTES[idx];
}

async function writeAudit({ eventId, action, actor, detail }) {
  return prisma.blockchainAuditLog.create({
    data: { event_id: eventId || null, action, actor: actor || "worker", detail_json: detail || {} },
  });
}

async function handleFailure(row, err) {
  const attempts = row.attempts + 1;
  const terminal = attempts >= row.max_retries;
  await prisma.$transaction(async (tx) => {
    await tx.blockchainEvent.update({
      where: { id: row.id },
      data: {
        status: terminal ? "failed" : "pending",
        attempts,
        last_error: err.message ? String(err.message).slice(0, 500) : String(err),
        next_attempt_at: terminal ? null : new Date(Date.now() + backoffMs(attempts)),
        processed_at: null,
      },
    });
    await tx.blockchainAuditLog.create({
      data: {
        event_id: row.id,
        action: terminal ? "failed" : "retried",
        actor: "worker",
        detail_json: { attempts, terminal, error: err.message ? String(err.message).slice(0, 300) : String(err), next_backoff_ms: terminal ? null : backoffMs(attempts) },
      },
    });
  });
}

/**
 * Process every due queue row (one tick). Deterministic + idempotent: rows
 * are claimed atomically (pending → processing), contract-validated, hashed
 * from live DB facts, submitted to the ledger and receipted. Returns a
 * per-row summary.
 */
async function processQueue({ limit = null, actor = "worker" } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || env.BLOCKCHAIN_PROCESS_LIMIT, 1), 500);
  const due = await prisma.blockchainEvent.findMany({
    where: { status: "pending", OR: [{ next_attempt_at: null }, { next_attempt_at: { lte: new Date() } }] },
    orderBy: { recorded_at: "asc" },
    take,
  });

  const results = [];
  for (const row of due) {
    // Atomic claim — a concurrent tick or the interval worker can't double-process.
    const claimed = await prisma.blockchainEvent.updateMany({
      where: { id: row.id, status: "pending" },
      data: { status: "processing", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) {
      results.push({ id: row.id, status: "skipped" });
      continue;
    }
    try {
      const material = await hashMaterialFor({ anchor_code: row.anchor_code, entity_type: row.entity_type, entity_id: row.entity_id });
      const contract = await validateContract({ anchor_code: row.anchor_code, entity_type: row.entity_type, entity_id: row.entity_id });
      if (!contract.valid) throw new ApiError("contract_rule", `Contract rule ${contract.rule} — ${contract.message}`, 409);
      const payloadHash = payloadHashOf(material);
      const performedBy = row.performed_by_user_id || (await performedByOf(row));
      const receipt = await submitBlockSerialized({
        eventType: row.anchor_code,
        entityId: row.entity_id,
        performedBy,
        payloadHash,
      });

      await prisma.$transaction([
        prisma.blockchainTransaction.create({
          data: {
            event_id: row.id,
            transaction_hash: receipt.transactionHash,
            block_number: receipt.blockNumber,
            prev_hash: receipt.prevHash,
            event_type: row.anchor_code,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            payload_hash: payloadHash,
            performed_by: performedBy,
            chain: receipt.chain || env.BLOCKCHAIN_CHAIN_NAME,
            status: "confirmed",
            confirmed_at: receipt.blockTime || new Date(),
          },
        }),
        prisma.blockchainEvent.update({
          where: { id: row.id },
          data: {
            status: "completed",
            tx_hash: receipt.transactionHash,
            block_number: receipt.blockNumber,
            block_time: receipt.blockTime || new Date(),
            processed_at: new Date(),
            last_error: null,
            next_attempt_at: null,
          },
        }),
        prisma.blockchainAuditLog.create({
          data: {
            event_id: row.id,
            action: "processed",
            actor,
            detail_json: { block_number: receipt.blockNumber, transaction_hash: receipt.transactionHash, payload_hash: payloadHash },
          },
        }),
      ]);
      results.push({ id: row.id, status: "completed", block_number: receipt.blockNumber });
    } catch (err) {
      await handleFailure({ ...row, attempts: row.attempts }, err);
      results.push({ id: row.id, status: "failed", error: String(err.message || err).slice(0, 200) });
    }
  }
  return { processed: results.length, results };
}

async function performedByOf(row) {
  if (row.entity_type === "batch_event") {
    const ev = await prisma.batchEvent.findUnique({ where: { id: row.entity_id }, select: { actor_user_id: true } });
    return ev?.actor_user_id || null;
  }
  if (row.entity_type === "product_lot_event") {
    const ev = await prisma.productLotEvent.findUnique({ where: { id: row.entity_id }, select: { actor_user_id: true } });
    return ev?.actor_user_id || null;
  }
  if (row.entity_type === "audit_log") {
    const a = await prisma.auditLog.findUnique({ where: { id: row.entity_id }, select: { actor_user_id: true } });
    return a?.actor_user_id || null;
  }
  return null;
}

/** Admin/ops: reset failed rows to pending (fresh attempt budget). */
async function requeueFailed({ ids = null, actor = "admin" } = {}) {
  const where = ids && Array.isArray(ids) && ids.length ? { id: { in: ids }, status: "failed" } : { status: "failed" };
  const rows = await prisma.blockchainEvent.findMany({ where, take: 500 });
  let reset = 0;
  for (const row of rows) {
    await prisma.blockchainEvent.update({
      where: { id: row.id },
      data: { status: "pending", attempts: 0, next_attempt_at: null, last_error: null },
    });
    await writeAudit({ eventId: row.id, action: "requeued", actor, detail: { anchor_code: row.anchor_code } });
    reset += 1;
  }
  return { requeued: reset };
}

// ------------------------------------------------------------ verification

/** Tamper check on one anchored queue row (spec Verification Engine). */
async function verifyEvent(eventId, { actor = null } = {}) {
  const row = await prisma.blockchainEvent.findUnique({ where: { id: eventId } });
  if (!row) throw new ApiError("not_found", "Blockchain event not found", 404);
  if (row.status !== "completed" || !row.tx_hash) {
    return { id: row.id, anchor_code: row.anchor_code, status: row.status, verification: "NOT_ANCHORED", message: "This event has not been anchored yet" };
  }
  const txn = await prisma.blockchainTransaction.findUnique({ where: { event_id: row.id } });
  const material = await hashMaterialFor({ anchor_code: row.anchor_code, entity_type: row.entity_type, entity_id: row.entity_id });
  const currentHash = payloadHashOf(material);
  const valid = currentHash === txn.payload_hash;
  await writeAudit({ eventId: row.id, action: valid ? "verified" : "tampered", actor: actor || "audit", detail: { current_hash: currentHash, anchored_hash: txn.payload_hash } });
  return {
    id: row.id,
    anchor_code: row.anchor_code,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    block_number: txn.block_number,
    transaction_hash: txn.transaction_hash,
    anchored_hash: txn.payload_hash,
    current_hash: currentHash,
    verification: valid ? "VALID" : "TAMPERED",
  };
}

/** Whole-chain integrity: every block hash recomputed, prev_hash links intact. */
async function verifyChain() {
  const blocks = await prisma.blockchainTransaction.findMany({ orderBy: { block_number: "asc" } });
  const { recomputeBlock, blockCanonical, sha256: mockSha } = require("./ledger/mockLedger");
  let firstBad = null;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.transaction_hash !== recomputeBlock(block)) {
      firstBad = { index: i, block_number: block.block_number, reason: "hash_mismatch" };
      break;
    }
    if (i > 0) {
      const prev = blocks[i - 1];
      const expectedPrev = mockSha(blockCanonical({ ...prev, timestamp: prev.confirmed_at, performed_by: prev.performed_by, chain: prev.chain }));
      if (block.prev_hash !== expectedPrev) {
        firstBad = { index: i, block_number: block.block_number, reason: "prev_hash_break" };
        break;
      }
    }
  }
  return {
    valid: firstBad === null,
    blocks: blocks.length,
    tip: blocks.length ? blocks[blocks.length - 1].block_number : 0,
    first_bad: firstBad,
  };
}

/** Verify a transaction by its on-chain hash (spec GET /blockchain/verify/{hash}). */
async function verifyTransactionHash(txHash) {
  const txn = await prisma.blockchainTransaction.findUnique({
    where: { transaction_hash: txHash },
    include: { event: true },
  });
  if (!txn) return { found: false, verification: "NOT_FOUND" };
  const row = txn.event;
  const material = await hashMaterialFor({ anchor_code: row.anchor_code, entity_type: row.entity_type, entity_id: row.entity_id });
  const currentHash = payloadHashOf(material);
  const valid = currentHash === txn.payload_hash;
  return {
    found: true,
    verification: valid ? "VALID" : "TAMPERED",
    transaction_hash: txn.transaction_hash,
    block_number: txn.block_number,
    event_type: txn.event_type,
    entity_type: txn.entity_type,
    entity_id: txn.entity_id,
    anchored_hash: txn.payload_hash,
    current_hash: currentHash,
    confirmed_at: txn.confirmed_at,
  };
}

// ------------------------------------------------------------ chain views

/** Anchors for one batch (its batch_events + audit rows targeting it). */
async function batchChain(batchId) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  const events = await prisma.batchEvent.findMany({ where: { batch_id: batchId }, select: { id: true } });
  const eventIds = events.map((e) => e.id);
  const auditIds = (
    await prisma.auditLog.findMany({ where: { target_type: "batch", target_id: batchId }, select: { id: true } })
  ).map((a) => a.id);
  const anchors = await prisma.blockchainEvent.findMany({
    where: {
      OR: [
        { entity_type: "batch_event", entity_id: { in: eventIds } },
        { entity_type: "audit_log", entity_id: { in: auditIds } },
      ],
    },
    orderBy: { recorded_at: "asc" },
    include: { transaction: true },
  });
  return {
    batch: { id: batch.id, code: batch.code },
    anchored: anchors.map((a) => serializeAnchor(a)),
    integrity: await verifyChain(),
  };
}

/** Anchors for one product (its lot events + batch-link events). */
async function productChain(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError("not_found", "Product not found", 404);
  const lots = await prisma.productLot.findMany({ where: { product_id: productId }, select: { id: true } });
  const lotIds = lots.map((l) => l.id);
  const lotEventIds = (await prisma.productLotEvent.findMany({ where: { lot_id: { in: lotIds } }, select: { id: true } })).map((e) => e.id);
  // SQLite has no JSON path filtering — resolve the product's ingredient
  // batches via its runs, then match PRODUCT_LINK events in JS.
  const runs = await prisma.manufacturingBatch.findMany({
    where: { product_id: productId },
    select: { id: true },
  });
  const runIds = runs.map((r) => r.id);
  const ingredients = await prisma.manufacturingBatchIngredient.findMany({
    where: { manufacturing_batch_id: { in: runIds } },
    select: { batch_id: true },
  });
  const batchIds = [...new Set(ingredients.map((i) => i.batch_id))];
  const linkCandidates = await prisma.batchEvent.findMany({
    where: { event_type: "PRODUCT_LINK", batch_id: { in: batchIds } },
    select: { id: true, payload_json: true },
  });
  const linkEventIds = linkCandidates.filter((e) => e.payload_json?.product_id === productId).map((e) => e.id);

  const anchors = await prisma.blockchainEvent.findMany({
    where: {
      OR: [
        { entity_type: "product_lot_event", entity_id: { in: lotEventIds } },
        { entity_type: "batch_event", entity_id: { in: linkEventIds } },
      ],
    },
    orderBy: { recorded_at: "asc" },
    include: { transaction: true },
  });
  return {
    product: { id: product.id, code: product.code, name: product.name },
    anchored: anchors.map((a) => serializeAnchor(a)),
    integrity: await verifyChain(),
  };
}

function serializeAnchor(a) {
  return {
    id: a.id,
    anchor_code: a.anchor_code,
    entity_type: a.entity_type,
    entity_id: a.entity_id,
    status: a.status,
    attempts: a.attempts,
    last_error: a.last_error || null,
    tx_hash: a.tx_hash || null,
    block_number: a.block_number ?? null,
    block_time: a.block_time || null,
    recorded_at: a.recorded_at,
    transaction: a.transaction
      ? {
          transaction_hash: a.transaction.transaction_hash,
          block_number: a.transaction.block_number,
          payload_hash: a.transaction.payload_hash,
          performed_by: a.transaction.performed_by,
          confirmed_at: a.transaction.confirmed_at,
        }
      : null,
  };
}

// ------------------------------------------------------------ queries

async function listEvents(user, { status = null, anchor_code = null, entity_type = null, limit = 100, offset = 0 } = {}) {
  const where = {};
  if (status) {
    if (!QUEUE_STATUSES.includes(status)) throw new ApiError("bad_request", `status must be one of: ${QUEUE_STATUSES.join(", ")}`, 400);
    where.status = status;
  }
  if (anchor_code) where.anchor_code = anchor_code;
  if (entity_type) where.entity_type = entity_type;
  const [events, total] = await Promise.all([
    prisma.blockchainEvent.findMany({
      where,
      orderBy: { recorded_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500),
      include: { transaction: true },
    }),
    prisma.blockchainEvent.count({ where }),
  ]);
  return { events: events.map(serializeAnchor), total };
}

async function listTransactions(user, { limit = 100, offset = 0 } = {}) {
  const [rows, total] = await Promise.all([
    prisma.blockchainTransaction.findMany({
      orderBy: { block_number: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500),
    }),
    prisma.blockchainTransaction.count(),
  ]);
  return {
    transactions: rows.map((t) => ({
      transaction_hash: t.transaction_hash,
      block_number: t.block_number,
      prev_hash: t.prev_hash,
      event_type: t.event_type,
      entity_type: t.entity_type,
      entity_id: t.entity_id,
      payload_hash: t.payload_hash,
      performed_by: t.performed_by,
      chain: t.chain,
      status: t.status,
      confirmed_at: t.confirmed_at,
    })),
    total,
  };
}

async function listNodes() {
  const nodes = await prisma.blockchainNode.findMany({ orderBy: { node_code: "asc" } });
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      node_code: n.node_code,
      org_type: n.org_type,
      name: n.name,
      endpoint: n.endpoint || null,
      role: n.role,
      status: n.status,
      last_seen_at: n.last_seen_at || null,
      created_at: n.created_at,
    })),
  };
}

async function listContracts() {
  const contracts = await prisma.smartContractVersion.findMany({ orderBy: { deployed_at: "desc" } });
  return {
    contracts: contracts.map((c) => ({
      id: c.id,
      contract_name: c.contract_name,
      version: c.version,
      description: c.description || null,
      functions: c.functions_json,
      rules: c.rules_json,
      deployed_by_user_id: c.deployed_by_user_id || null,
      deployed_at: c.deployed_at,
      is_active: c.is_active,
    })),
  };
}

async function listAudit({ limit = 100 } = {}) {
  const rows = await prisma.blockchainAuditLog.findMany({
    orderBy: { created_at: "desc" },
    take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500),
  });
  return {
    audit: rows.map((a) => ({
      id: a.id,
      event_id: a.event_id || null,
      action: a.action,
      actor: a.actor || null,
      detail: a.detail_json || null,
      created_at: a.created_at,
    })),
  };
}

/** AYUSH governance dashboard (spec "Blockchain Audit Dashboard"). */
async function dashboard() {
  const [byStatus, totalTxns, byType, nodes, contracts, recentAudit, integrity, recentCompleted] = await Promise.all([
    prisma.blockchainEvent.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.blockchainTransaction.count(),
    prisma.blockchainTransaction.groupBy({ by: ["event_type"], _count: { _all: true } }),
    prisma.blockchainNode.count(),
    prisma.smartContractVersion.count({ where: { is_active: true } }),
    prisma.blockchainAuditLog.findMany({ orderBy: { created_at: "desc" }, take: 10 }),
    verifyChain(),
    prisma.blockchainEvent.findMany({ where: { status: "completed" }, orderBy: { processed_at: "desc" }, take: 10, include: { transaction: true } }),
  ]);
  return {
    queue: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    queue_total: byStatus.reduce((s, r) => s + r._count._all, 0),
    transactions: { total: totalTxns, by_event_type: Object.fromEntries(byType.map((r) => [r.event_type, r._count._all])) },
    chain: { name: env.BLOCKCHAIN_CHAIN_NAME, provider: getLedgerProvider().name, ...integrity },
    network: { nodes, active_contracts: contracts },
    recent: recentCompleted.map((a) => ({
      id: a.id,
      anchor_code: a.anchor_code,
      block_number: a.block_number,
      tx_hash: a.tx_hash,
      processed_at: a.processed_at,
    })),
    audit: recentAudit.map((a) => ({ id: a.id, event_id: a.event_id, action: a.action, actor: a.actor, detail: a.detail_json, created_at: a.created_at })),
  };
}

// ------------------------------------------------------------ seeding

/** Idempotent network bootstrap: nodes + contract v1 (called by seed). */
async function seedBlockchain() {
  const nodes = [
    { node_code: "AYUSH-GOV-01", org_type: "ayush", name: "AYUSH Central Governance Node", role: "governance", status: "active" },
    { node_code: "REG-01", org_type: "regional_authority", name: "State AYUSH Board — Tamil Nadu", role: "observer", status: "active" },
    { node_code: "LAB-01", org_type: "lab", name: "Certification Lab Node A", role: "validator", status: "active" },
    { node_code: "LAB-02", org_type: "lab", name: "Certification Lab Node B", role: "validator", status: "active" },
    { node_code: "MFR-01", org_type: "manufacturer", name: "Manufacturer Verification Node", role: "validator", status: "active" },
    { node_code: "ORDERER-01", org_type: "orderer", name: "RAFT Ordering Service", role: "orderer", status: "active" },
  ];
  for (const n of nodes) {
    await prisma.blockchainNode.upsert({
      where: { node_code: n.node_code },
      update: { name: n.name, role: n.role, org_type: n.org_type },
      create: { ...n },
    });
  }
  await prisma.smartContractVersion.upsert({
    where: { contract_name_version: { contract_name: "Batch Contract", version: "1.0.0" } },
    update: { is_active: true },
    create: {
      contract_name: "Batch Contract",
      version: "1.0.0",
      description: "Primary HerbChain contract: batch creation, ownership, certification, product creation and batch-to-product lineage.",
      functions_json: CONTRACT_FUNCTIONS,
      rules_json: CONTRACT_RULES,
      is_active: true,
    },
  });
  return { nodes: nodes.length, contracts: 1 };
}

/** Ops: heartbeat a node (updates last_seen_at). */
async function pingNode(nodeCode, { actor = "ops" } = {}) {
  const node = await prisma.blockchainNode.findUnique({ where: { node_code: nodeCode } });
  if (!node) throw new ApiError("not_found", "Blockchain node not found", 404);
  await prisma.blockchainNode.update({ where: { id: node.id }, data: { last_seen_at: new Date(), status: "active" } });
  await writeAudit({ eventId: null, action: "node_heartbeat", actor, detail: { node_code: nodeCode } });
  return prisma.blockchainNode.findUnique({ where: { id: node.id } });
}

// ------------------------------------------------------------ exports

module.exports = {
  enqueue: async ({ anchorCode, entityType, entityId, performedByUserId = null, payload = null }) => {
    const row = await prisma.blockchainEvent.create({
      data: { anchor_code: anchorCode, entity_type: entityType, entity_id: entityId, performed_by_user_id: performedByUserId, payload_json: payload, status: "pending" },
    });
    await writeAudit({ eventId: row.id, action: "queued", actor: performedByUserId || "system", detail: { anchor_code: anchorCode } });
    return row;
  },
  processQueue,
  requeueFailed,
  verifyEvent,
  verifyChain,
  verifyTransactionHash,
  batchChain,
  productChain,
  listEvents,
  listTransactions,
  listNodes,
  listContracts,
  listAudit,
  dashboard,
  seedBlockchain,
  pingNode,
  hashMaterialFor,
  validateContract,
  payloadHashOf,
  canonicalize,
  // test seams
  setProviderForTest,
  TXN_STATUSES,
  QUEUE_STATUSES,
  NODE_ORG_TYPES,
  NODE_ROLES,
  NODE_STATUSES,
};