/**
 * Products & lineage service (docs/phase_10.md + docs/products/architecture.md).
 *
 * Phase 10 = the batch-to-product lineage engine. Rules baked in:
 *  - ONLY the owning manufacturer runs a product; a run draws ONLY from its
 *    own Phase-9 inventory, and each ingredient must be a certified,
 *    cert-valid, non-held herb batch (spec §12) — rejected batches never
 *    enter products.
 *  - createRun RESERVES quantities (available -> reserved ledger rows) and
 *    writes ManufacturingBatchIngredient edges. startRun stamps
 *    production_date. completeRun CONSUMES them (consumed_for_production
 *    ledger rows), emits the finished ProductLot (PRD code) + its PERMANENT
 *    product QR, writes LOT_CREATED + per-batch BATCH_LINKED_TO_PRODUCT
 *    events, anchors PRODUCT_CREATED / LINKED on the ledger and freezes the
 *    lineage snapshot. cancelRun releases reservations.
 *  - inventory NEVER changes directly — movements ride the append-only
 *    InventoryTransaction ledger via the Phase-9 tx kernels.
 *  - backward lineage (product -> runs -> batches -> farmers -> certs ->
 *    transport) and forward trace (batch -> runs -> products) both walk the
 *    same ingredient edges; a flagged batch writes AffectedProduct rows
 *    (recall blast radius).
 */
const crypto = require("crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { publish } = require("./notifications"); // phase 14: publish, never send
const { env } = require("../config/env");
const {
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  RUN_STATUSES,
  IMPACT_TYPES,
  AFFECTED_STATUSES,
} = require("../constants/products");
const { reserveTx, releaseTx, consumeTx } = require("./procurement");
const { hashToken, encryptToken } = require("./qrEngine");

// ------------------------------------------------------------ code gen

/** PROD-YYYY-000001 — product master code (never the DB id). */
async function nextProductCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.PRODUCT_CODE_PREFIX}-${year}-`;
  const count = await tx.product.count({ where: { code: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

/** MFG-YYYY-000001 — manufacturing run code. */
async function nextRunCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.MFG_CODE_PREFIX}-${year}-`;
  const count = await tx.manufacturingBatch.count({ where: { code: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

/** PRD-YYYY-000001 — finished lot code. */
async function nextLotCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.PRD_CODE_PREFIX}-${year}-`;
  const count = await tx.productLot.count({ where: { code: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

// ------------------------------------------------------------ helpers

async function writeAudit(tx, { actorUserId, action, targetType, targetId, meta = {} }) {
  await tx.auditLog.create({
    data: { actor_user_id: actorUserId, action, target_type: targetType, target_id: targetId, meta_json: meta },
  });
}

async function assertManufacturer(user) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only manufacturers can manage products and production runs", 403);
  }
}

async function getOwnedProduct(user, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError("not_found", "Product not found", 404);
  if (product.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This product belongs to another manufacturer", 403);
  }
  return product;
}

/** The batch's valid certificate (active, non-expired) or null. */
async function batchCertificate(batchId) {
  const cert = await prisma.certification.findUnique({
    where: { batch_id: batchId },
    include: { species: { select: { code: true, common_name: true } } },
  });
  if (!cert || cert.status !== "active") return null;
  if (cert.expiry_date && cert.expiry_date <= new Date()) return null;
  return cert;
}

const runInclude = () => ({
  product: { include: { manufacturer: { select: { id: true, name: true } } } },
  ingredients: {
    orderBy: { position: "asc" },
    include: {
      batch: {
        select: {
          id: true,
          code: true,
          phase: true,
          test_status: true,
          location: true,
          farmer: { select: { id: true, name: true } },
          species: { select: { code: true, common_name: true } },
        },
      },
    },
  },
  lots: { include: { qr_token: true } },
});

const lotInclude = () => ({
  product: {
    include: {
      manufacturer: { select: { id: true, name: true } },
      formulas: { include: { species: { select: { code: true, common_name: true } } } },
    },
  },
  run: { include: { ingredients: { include: { batch: { select: { id: true, code: true } } } } } },
  holder: { select: { id: true, name: true, role: true } },
  qr_token: true,
  events: { orderBy: { created_at: "asc" } },
});

// ------------------------------------------------------------ products

/** Create a product master (spec §2). status: draft. */
async function createProduct(user, { name, sku = null, description = null, category = "other", pack_size = null, expiry_months = null }) {
  await assertManufacturer(user);
  if (!name || !name.trim()) throw new ApiError("bad_request", "name is required", 400);
  if (!PRODUCT_CATEGORIES.includes(category)) {
    throw new ApiError("bad_request", `category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`, 400);
  }
  if (expiry_months != null && (!Number.isInteger(Number(expiry_months)) || Number(expiry_months) < 1)) {
    throw new ApiError("bad_request", "expiry_months must be a positive integer", 400);
  }
  const product = await prisma.$transaction(async (tx) => {
    const code = await nextProductCode(tx);
    const row = await tx.product.create({
      data: {
        code,
        manufacturer_user_id: user.id,
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        category,
        pack_size: pack_size?.trim() || null,
        expiry_months: expiry_months == null ? null : Number(expiry_months),
        status: "draft",
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "PRODUCT_CREATED",
      targetType: "product",
      targetId: row.id,
      meta: { code, name: row.name, category },
    });
    return row;
  });
  return prisma.product.findUnique({ where: { id: product.id }, include: { manufacturer: { select: { id: true, name: true } } } });
}

/** Manufacturer's products (admin: all). */
async function listProducts(user, { status = null, limit = 100, offset = 0 } = {}) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only manufacturers can list products", 403);
  }
  const where = user.role === "manufacturer" ? { manufacturer_user_id: user.id } : {};
  if (status) where.status = status;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
      include: {
        manufacturer: { select: { id: true, name: true } },
        _count: { select: { runs: true, lots: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total };
}

async function getProduct(user, productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      manufacturer: { select: { id: true, name: true } },
      formulas: { include: { species: { select: { code: true, common_name: true } } } },
      runs: { orderBy: { created_at: "desc" }, take: 100, include: { ingredients: { select: { batch_id: true, quantity_kg: true, state: true } } } },
      lots: { orderBy: { created_at: "desc" }, take: 100, include: { qr_token: true } },
      affected_products: { orderBy: { detected_at: "desc" }, take: 50 },
    },
  });
  if (!product) throw new ApiError("not_found", "Product not found", 404);
  if (product.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This product belongs to another manufacturer", 403);
  }
  return product;
}

/** Update fields / lifecycle. Status machine: draft<->active,
 * active->discontinued, discontinued->active. recalled only via the recall
 * flow (never by direct edit). */
async function updateProduct(user, { product_id, name = null, sku = null, description = null, category = null, pack_size = null, expiry_months = null, status = null }) {
  const product = await getOwnedProduct(user, product_id);
  const data = {};
  if (name != null) {
    if (!String(name).trim()) throw new ApiError("bad_request", "name cannot be empty", 400);
    data.name = String(name).trim();
  }
  if (sku != null) data.sku = String(sku).trim() || null;
  if (description != null) data.description = String(description).trim() || null;
  if (category != null) {
    if (!PRODUCT_CATEGORIES.includes(category)) throw new ApiError("bad_request", `category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`, 400);
    data.category = category;
  }
  if (pack_size != null) data.pack_size = String(pack_size).trim() || null;
  if (expiry_months != null) {
    if (!Number.isInteger(Number(expiry_months)) || Number(expiry_months) < 1) throw new ApiError("bad_request", "expiry_months must be a positive integer", 400);
    data.expiry_months = Number(expiry_months);
  }
  if (status != null) {
    if (!PRODUCT_STATUSES.includes(status)) throw new ApiError("bad_request", `status must be one of: ${PRODUCT_STATUSES.join(", ")}`, 400);
    if (status === "recalled") throw new ApiError("invalid_state", "recalled is set by the recall/impact flow, not direct edits", 409);
    const allowed = { draft: ["active"], active: ["discontinued", "draft"], discontinued: ["active"] };
    if (product.status !== status && !(allowed[product.status] || []).includes(status)) {
      throw new ApiError("invalid_state", `Cannot move a product from '${product.status}' to '${status}'`, 409);
    }
    data.status = status;
  }
  if (Object.keys(data).length === 0) throw new ApiError("bad_request", "Nothing to update", 400);
  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: product.id }, data });
    await writeAudit(tx, { actorUserId: user.id, action: "PRODUCT_UPDATED", targetType: "product", targetId: product.id, meta: data });
  });
  return getProduct(user, product_id);
}

// ------------------------------------------------------------ formulas

/** Add a standard recipe line (spec §6): product x species. */
async function addFormula(user, { product_id, species_code, standard_quantity = null, unit = null }) {
  const product = await getOwnedProduct(user, product_id);
  const species = await prisma.species.findUnique({ where: { code: species_code } });
  if (!species) throw new ApiError("not_found", "Species not found", 404);
  if (standard_quantity != null && !Number.isFinite(Number(standard_quantity))) {
    throw new ApiError("bad_request", "standard_quantity must be a number", 400);
  }
  const existing = await prisma.productFormula.findUnique({
    where: { product_id_species_id: { product_id: product.id, species_id: species.id } },
  });
  if (existing) throw new ApiError("formula_exists", "This species is already in the formula", 409);

  const formula = await prisma.$transaction(async (tx) => {
    const pos = await tx.productFormula.count({ where: { product_id: product.id } });
    const row = await tx.productFormula.create({
      data: {
        product_id: product.id,
        species_id: species.id,
        standard_quantity: standard_quantity == null ? null : Number(standard_quantity),
        unit: unit?.trim() || null,
        position: pos,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "FORMULA_ADDED",
      targetType: "product_formula",
      targetId: row.id,
      meta: { product_id: product.id, species_code, quantity: standard_quantity, unit },
    });
    return row;
  });
  return prisma.productFormula.findUnique({ where: { id: formula.id }, include: { species: { select: { code: true, common_name: true } } } });
}

/** Remove a formula line. */
async function removeFormula(user, { product_id, formula_id }) {
  await getOwnedProduct(user, product_id);
  const formula = await prisma.productFormula.findUnique({ where: { id: formula_id } });
  if (!formula || formula.product_id !== product_id) throw new ApiError("not_found", "Formula line not found", 404);
  await prisma.$transaction(async (tx) => {
    await tx.productFormula.delete({ where: { id: formula.id } });
    await writeAudit(tx, { actorUserId: user.id, action: "FORMULA_REMOVED", targetType: "product_formula", targetId: formula.id, meta: { product_id } });
  });
  return { removed: true };
}

// ------------------------------------------------------------ run lifecycle

/**
 * Create a planned run (spec workflow: select -> reserve -> create run).
 * Every ingredient quantity is RESERVED in the SAME transaction that creates
 * the run + its ingredient edges. Ingredient validation (spec §12): batch
 * certified with a valid certificate, in the manufacturer's inventory, and
 * enough AVAILABLE quantity (reserve refuses understock + active holds).
 */
async function createRun(user, { product_id, planned_units, ingredients, notes = null }) {
  await assertManufacturer(user);
  const product = await getOwnedProduct(user, product_id);
  if (product.status === "recalled") throw new ApiError("invalid_state", "Cannot run a recalled product", 409);
  const units = Number(planned_units);
  if (!Number.isInteger(units) || units <= 0) throw new ApiError("bad_request", "planned_units must be a positive integer", 400);
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new ApiError("bad_request", "ingredients must be a non-empty array of { batch_id, quantity_kg }", 400);
  }

  // Pre-validate every ingredient OUTSIDE the tx (certificate + inventory reads).
  const resolved = [];
  const seen = new Set();
  for (const ing of ingredients) {
    const qty = parseFloat(ing.quantity_kg);
    if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("bad_request", "each ingredient needs a positive quantity_kg", 400);
    const batch = await prisma.batch.findUnique({ where: { id: ing.batch_id } });
    if (!batch) throw new ApiError("not_found", `Batch ${ing.batch_id} not found`, 404);
    if (batch.test_status !== "certified") {
      throw new ApiError("not_certified", `Batch ${batch.code} is '${batch.test_status}' — only certified batches enter products`, 409);
    }
    const cert = await batchCertificate(batch.id);
    if (!cert) throw new ApiError("certificate_invalid", `Batch ${batch.code} has no valid certificate — production blocked`, 409);
    const item = await prisma.inventoryItem.findUnique({
      where: { manufacturer_user_id_batch_id: { manufacturer_user_id: user.id, batch_id: batch.id } },
    });
    if (!item) throw new ApiError("not_found", `Batch ${batch.code} is not in your inventory`, 404);
    if (item.available_quantity_kg < qty) {
      throw new ApiError("insufficient_stock", `Batch ${batch.code}: only ${item.available_quantity_kg} kg available (need ${qty})`, 409);
    }
    if (seen.has(batch.id)) throw new ApiError("bad_request", `Batch ${batch.code} listed twice — merge the quantities`, 400);
    seen.add(batch.id);
    resolved.push({ batch, item, quantity_kg: qty, certificate_number: cert.certificate_number });
  }

  const run = await prisma.$transaction(async (tx) => {
    const code = await nextRunCode(tx);
    const row = await tx.manufacturingBatch.create({
      data: {
        code,
        product_id: product.id,
        manufacturer_user_id: user.id,
        status: "planned",
        planned_units: units,
        notes: notes?.trim() || null,
      },
    });
    let position = 0;
    for (const r of resolved) {
      await reserveTx(tx, user, { inventory_id: r.item.id, quantity_kg: r.quantity_kg, reference_id: row.id });
      await tx.manufacturingBatchIngredient.create({
        data: {
          manufacturing_batch_id: row.id,
          batch_id: r.batch.id,
          inventory_item_id: r.item.id,
          quantity_kg: r.quantity_kg,
          unit: "kg",
          position: position++,
          state: "reserved",
        },
      });
    }
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "RUN_CREATED",
      targetType: "manufacturing_batch",
      targetId: row.id,
      meta: { code, product_id: product.id, planned_units: units, ingredient_count: resolved.length },
    });
    return row;
  });
  return getRun(user, run.id);
}

/** planned -> in_progress (production_date stamped). */
async function startRun(user, runId) {
  const run = await prisma.manufacturingBatch.findUnique({ where: { id: runId } });
  if (!run) throw new ApiError("not_found", "Manufacturing run not found", 404);
  if (run.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This run belongs to another manufacturer", 403);
  }
  if (run.status !== "planned") throw new ApiError("invalid_state", `Only a planned run can start (currently '${run.status}')`, 409);
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.manufacturingBatch.update({
      where: { id: run.id },
      data: { status: "in_progress", production_date: new Date() },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "RUN_STARTED", targetType: "manufacturing_batch", targetId: run.id, meta: { code: run.code } });
    return row;
  });
  return getRun(user, updated.id);
}

/** Batch fully spent? (all its manufacturer inventory is consumed.) */
async function isBatchSpent(batchId) {
  const items = await prisma.inventoryItem.findMany({ where: { batch_id: batchId } });
  return items.length > 0 && items.every((i) => i.available_quantity_kg === 0 && i.reserved_quantity_kg === 0 && i.consumed_quantity_kg > 0);
}

/** Mint a raw product QR token (never stored — hash + cipher only). */
function mintProductQrToken() {
  const bytes = crypto.randomBytes(env.QR_TOKEN_BYTES || 24);
  return `${env.PRODUCT_QR_PREFIX}${bytes.toString("base64url")}`;
}

function tokenPrefixOf(raw) {
  return raw.length > 14 ? `${raw.slice(0, 14)}…` : raw;
}

/** Create the permanent product QR row for a lot (inside the run tx). */
async function createProductQr(tx, { lotId, productId, mintedByUserId }) {
  const raw = mintProductQrToken();
  const row = await tx.productQrToken.create({
    data: {
      product_id: productId,
      lot_id: lotId,
      token_hash: hashToken(raw),
      token_cipher: encryptToken(raw),
      token_prefix: tokenPrefixOf(raw),
      status: "active",
      minted_by_user_id: mintedByUserId,
      minted_at: new Date(),
    },
  });
  return { row, raw };
}

/**
 * in_progress -> completed. In ONE transaction: consume every reserved
 * ingredient (consumed_for_production ledger rows), emit the finished
 * ProductLot + permanent product QR, write LOT_CREATED + per-batch
 * BATCH_LINKED_TO_PRODUCT events, anchor PRODUCT_CREATED / LINKED on the
 * ledger, mark spent herb batches consumed, then freeze the lineage snapshot.
 */
async function completeRun(user, runId, { produced_units = null } = {}) {
  const run = await prisma.manufacturingBatch.findUnique({
    where: { id: runId },
    include: { ingredients: { include: { batch: true } }, product: true },
  });
  if (!run) throw new ApiError("not_found", "Manufacturing run not found", 404);
  if (run.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This run belongs to another manufacturer", 403);
  }
  if (run.status !== "in_progress") {
    throw new ApiError("invalid_state", `Only an in-progress run can be completed (currently '${run.status}')`, 409);
  }
  const output = produced_units == null ? run.planned_units : Number(produced_units);
  if (!Number.isInteger(output) || output <= 0) {
    throw new ApiError("bad_request", "produced_units must be a positive integer", 400);
  }
  if (run.ingredients.length === 0) throw new ApiError("invalid_state", "This run has no ingredients to consume", 409);
  if (run.ingredients.some((i) => i.state !== "reserved")) {
    throw new ApiError("invalid_state", "Some ingredients are not reserved — this run cannot be completed", 409);
  }
  if (run.product.status === "recalled") throw new ApiError("invalid_state", "Product is recalled — cannot complete production", 409);

  const now = new Date();
  const out = await prisma.$transaction(async (tx) => {
    // 1) Consume each ingredient through the Phase-9 ledger kernel.
    for (const ing of run.ingredients) {
      await consumeTx(tx, user, {
        inventory_id: ing.inventory_item_id,
        quantity_kg: ing.quantity_kg,
        reference_id: run.id,
        transaction_type: "consumed_for_production",
      });
      await tx.manufacturingBatchIngredient.update({ where: { id: ing.id }, data: { state: "consumed", consumed_at: now } });
    }

    // 2) Finished lot — one sellable lot per completed run (spec §1).
    const lotCode = await nextLotCode(tx);
    const expiry = run.product.expiry_months
      ? new Date(now.getFullYear(), now.getMonth() + run.product.expiry_months, now.getDate())
      : null;
    const lot = await tx.productLot.create({
      data: {
        code: lotCode,
        product_id: run.product_id,
        manufacturing_batch_id: run.id,
        quantity_units: output,
        units_remaining: output,
        phase: "with_manufacturer",
        current_holder_user_id: user.id,
        expiry_date: expiry,
      },
    });

    // 3) Permanent product QR for the lot (spec §7 — per finished run/lot).
    const { raw } = await createProductQr(tx, { lotId: lot.id, productId: run.product_id, mintedByUserId: user.id });

    // 4) LOT_CREATED event + PRODUCT_CREATED ledger anchor.
    const lotEvent = await tx.productLotEvent.create({
      data: {
        lot_id: lot.id,
        event_type: "LOT_CREATED",
        actor_user_id: user.id,
        to_user_id: user.id,
        phase_before: null,
        phase_after: "with_manufacturer",
        payload_json: { run_code: run.code, product_code: run.product.code, quantity_units: output },
      },
    });
    await tx.blockchainEvent.create({
      data: { anchor_code: "PRODUCT_CREATED", entity_type: "product_lot_event", entity_id: lotEvent.id, status: "pending" },
    });

    // Phase 14: product/lot created — manufacturer + AYUSH admins.
    await publish(tx, {
      code: "product_created",
      recipientUserId: user.id,
      data: { code: lotCode, name: run.product.name, lots: 1, entity: { type: "product_lot", id: lot.id } },
    });
    const admins = await tx.user.findMany({ where: { role: "admin" }, select: { id: true } });
    for (const a of admins) {
      await publish(tx, {
        code: "product_created",
        recipientUserId: a.id,
        data: { code: lotCode, name: run.product.name, lots: 1, entity: { type: "product_lot", id: lot.id } },
      });
    }

    // 5) Per-ingredient BATCH_LINKED_TO_PRODUCT events + LINKED anchors; the
    //    herb batch's own timeline records which product consumed it.
    for (const ing of run.ingredients) {
      const ev = await tx.batchEvent.create({
        data: {
          batch_id: ing.batch_id,
          event_type: "PRODUCT_LINK",
          actor_user_id: user.id,
          payload_json: {
            product_id: run.product_id,
            product_code: run.product.code,
            lot_code: lotCode,
            run_code: run.code,
            quantity_kg: ing.quantity_kg,
          },
        },
      });
      await tx.blockchainEvent.create({
        data: { anchor_code: "LINKED", entity_type: "batch_event", entity_id: ev.id, status: "pending" },
      });
    }

    // 6) Close the run.
    await tx.manufacturingBatch.update({
      where: { id: run.id },
      data: { status: "completed", completed_at: now },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "RUN_COMPLETED",
      targetType: "manufacturing_batch",
      targetId: run.id,
      meta: { code: run.code, product_code: run.product.code, lot_code: lotCode, produced_units: output },
    });
    return { lotId: lot.id, lotCode, raw };
  });

  // Freeze the lineage snapshot (tamper-evident copy for audit + consumer view).
  await storeLineageSnapshot(user, run.id, out.lotId);

  // Post-completion: mark any now-spent herb batch terminal (all its
  // manufacturer inventory consumed) — done after the tx with fresh reads.
  for (const ing of run.ingredients) {
    const batchRow = await prisma.batch.findUnique({ where: { id: ing.batch_id } });
    if (batchRow && batchRow.phase !== "consumed" && (await isBatchSpent(ing.batch_id))) {
      await prisma.$transaction(async (tx) => {
        await tx.batch.update({ where: { id: ing.batch_id }, data: { phase: "consumed" } });
        await tx.batchEvent.create({
          data: {
            batch_id: ing.batch_id,
            event_type: "BATCH_EXHAUSTED",
            actor_user_id: user.id,
            phase_before: batchRow.phase,
            phase_after: "consumed",
            payload_json: { run_code: run.code },
          },
        });
      });
    }
  }

  const completed = await getRun(user, run.id);
  const lot = await getLot(user, out.lotId);
  return { run: completed, lot, qr: { raw: out.raw, token_prefix: tokenPrefixOf(out.raw), lot_code: out.lotCode } };
}

/** planned (or in_progress with nothing consumed) -> cancelled: release. */
async function cancelRun(user, runId, { reason = null } = {}) {
  const run = await prisma.manufacturingBatch.findUnique({
    where: { id: runId },
    include: { ingredients: true },
  });
  if (!run) throw new ApiError("not_found", "Manufacturing run not found", 404);
  if (run.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This run belongs to another manufacturer", 403);
  }
  if (!["planned", "in_progress"].includes(run.status)) {
    throw new ApiError("invalid_state", `Only a planned/in-progress run can be cancelled (currently '${run.status}')`, 409);
  }
  if (run.ingredients.some((i) => i.state === "consumed")) {
    throw new ApiError("invalid_state", "Ingredients already consumed — this run cannot be cancelled", 409);
  }
  await prisma.$transaction(async (tx) => {
    for (const ing of run.ingredients) {
      if (ing.state !== "reserved") continue;
      await releaseTx(tx, user, { inventory_id: ing.inventory_item_id, quantity_kg: ing.quantity_kg, reference_id: run.id });
      await tx.manufacturingBatchIngredient.update({ where: { id: ing.id }, data: { state: "released" } });
    }
    await tx.manufacturingBatch.update({ where: { id: run.id }, data: { status: "cancelled" } });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "RUN_CANCELLED",
      targetType: "manufacturing_batch",
      targetId: run.id,
      meta: { code: run.code, reason: reason || null },
    });
  });
  return getRun(user, run.id);
}

/** Manufacturer's runs (admin: all). */
async function listRuns(user, { status = null, limit = 100, offset = 0 } = {}) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only manufacturers can list production runs", 403);
  }
  const where = user.role === "manufacturer" ? { manufacturer_user_id: user.id } : {};
  if (status) {
    if (!RUN_STATUSES.includes(status)) throw new ApiError("bad_request", `status must be one of: ${RUN_STATUSES.join(", ")}`, 400);
    where.status = status;
  }
  const [runs, total] = await Promise.all([
    prisma.manufacturingBatch.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
      include: runInclude(),
    }),
    prisma.manufacturingBatch.count({ where }),
  ]);
  return { runs, total };
}

async function getRun(user, runId) {
  const run = await prisma.manufacturingBatch.findUnique({ where: { id: runId }, include: runInclude() });
  if (!run) throw new ApiError("not_found", "Manufacturing run not found", 404);
  if (run.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This run belongs to another manufacturer", 403);
  }
  return run;
}

/** One finished lot (owner / admin / the lot's current holder). */
async function getLot(user, lotId) {
  const lot = await prisma.productLot.findUnique({ where: { id: lotId }, include: lotInclude() });
  if (!lot) throw new ApiError("not_found", "Product lot not found", 404);
  const product = await prisma.product.findUnique({ where: { id: lot.product_id } });
  if (user.role !== "admin" && user.id !== product?.manufacturer_user_id && user.id !== lot.current_holder_user_id) {
    throw new ApiError("forbidden", "You cannot view this product lot", 403);
  }
  return lot;
}

/** Manufacturer's finished lots (admin: all). */
async function listLots(user, { product_id = null, limit = 100, offset = 0 } = {}) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only manufacturers can list product lots", 403);
  }
  const where = {};
  if (user.role === "manufacturer") {
    where.product = { manufacturer_user_id: user.id };
  }
  if (product_id) where.product_id = product_id;
  const [lots, total] = await Promise.all([
    prisma.productLot.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
      include: { product: { select: { id: true, code: true, name: true } }, qr_token: true },
    }),
    prisma.productLot.count({ where }),
  ]);
  return { lots, total };
}

// ------------------------------------------------------------ lineage

/** Backward lineage of one product (spec §8): product -> runs -> ingredient
 * batches -> farmers/certificates/transport, plus every frozen snapshot. */
async function productLineage(user, productId) {
  await getOwnedProduct(user, productId);
  const [product, snapshots] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        manufacturer: { select: { id: true, name: true } },
        formulas: { include: { species: { select: { code: true, common_name: true } } } },
        runs: {
          orderBy: { created_at: "desc" },
          include: {
            ingredients: {
              orderBy: { position: "asc" },
              include: {
                batch: {
                  include: {
                    species: { select: { code: true, common_name: true, scientific_name: true } },
                    farmer: { select: { id: true, name: true } },
                    certifications: { orderBy: { issued_at: "desc" }, take: 1 },
                    events: {
                      where: { event_type: { in: ["CREATED", "TRANSFER", "LAB_CERTIFIED", "PRODUCT_LINK"] } },
                      orderBy: { created_at: "asc" },
                      include: {
                        actor: { select: { id: true, name: true, role: true } },
                        from_user: { select: { id: true, name: true } },
                        to_user: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        lots: { include: { qr_token: true, events: { orderBy: { created_at: "asc" } } } },
      },
    }),
    prisma.productLineageSnapshot.findMany({
      where: { product_id: productId },
      orderBy: { generated_at: "desc" },
      take: 100,
    }),
  ]);
  return { product, snapshots };
}

/** Forward trace of a herb batch (spec §9): batch -> runs -> products/lots. */
async function batchForwardTrace(user, batchId) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  // Read scope: admin, the batch's farmer, its current holder, or a
  // manufacturer that holds this batch in inventory.
  const isAdmin = user.role === "admin";
  const isFarmer = batch.farmer_id === user.id;
  const isHolder = batch.current_holder_user_id === user.id;
  const holdsItem = (await prisma.inventoryItem.count({ where: { manufacturer_user_id: user.id, batch_id: batchId } })) > 0;
  if (!isAdmin && !isFarmer && !isHolder && !holdsItem) {
    throw new ApiError("forbidden", "You are not a party to this batch", 403);
  }
  const [ingredients, affected] = await Promise.all([
    prisma.manufacturingBatchIngredient.findMany({
      where: { batch_id: batchId },
      include: {
        run: {
          include: {
            product: { select: { id: true, code: true, name: true, status: true } },
            lots: { include: { qr_token: true, holder: { select: { id: true, name: true, role: true } } } },
          },
        },
      },
    }),
    prisma.affectedProduct.findMany({
      where: { batch_id: batchId },
      include: { product: { select: { id: true, code: true, name: true } } },
      orderBy: { detected_at: "desc" },
    }),
  ]);
  return {
    batch: { id: batch.id, code: batch.code, species: batch.species ? { code: batch.species.code, common_name: batch.species.common_name } : null },
    usage: ingredients.map((ing) => ({
      id: ing.id,
      quantity_kg: ing.quantity_kg,
      state: ing.state,
      consumed_at: ing.consumed_at,
      run: ing.run
        ? {
            id: ing.run.id,
            code: ing.run.code,
            status: ing.run.status,
            product: ing.run.product ? { id: ing.run.product.id, code: ing.run.product.code, name: ing.run.product.name, status: ing.run.product.status } : null,
            lots: ing.run.lots.map((l) => ({
              id: l.id,
              code: l.code,
              phase: l.phase,
              quantity_units: l.quantity_units,
              holder: l.holder ? { id: l.holder.id, name: l.holder.name, role: l.holder.role } : null,
              qr_prefix: l.qr_token?.token_prefix || null,
              created_at: l.created_at,
            })),
          }
        : null,
    })),
    affected: affected.map((a) => ({
      id: a.id,
      product: a.product ? { id: a.product.id, code: a.product.code, name: a.product.name } : null,
      impact_type: a.impact_type,
      status: a.status,
      detected_at: a.detected_at,
    })),
  };
}

/** Build + freeze the tamper-evident backward-lineage snapshot (post-run). */
async function buildLineageSnapshot(user, runId, lotId) {
  const run = await prisma.manufacturingBatch.findUnique({
    where: { id: runId },
    include: {
      product: {
        include: {
          manufacturer: { select: { id: true, name: true } },
          formulas: { include: { species: { select: { code: true, common_name: true } } } },
        },
      },
      ingredients: {
        orderBy: { position: "asc" },
        include: {
          batch: {
            include: {
              species: { select: { code: true, common_name: true, scientific_name: true } },
              farmer: { select: { id: true, name: true } },
              certifications: { orderBy: { issued_at: "desc" }, take: 1 },
              events: {
                where: { event_type: { in: ["CREATED", "TRANSFER", "LAB_CERTIFIED"] } },
                orderBy: { created_at: "asc" },
                include: {
                  actor: { select: { id: true, name: true, role: true } },
                  from_user: { select: { id: true, name: true } },
                  to_user: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!run) throw new ApiError("not_found", "Manufacturing run not found", 404);
  const lot = lotId ? await prisma.productLot.findUnique({ where: { id: lotId }, include: { qr_token: true } }) : null;

  const payload = {
    product: {
      code: run.product.code,
      name: run.product.name,
      sku: run.product.sku,
      category: run.product.category,
      manufacturer: run.product.manufacturer ? { id: run.product.manufacturer.id, name: run.product.manufacturer.name } : null,
      formula: (run.product.formulas || []).map((f) => ({
        species: f.species ? { code: f.species.code, common_name: f.species.common_name } : null,
        standard_quantity: f.standard_quantity,
        unit: f.unit,
      })),
    },
    run: { code: run.code, status: run.status, planned_units: run.planned_units, completed_at: run.completed_at },
    lot: lot
      ? { code: lot.code, quantity_units: lot.quantity_units, units_remaining: lot.units_remaining, expiry_date: lot.expiry_date, qr_prefix: lot.qr_token?.token_prefix || null }
      : null,
    ingredients: (run.ingredients || []).map((ing) => {
      const b = ing.batch;
      const cert = b.certifications?.[0] || null;
      return {
        quantity_kg: ing.quantity_kg,
        unit: ing.unit,
        batch: {
          code: b.code,
          species: b.species ? { code: b.species.code, common_name: b.species.common_name, scientific_name: b.species.scientific_name } : null,
          farmer: b.farmer ? { id: b.farmer.id, name: b.farmer.name } : null,
          origin: b.location || null,
          gps: b.gps_lat != null ? { lat: b.gps_lat, lng: b.gps_lng } : null,
          harvest_date: b.harvest_date,
          cultivation_type: b.cultivation_type,
        },
        certificate: cert
          ? {
              certificate_number: cert.certificate_number,
              certificate_hash: cert.certificate_hash,
              lab_code: cert.lab_code,
              lab_name: cert.lab_name,
              species_code: cert.species_code,
              issued_at: cert.issued_at,
              expiry_date: cert.expiry_date,
            }
          : null,
        journey: (b.events || []).map((e) => ({
          event_type: e.event_type,
          actor: e.actor ? { id: e.actor.id, name: e.actor.name, role: e.actor.role } : null,
          from: e.from_user ? { id: e.from_user.id, name: e.from_user.name } : null,
          to: e.to_user ? { id: e.to_user.id, name: e.to_user.name } : null,
          phase_before: e.phase_before,
          phase_after: e.phase_after,
          created_at: e.created_at,
        })),
      };
    }),
    generated_at: new Date().toISOString(),
  };

  return prisma.productLineageSnapshot.create({
    data: {
      product_id: run.product_id,
      manufacturing_batch_id: run.id,
      lot_id: lot?.id || null,
      snapshot_json: payload,
      generated_by_user_id: user.id,
    },
  });
}

async function storeLineageSnapshot(user, runId, lotId) {
  return buildLineageSnapshot(user, runId, lotId);
}

// ------------------------------------------------------------ QR verify

/** Resolve a scanned product QR to its lot + public trace (spec §7). */
async function verifyProductQr({ token, actor = null, meta = {} }) {
  const record = await prisma.productQrToken.findUnique({
    where: { token_hash: hashToken(token) },
    include: {
      lot: {
        include: {
          product: { include: { manufacturer: { select: { id: true, name: true } } } },
          run: true,
        },
      },
    },
  });
  const scanLog = (outcome, failureReason = null) =>
    prisma.qrScanLog.create({
      data: {
        target_type: "product_lot",
        target_id: record?.lot_id || null,
        purpose: "consumer_view",
        actor_user_id: actor?.id || null,
        device_id: meta.deviceId || null,
        ip_address: meta.ip || null,
        location: meta.location || null,
        gps_lat: meta.gpsLat ?? null,
        gps_lng: meta.gpsLng ?? null,
        outcome,
        failure_reason: failureReason,
      },
    });

  if (!record) {
    await scanLog("not_found", "unknown_token");
    return { valid: false, reason: "not_found", message: "Product QR token not recognised" };
  }
  if (record.status !== "active") {
    await scanLog("invalid", `token_${record.status}`);
    return { valid: false, reason: "revoked", message: "This product QR has been revoked (recall/QA)", product_id: record.product_id, lot_id: record.lot_id };
  }
  await scanLog("success");
  const lot = record.lot;
  return {
    valid: true,
    product: lot?.product
      ? {
          code: lot.product.code,
          name: lot.product.name,
          category: lot.product.category,
          manufacturer: lot.product.manufacturer ? { id: lot.product.manufacturer.id, name: lot.product.manufacturer.name } : null,
        }
      : { code: null, name: null, category: null, manufacturer: null },
    lot: lot
      ? {
          id: lot.id,
          code: lot.code,
          phase: lot.phase,
          quantity_units: lot.quantity_units,
          units_remaining: lot.units_remaining,
          expiry_date: lot.expiry_date,
          status: "active",
          created_at: lot.created_at,
        }
      : null,
    token_prefix: record.token_prefix,
  };
}

/** Reprint URL + PNG for a lot's permanent QR (owner/admin only). */
async function lotQrCard(user, lotId) {
  const lot = await prisma.productLot.findUnique({ where: { id: lotId }, include: { qr_token: true, product: true } });
  if (!lot) throw new ApiError("not_found", "Product lot not found", 404);
  if (user.role !== "admin" && user.id !== lot.product.manufacturer_user_id && user.id !== lot.current_holder_user_id) {
    throw new ApiError("forbidden", "Only the manufacturer or current holder can view this QR", 403);
  }
  if (!lot.qr_token) throw new ApiError("not_found", "This lot has no product QR yet", 404);
  const { decryptToken } = require("./qrEngine");
  const raw = decryptToken(lot.qr_token.token_cipher);
  const base = (env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const url = `${base}/qr/${raw}`;
  const qrcode = require("qrcode");
  const png = await qrcode.toDataURL(url);
  return {
    product_id: lot.product_id,
    product_code: lot.product.code,
    lot_id: lot.id,
    lot_code: lot.code,
    status: lot.qr_token.status,
    token_prefix: lot.qr_token.token_prefix,
    url,
    png,
    minted_at: lot.qr_token.minted_at,
  };
}

// ------------------------------------------------------------ recall support

/** Flag a herb batch -> write AffectedProduct rows for its blast radius
 * (spec §10). Marks affected products recalled. Admin or a manufacturer that
 * holds inventory of the batch. */
async function assessBatchImpact(user, { batch_id, impact_type, notes = null }) {
  if (!IMPACT_TYPES.includes(impact_type)) {
    throw new ApiError("bad_request", `impact_type must be one of: ${IMPACT_TYPES.join(", ")}`, 400);
  }
  const batch = await prisma.batch.findUnique({ where: { id: batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  if (user.role !== "admin") {
    const holds = await prisma.inventoryItem.count({ where: { manufacturer_user_id: user.id, batch_id } });
    if (holds === 0) throw new ApiError("forbidden", "Only an admin or a manufacturer holding this batch can flag it", 403);
  }
  const usage = await prisma.manufacturingBatchIngredient.findMany({
    where: { batch_id },
    include: { run: { include: { product: true } } },
  });
  const seen = new Set();
  const created = [];
  for (const ing of usage) {
    const product = ing.run?.product;
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    const existing = await prisma.affectedProduct.findFirst({
      where: { batch_id, product_id: product.id, status: "open" },
    });
    if (existing) continue;
    const row = await prisma.$transaction(async (tx) => {
      const affected = await tx.affectedProduct.create({
        data: {
          batch_id,
          product_id: product.id,
          manufacturing_batch_id: ing.manufacturing_batch_id,
          lot_id: null,
          impact_type,
          status: "open",
          notes: notes?.trim() || null,
          detected_by_user_id: user.id,
          detected_at: new Date(),
        },
      });
      // Recall is a public-facing verdict: flip the persisted engine status
      // and purge the passport cache so no consumer ever serves a stale
      // VERIFIED passport (phase 11 — docs/phase_11.md check 2).
      await tx.product.update({ where: { id: product.id }, data: { status: "recalled", verification_status: "RECALLED" } });
      await tx.productVerificationCache.deleteMany({ where: { product_id: product.id } });
      await writeAudit(tx, {
        actorUserId: user.id,
        action: "AFFECTED_PRODUCT_OPENED",
        targetType: "affected_product",
        targetId: affected.id,
        meta: { batch_id, batch_code: batch.code, product_id: product.id, product_code: product.code, impact_type },
      });
      return affected;
    });
    created.push(row);
  }
  return { flagged_batch: batch.code, affected_count: created.length, created };
}

/** Affected products across the user's products (admin: all). */
async function listAffectedProducts(user, { status = "open", limit = 100, offset = 0 } = {}) {
  if (!AFFECTED_STATUSES.includes(status)) throw new ApiError("bad_request", `status must be one of: ${AFFECTED_STATUSES.join(", ")}`, 400);
  const where = { status };
  if (user.role !== "admin") {
    if (user.role !== "manufacturer") throw new ApiError("forbidden", "Only manufacturers can list affected products", 403);
    where.product = { manufacturer_user_id: user.id };
  }
  const [items, total] = await Promise.all([
    prisma.affectedProduct.findMany({
      where,
      orderBy: { detected_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
      include: {
        batch: { select: { id: true, code: true, species: { select: { code: true, common_name: true } } } },
        product: { select: { id: true, code: true, name: true, status: true } },
      },
    }),
    prisma.affectedProduct.count({ where }),
  ]);
  return { affected: items, total };
}

/** Resolve an open impact (admin or the affected product's manufacturer). */
async function resolveAffectedProduct(user, { affected_id, note = null }) {
  const affected = await prisma.affectedProduct.findUnique({
    where: { id: affected_id },
    include: { product: true, batch: { select: { code: true } } },
  });
  if (!affected) throw new ApiError("not_found", "Affected product record not found", 404);
  if (user.role !== "admin" && affected.product?.manufacturer_user_id !== user.id) {
    throw new ApiError("forbidden", "You cannot resolve this record", 403);
  }
  if (affected.status !== "open") throw new ApiError("invalid_state", "This record is not open", 409);
  await prisma.$transaction(async (tx) => {
    await tx.affectedProduct.update({
      where: { id: affected.id },
      data: { status: "resolved", resolved_at: new Date(), notes: note || affected.notes },
    });
    // Drop the passport cache so the next scan re-evaluates (the product
    // stays recalled until an admin re-activates it, but caches must never
    // serve the pre-recall snapshot).
    await tx.productVerificationCache.deleteMany({ where: { product_id: affected.product_id } });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "AFFECTED_PRODUCT_RESOLVED",
      targetType: "affected_product",
      targetId: affected.id,
      meta: { batch_id: affected.batch_id, batch_code: affected.batch?.code, product_id: affected.product_id, note },
    });
  });
  return prisma.affectedProduct.findUnique({ where: { id: affected.id }, include: { product: { select: { id: true, code: true, name: true } } } });
}

// ------------------------------------------------------------ analytics

/** Manufacturer production dashboard (spec §15 additions). */
async function dashboard(user) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only manufacturers can view the production dashboard", 403);
  }
  const where = user.role === "manufacturer" ? { manufacturer_user_id: user.id } : {};
  const productWhere = user.role === "manufacturer" ? { manufacturer_user_id: user.id } : {};
  const [products, runs, lots, affected, ingredients] = await Promise.all([
    prisma.product.findMany({ where: productWhere, select: { id: true, status: true } }),
    prisma.manufacturingBatch.findMany({ where, select: { id: true, status: true, planned_units: true } }),
    prisma.productLot.findMany({
      where: user.role === "manufacturer" ? { product: { manufacturer_user_id: user.id } } : {},
      select: { id: true, quantity_units: true, units_remaining: true },
    }),
    prisma.affectedProduct.findMany({
      where: user.role === "manufacturer" ? { product: { manufacturer_user_id: user.id }, status: "open" } : { status: "open" },
      select: { id: true, impact_type: true },
    }),
    prisma.manufacturingBatchIngredient.findMany({
      where: { run: where },
      select: { quantity_kg: true },
    }),
  ]);
  const byStatus = (s) => runs.filter((r) => r.status === s).length;
  const produced = runs.filter((r) => r.status === "completed").reduce((s, r) => s + r.planned_units, 0);
  const remaining = lots.reduce((s, l) => s + l.units_remaining, 0);
  return {
    products: products.length,
    product_status: {
      draft: products.filter((p) => p.status === "draft").length,
      active: products.filter((p) => p.status === "active").length,
      discontinued: products.filter((p) => p.status === "discontinued").length,
      recalled: products.filter((p) => p.status === "recalled").length,
    },
    runs: { planned: byStatus("planned"), in_progress: byStatus("in_progress"), completed: byStatus("completed"), cancelled: byStatus("cancelled") },
    units_produced: produced,
    units_remaining: remaining,
    materials_consumed_kg: Math.round(ingredients.reduce((s, i) => s + i.quantity_kg, 0) * 1000) / 1000,
    open_impacts: affected.length,
  };
}

// ------------------------------------------------------------ exports

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  addFormula,
  removeFormula,
  createRun,
  startRun,
  completeRun,
  cancelRun,
  listRuns,
  getRun,
  getLot,
  listLots,
  productLineage,
  batchForwardTrace,
  verifyProductQr,
  lotQrCard,
  assessBatchImpact,
  listAffectedProducts,
  resolveAffectedProduct,
  dashboard,
  nextProductCode,
  nextRunCode,
  nextLotCode,
  // shared with tests / other phases
  buildLineageSnapshot,
  isBatchSpent,
};
