/**
 * Batch service (docs/batch/architecture.md §4).
 *
 * createBatch runs the whole "digital birth" in ONE transaction: batch row,
 * image attachments, CREATED event, audit log and a pending blockchain anchor.
 * All-or-nothing — a failed QR mint can't leave a half-created batch.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { toKg, DUP_WINDOW_HOURS, DUP_WEIGHT_TOLERANCE_KG } = require("../constants/batch");
const { nextBatchCode } = require("./batchCodes");
const { assertOwnedAssets } = require("./uploads");
const { mintInitialQr } = require("./qrEngine"); // phase 5: v1 ownership QR born with the batch

const BATCH_INCLUDE = {
  species: { select: { id: true, code: true, common_name: true, scientific_name: true } },
  farmer: { select: { id: true, name: true } },
};

const DOCS_SELECT = {
  id: true,
  doc_kind: true,
  is_primary: true,
  created_at: true,
  asset: { select: { id: true, url: true, filename: true, mime_type: true, metadata_json: true } },
};

async function resolveSpecies({ species_id = null, species_code = null } = {}) {
  if (!species_id && !species_code) throw new ApiError("bad_request", "species_id or species_code is required", 400);
  const species = await prisma.species.findFirst({
    where: {
      is_active: true,
      ...(species_id ? { id: species_id } : { code: species_code.toLowerCase().trim() }),
    },
  });
  if (!species) throw new ApiError("not_found", "Species not found or inactive", 404);
  return species;
}

/**
 * Create a batch inside one transaction.
 *
 * Phase 4 integration: when `identification_id` is present (a confirmed AI/ML
 * identification owned by this farmer) the species is derived from it and the
 * analysed photo is attached automatically — the farmer never uploads twice.
 *
 * @returns { { batch, duplicate_warning: boolean, images_attached: number, identification_id: string|null } }
 */
async function createBatch(user, input) {
  // Load the confirmed identification (farmer-owned, unused) when referenced.
  let identification = null;
  if (input.identification_id) {
    identification = await prisma.aiIdentification.findFirst({
      where: { id: input.identification_id, user_id: user.id },
      select: { id: true, status: true, batch_id: true, selected_species_id: true, top_species_id: true, asset_id: true },
    });
    if (!identification) throw new ApiError("not_found", "Identification not found", 404);
    if (identification.status !== "confirmed") {
      throw new ApiError("bad_request", "Identification must be confirmed before registering a batch", 400);
    }
    if (identification.batch_id) {
      throw new ApiError("invalid_state", "This identification is already linked to a batch", 409);
    }
  }

  // Species: explicit input wins; otherwise the identification's confirmed pick.
  const species = input.species_id || input.species_code
    ? await resolveSpecies(input)
    : await resolveSpecies({
        species_id: identification ? identification.selected_species_id || identification.top_species_id : null,
      }).catch(() => {
        throw new ApiError("bad_request", "Identification carries no confirmed species — select one manually", 400);
      });

  // Images: explicit uploads + the identification's analysed photo (once).
  const requestedAssets = input.asset_ids || [];
  const assetIds = [...requestedAssets];
  if (identification && identification.asset_id && !assetIds.includes(identification.asset_id)) {
    assetIds.push(identification.asset_id);
  }
  if (!assetIds.length) {
    throw new ApiError("bad_request", "At least one image is required (upload one or confirm an identification)", 400);
  }
  await assertOwnedAssets(user.id, assetIds); // all must belong to this farmer
  const primaryAssetId =
    input.primary_asset_id ||
    (identification && assetIds.includes(identification.asset_id) ? identification.asset_id : assetIds[0]);

  const weightKg = toKg(input.quantity, input.unit || "kg");
  const duplicate = await looksDuplicate(user.id, species.id, input.harvest_date, weightKg);

  let batchId = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      batchId = await prisma.$transaction(async (tx) => {
        const code = await nextBatchCode(tx);
        const batch = await tx.batch.create({
          data: {
            code,
            farmer_id: user.id,
            species_id: species.id,
            harvest_date: input.harvest_date,
            weight_kg: weightKg,
            cultivation_type: input.cultivation_type,
            attributes_json: input.attributes || null,
            location: input.location || null,
            gps_lat: input.gps_lat,
            gps_lng: input.gps_lng,
            gps_accuracy_m: input.gps_accuracy ?? null,
            notes: input.notes || null,
            phase: "with_farmer",
            test_status: "pending",
            current_holder_user_id: user.id,
          },
        });

        // Attach images (1..10, all owned by this farmer).
        for (let i = 0; i < assetIds.length; i++) {
          await tx.entityDocument.create({
            data: {
              asset_id: assetIds[i],
              entity_type: "batch",
              entity_id: batch.id,
              doc_kind: "herb_image",
              is_primary: assetIds[i] === primaryAssetId,
              created_by_user_id: user.id,
            },
          });
        }

        // Immutable origin event: system -> farmer (INITIAL_CREATION).
        const event = await tx.batchEvent.create({
          data: {
            batch_id: batch.id,
            event_type: "CREATED",
            actor_user_id: user.id,
            from_user_id: null,
            to_user_id: user.id,
            phase_after: "with_farmer",
            location: input.location || null,
            gps_lat: input.gps_lat,
            gps_lng: input.gps_lng,
            payload_json: {
              quantity_kg: weightKg,
              cultivation_type: input.cultivation_type,
              images: assetIds.length,
              unit: input.unit || "kg",
              identification_id: identification ? identification.id : null,
              qr_version: 1, // phase 5: v1 ownership QR is born ACTIVE with the batch
            },
          },
        });

        // Link the identification to its batch (training + audit trail).
        if (identification) {
          await tx.aiIdentification.update({
            where: { id: identification.id },
            data: { batch_id: batch.id },
          });
        }

        await tx.auditLog.create({
          data: { actor_user_id: user.id, action: "BATCH_CREATED", target_type: "batch", target_id: batch.id, meta_json: { code, identification_id: identification ? identification.id : null, qr_version: 1 } },
        });

        // Phase 5: mint QR v1 ACTIVE for the farmer in the same transaction.
        await mintInitialQr(tx, batch.id, user);

        // Blockchain-ready anchor: pending — the ledger service picks it up later.
        await tx.blockchainEvent.create({
          data: { anchor_code: "BATCH_CREATED", entity_type: "batch_event", entity_id: event.id, status: "pending" },
        });

        return batch.id;
      });
      break; // success
    } catch (err) {
      if (err.code !== "P2002" || attempt === 2) throw err; // code collision -> retry
    }
  }

  const batch = await getById(batchId);
  return {
    batch,
    duplicate_warning: duplicate,
    images_attached: assetIds.length,
    identification_id: identification ? identification.id : null,
  };
}

/** Duplicate-warning: same farmer+species+harvest date+weight within the window. */
async function looksDuplicate(farmerId, speciesId, harvestDate, weightKg) {
  const since = new Date(Date.now() - DUP_WINDOW_HOURS * 60 * 60 * 1000);
  const startOfDay = new Date(harvestDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const rows = await prisma.batch.findMany({
    where: { farmer_id: farmerId, species_id: speciesId, harvest_date: { gte: startOfDay, lte: endOfDay }, created_at: { gte: since } },
    select: { weight_kg: true },
  });
  return rows.some((r) => Math.abs(r.weight_kg - weightKg) <= DUP_WEIGHT_TOLERANCE_KG);
}

async function listOwn(userId, { offset = 0, limit = 50 } = {}) {
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({ where: { farmer_id: userId }, orderBy: { created_at: "desc" }, skip: offset, take: limit, include: BATCH_INCLUDE }),
    prisma.batch.count({ where: { farmer_id: userId } }),
  ]);
  return { batches, total };
}

async function getById(id) {
  const batch = await prisma.batch.findUnique({ where: { id }, include: { species: BATCH_INCLUDE.species, farmer: BATCH_INCLUDE.farmer } });
  if (!batch) return null;
  const docs = await prisma.entityDocument.findMany({ where: { entity_type: "batch", entity_id: batch.id }, select: DOCS_SELECT, orderBy: { created_at: "asc" } });
  return { ...batch, images: docs };
}

async function getEvents(batchId) {
  return prisma.batchEvent.findMany({
    where: { batch_id: batchId },
    orderBy: { created_at: "asc" },
    include: {
      actor: { select: { id: true, name: true, role: true } },
      from_user: { select: { id: true, name: true, role: true } },
      to_user: { select: { id: true, name: true, role: true } },
    },
  });
}

/** Read-scope guard: only the originating farmer (and admins) see a batch. */
function assertCanView(user, batch) {
  if (user.role === "admin") return;
  if (batch.farmer_id !== user.id) {
    throw new ApiError("forbidden", "You can only view your own batches", 403);
  }
}

/** QR-mint guard: current holder (the farmer at creation) or admin. */
function assertCanMint(user, batch) {
  if (user.role === "admin") return;
  if (batch.current_holder_user_id !== user.id) {
    throw new ApiError("forbidden", "Only the current holder can mint this QR", 403);
  }
}

module.exports = { createBatch, listOwn, getById, getEvents, resolveSpecies, assertCanView, assertCanMint };
