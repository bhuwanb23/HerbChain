/**
 * Identification service (docs/phase_4.md workflow; mapped in
 * docs/identification/architecture.md).
 *
 * detectForUser: upload asset -> quality gate -> hash cache -> provider ->
 *                species-map -> persist (AiRequest + AiIdentification rows)
 * confirm       : farmer accepts AI top pick / changes species / rejects
 * listMine / adminList / getByIdScoped : history — the training data + model
 *                audit trail (docs/phase_4.md "AI Identification History").
 *
 * Production rules baked in:
 *   - recognition NEVER certifies — the lab does (a later phase writes
 *     AiFeedback rows when the lab report resolves)
 *   - AI is optional, batch registration is mandatory: provider failures and
 *     quality failures always leave the farmer able to continue manually
 *   - provider labels are never trusted: everything maps through the master
 *     catalogue alias web before it is stored
 *   - identical image + provider + model is served from the image-hash cache
 *     (farmers retrying never double-pay or double-wait)
 */
const { env } = require("../../config/env");
const { prisma } = require("../../db/client");
const { ApiError } = require("../../utils/errors");
const { saveImageUpload } = require("../uploads");
const { sha256, inspectImage } = require("./quality");
const { mapPredictions, resolveSpeciesInput } = require("./speciesResolver");
const { resolveProvider } = require("./providers");
const { verdictFor } = require("../../constants/identification");

const SP_SELECT = {
  select: { id: true, code: true, common_name: true, scientific_name: true },
};

/** Daily per-user recognition budget (spec: 50 AI requests/day/user). */
async function assertWithinDailyLimit(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const used = await prisma.aiRequest.count({
    where: { user_id: userId, created_at: { gte: start } },
  });
  if (used >= env.RECOGNITION_DAILY_LIMIT) {
    throw new ApiError("rate_limited", "Daily recognition limit reached — please enter the species manually", 429);
  }
}

/**
 * Detect + persist a recognition attempt for the current farmer.
 * @returns { status: "ok" | "quality_failed" | "no_plant", cached, asset, quality, identification }
 * status quality_failed / no_plant are not errors — the farmer continues manually.
 */
async function detectForUser(user, input) {
  const buffer = input.buffer;
  const imageHash = sha256(buffer);

  // 1) Quality gate (decode + resolution + blur + darkness) BEFORE any call.
  const quality = await inspectImage(buffer);
  if (quality.decode_error) {
    throw new ApiError("invalid_image", "File is not a valid image (jpg/png/webp)", 400, quality);
  }

  // Save the asset regardless — audit trail + later batch attachment.
  const asset = await saveImageUpload({
    ownerUserId: user.id,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    metadataRaw: input.metadataRaw || null,
    buffer,
  });
  const assetView = { id: asset.id, url: asset.url, mime_type: asset.mime_type };

  if (!quality.ok) {
    return { status: "quality_failed", cached: false, asset: assetView, quality, identification: null };
  }

  await assertWithinDailyLimit(user.id);

  // 2) Provider + model (rows are honest about who recognised what).
  const provider = resolveProvider();

  // 3) Cache hit? Same bytes + provider + model -> no second (paid) call.
  const existing = await prisma.imageHashCache.findUnique({
    where: {
      image_hash_provider_model_name_model_version: {
        image_hash: imageHash,
        provider: provider.key,
        model_name: provider.modelName,
        model_version: provider.modelVersion,
      },
    },
  });
  if (existing && existing.expires_at > new Date()) {
    const cachedResult = existing.result_json || { predictions: [] };
    const created = await persistResult({
      user,
      asset,
      imageHash,
      provider: provider.key,
      model: cachedResult.model || { name: existing.model_name, version: existing.model_version },
      predictionsJson: cachedResult.predictions || [],
      quality,
      responseMs: 0,
      cached: true,
    });
    await prisma.imageHashCache.update({
      where: { id: existing.id },
      data: { hits: { increment: 1 }, last_hit_at: new Date() },
    });
    return { status: "ok", cached: true, asset: assetView, quality, identification: await getByIdScoped(user, created.id) };
  }

  // 4) Live provider call.
  const started = Date.now();
  let result;
  try {
    result = await provider.detect(buffer, {
      mimeType: input.mimeType,
      topK: env.RECOGNITION_TOP_K,
      mock: input.mockHint, // honoured only when the active provider is mock (route guards)
    });
  } catch (err) {
    await prisma.aiRequest.create({
      data: {
        user_id: user.id,
        asset_id: asset.id,
        provider: provider.key,
        model_name: provider.modelName || provider.key,
        model_version: "unknown",
        image_hash: imageHash,
        response_time_ms: Date.now() - started,
        success: false,
        error_code: err.code || "provider_error",
      },
    });
    throw new ApiError(
      "ai_unavailable",
      "Recognition service unavailable — please enter the species manually",
      503,
      { provider: provider.key, reason: err.message }
    );
  }
  const responseMs = Date.now() - started;

  // 5) Never trust labels: map through the master catalogue alias web.
  const mapped = await mapPredictions(result.predictions);
  const predictionsJson = mapped.map((m) => ({
    label: m.label,
    confidence: m.confidence,
    species_id: m.species ? m.species.id : null,
    code: m.species ? m.species.code : null,
    common_name: m.species ? m.species.common_name : null,
    scientific_name: m.species ? m.species.scientific_name : null,
    mapped: Boolean(m.species),
  }));

  const created = await persistResult({
    user,
    asset,
    imageHash,
    provider: result.model.provider,
    model: result.model,
    predictionsJson,
    quality,
    responseMs,
    cached: false,
  });

  // Hydrate with relations (top/selected species, asset, request) for the wire.
  const identification = await getByIdScoped(user, created.id);
  return {
    status: predictionsJson.length ? "ok" : "no_plant",
    cached: false,
    asset: assetView,
    quality,
    identification,
  };
}

/**
 * Persist AiRequest + AiIdentification (+ successful-result cache) in one
 * transaction. Shared by the live path and cache hits — a cache hit still
 * creates a fresh pending identification so the farmer confirms this attempt.
 * predictionsJson entries carry species_id/code/common_name (mapped ones).
 */
async function persistResult({ user, asset, imageHash, provider, model, predictionsJson, quality, responseMs = 0, cached }) {
  const top = predictionsJson[0] || null;
  const topMapped = top && top.mapped && top.species_id ? top : null;
  const verdict = topMapped ? verdictFor(top.confidence) : "manual";
  const status = predictionsJson.length ? "pending" : "error";

  return prisma.$transaction(async (tx) => {
    const request = await tx.aiRequest.create({
      data: {
        user_id: user.id,
        asset_id: asset.id,
        provider,
        model_name: model.name,
        model_version: model.version,
        image_hash: imageHash,
        response_time_ms: responseMs,
        success: true,
        is_cached: cached,
      },
    });

    const identification = await tx.aiIdentification.create({
      data: {
        user_id: user.id,
        asset_id: asset.id,
        request_id: request.id,
        image_hash: imageHash,
        quality_json: quality,
        predictions_json: predictionsJson,
        top_species_id: topMapped ? topMapped.species_id : null,
        confidence: top ? top.confidence : null,
        verdict,
        provider,
        model_name: model.name,
        model_version: model.version,
        status,
      },
    });

    // Only successful results are cached (quality/no-plant never pollute it).
    if (predictionsJson.length && !cached) {
      await tx.imageHashCache.upsert({
        where: {
          image_hash_provider_model_name_model_version: {
            image_hash: imageHash,
            provider,
            model_name: model.name,
            model_version: model.version,
          },
        },
        update: {},
        create: {
          image_hash: imageHash,
          provider,
          model_name: model.name,
          model_version: model.version,
          result_json: { quality, predictions: predictionsJson, model },
          expires_at: new Date(Date.now() + env.RECOGNITION_CACHE_TTL_DAYS * 86400000),
        },
      });
    }
    return identification;
  });
}

/**
 * Farmer confirms / changes / rejects an identification (spec confirmation
 * screen). Confirmed rows (with a selected species) are consumed by the batch
 * module via identification_id.
 */
async function confirmIdentification(user, id, input) {
  const row = await prisma.aiIdentification.findFirst({
    where: { id, user_id: user.id },
    include: { top_species: SP_SELECT },
  });
  if (!row) throw new ApiError("not_found", "Identification not found", 404);
  if (row.status === "error") {
    throw new ApiError("bad_request", "This identification has no predictions — retake the photo", 400);
  }
  if (row.status !== "pending") {
    throw new ApiError("invalid_state", `Identification already ${row.status}`, 409);
  }

  const hasRequested = Boolean(input.species_id || input.species_code);
  let requested = null;
  if (hasRequested) {
    requested = await resolveSpeciesInput({ species_id: input.species_id, species_code: input.species_code });
    if (!requested) throw new ApiError("bad_request", "Species not found or inactive", 400);
  }

  const topId = row.top_species_id;
  let selectedId = null;
  let mismatch = null;
  let isAccepted = false;
  let status = "confirmed";
  let rejectedReason = null;

  if (requested) {
    // Farmer picked a species (accept-the-top is expressed by sending the top).
    selectedId = requested.id;
    if (topId) {
      isAccepted = requested.id === topId;
      mismatch = !isAccepted; // farmer changed species -> valuable training data
    }
  } else if (input.accepted === true) {
    if (!topId) {
      throw new ApiError("bad_request", "No mapped prediction to accept — please select a species manually", 400);
    }
    selectedId = topId; // accept the AI top pick as-is
    isAccepted = true;
    mismatch = false;
  } else if (input.rejected_reason) {
    status = "rejected";
    rejectedReason = input.rejected_reason;
  } else {
    throw new ApiError("bad_request", "Send accepted:true, a species selection, or a rejected_reason", 400);
  }

  await prisma.aiIdentification.update({
    where: { id },
    data: {
      status,
      accepted: isAccepted,
      selected_species_id: selectedId,
      mismatch,
      rejected_reason: rejectedReason,
      confirmed_at: new Date(),
    },
  });

  return getByIdScoped(user, id);
}

/** Farmer's own identification history (register flow + retries). */
async function listMine(userId, { offset = 0, limit = 50 } = {}) {
  const [rows, total] = await Promise.all([
    prisma.aiIdentification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      include: { top_species: SP_SELECT, selected_species: SP_SELECT, asset: { select: { id: true, url: true } } },
    }),
    prisma.aiIdentification.count({ where: { user_id: userId } }),
  ]);
  return { rows, total };
}

/** Admin model-audit history — any farmer, filterable by farmer/status. */
async function adminList({ farmerId = null, status = null, offset = 0, limit = 50 } = {}) {
  const where = {};
  if (farmerId) where.user_id = farmerId;
  if (status) where.status = status;
  const [rows, total] = await Promise.all([
    prisma.aiIdentification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        top_species: SP_SELECT,
        selected_species: SP_SELECT,
        asset: { select: { id: true, url: true } },
      },
    }),
    prisma.aiIdentification.count({ where }),
  ]);
  return { rows, total };
}

/** Owner-scoped single read (admin sees any). */
async function getByIdScoped(user, id) {
  return prisma.aiIdentification.findFirst({
    where: { id, ...(user.role === "admin" ? {} : { user_id: user.id }) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      top_species: SP_SELECT,
      selected_species: SP_SELECT,
      asset: { select: { id: true, url: true, metadata_json: true } },
      request: {
        select: { provider: true, model_name: true, model_version: true, is_cached: true, response_time_ms: true, success: true },
      },
      batch: { select: { id: true, code: true } },
    },
  });
}

module.exports = {
  detectForUser,
  confirmIdentification,
  listMine,
  adminList,
  getByIdScoped,
};
