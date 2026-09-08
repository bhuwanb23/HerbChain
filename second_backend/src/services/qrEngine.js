/**
 * Dynamic QR engine (docs/phase_5.md + docs/qr/architecture.md).
 *
 * A QR token represents CURRENT OWNERSHIP STATE. v1 is minted ACTIVE inside
 * the batch-creation transaction; every custody transfer rotates it inside
 * the SAME transaction (old -> transferred, next version -> active for the
 * new holder). Replacements (lost/damaged/expired/admin) rotate without an
 * ownership change and are recorded in qr_replacement_logs.
 *
 * Security:
 *  - tokens are cryptographically random (hbc_<192-bit base64url>)
 *  - only SHA-256 hashes are stored (raw token never touches the DB)
 *  - every scan/attempt is logged to qr_scan_logs (replay/expired/unauthorized
 *    attempts are the anti-diversion signal stream)
 *  - "one ACTIVE QR per batch" is enforced in the transaction AND by a
 *    partial unique index in the DB.
 */
const crypto = require("crypto");
const qrcode = require("qrcode");
const sharp = require("sharp");
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { VERIFY_GATED_ROLES } = require("../constants/roles");
const { nextPhaseFor, TERMINAL_PHASES, REPLACEMENT_REASONS } = require("../constants/qr");
const { publish } = require("./notifications"); // phase 14: publish, never send

// ------------------------------------------------------------- token core

function mintRawToken() {
  const bytes = crypto.randomBytes(env.QR_TOKEN_BYTES);
  return `${env.QR_TOKEN_PREFIX}${bytes.toString("base64url")}`;
}

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

function prefixOf(token) {
  return token.length > 14 ? `${token.slice(0, 14)}…` : token;
}

// ---- at-rest token encryption (AES-256-GCM; key derived from the server
// ---- secret). Lookups stay hash-based; the ciphertext only allows the
// ---- current holder to re-print the SAME active QR.
function qrEncryptionKey() {
  return crypto.createHash("sha256").update(`${env.QR_SIGNING_KEY}:qr-at-rest:v1`).digest();
}

function encryptToken(raw) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", qrEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

function decryptToken(ciphertext) {
  const [ivS, tagS, dataS] = ciphertext.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", qrEncryptionKey(), Buffer.from(ivS, "base64url"));
  decipher.setAuthTag(Buffer.from(tagS, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataS, "base64url")), decipher.final()]).toString("utf8");
}

function tokenTtlMs() {
  return env.QR_TOKEN_TTL_DAYS * 86400000;
}

/** Version = max existing + 1 (first call inside the create tx passes 1). */
async function nextVersion(tx, batchId) {
  const last = await tx.qrToken.findFirst({ where: { batch_id: batchId }, orderBy: { version: "desc" }, select: { version: true } });
  return (last ? last.version : 0) + 1;
}

/** Create a new ACTIVE token row (raw token returned to the caller only). */
async function createToken(tx, { batchId, ownerUserId, ownerRole, generatedByUserId, version }) {
  const raw = mintRawToken();
  const token = await tx.qrToken.create({
    data: {
      batch_id: batchId,
      version,
      token_hash: hashToken(raw),
      token_cipher: encryptToken(raw),
      token_prefix: prefixOf(raw),
      status: "active",
      owner_user_id: ownerUserId,
      owner_role: ownerRole,
      generated_by_user_id: generatedByUserId,
      generated_at: new Date(),
      activated_at: new Date(),
      expiry_at: new Date(Date.now() + tokenTtlMs()),
    },
  });
  return { raw, token };
}

/** Mint v1 ACTIVE for a brand-new batch (called inside the create tx). */
async function mintInitialQr(tx, batchId, holder) {
  return createToken(tx, {
    batchId,
    ownerUserId: holder.id,
    ownerRole: holder.role,
    generatedByUserId: holder.id,
    version: 1,
  });
}

// ------------------------------------------------------------ lazy expiry

/**
 * Fetch the batch's ACTIVE token, lazily flipping any expired one to EXPIRED
 * (tokens expire; ownership does not). Returns null when none is active.
 */
async function resolveActive(batchId) {
  const token = await prisma.qrToken.findFirst({
    where: { batch_id: batchId, status: "active" },
    include: { owner: { select: { id: true, name: true, role: true } } },
  });
  if (!token) return null;
  if (token.expiry_at <= new Date()) {
    await prisma.qrToken.update({
      where: { id: token.id },
      data: { status: "expired", deactivated_at: new Date(), deactivation_reason: "expired" },
    });
    return null;
  }
  return token;
}

// ----------------------------------------------------------------- render

/** Captioned QR image: token encoded (url), labels show batch + version. */
async function renderQr(rawToken, batch, version) {
  const url = `${(env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/qr/${rawToken}`;
  const qrBuf = await qrcode.toBuffer(url, { width: 460, margin: 1, errorCorrectionLevel: "M" });

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="760" viewBox="0 0 640 760">
       <rect width="640" height="760" rx="28" fill="#ffffff"/>
       <rect x="24" y="24" width="592" height="120" rx="18" fill="#0d3b2e"/>
       <text x="320" y="76" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle">HerbChain</text>
       <text x="320" y="118" font-family="Arial, sans-serif" font-size="26" fill="#cfe8de" text-anchor="middle">BATCH ${escapeXml(batch.code)} · V${version}</text>
       <rect x="80" y="170" width="480" height="480" rx="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
       <rect x="24" y="686" width="592" height="50" rx="14" fill="#eef6f2"/>
       <text x="320" y="718" font-family="Arial, sans-serif" font-size="20" fill="#0d3b2e" text-anchor="middle">Scan to verify current custody</text>
     </svg>`
  );
  const image = await sharp(svg).composite([{ input: qrBuf, left: 90, top: 180 }]).png().toBuffer();
  return `data:image/png;base64,${image.toString("base64")}`;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

// Memoized card images — one (batch, version) renders once; re-prints and
// history views never re-composite (and never re-mint).
const pngCache = new Map();
async function renderCard(batch, version, rawToken) {
  const key = `${batch.id}:${version}`;
  if (pngCache.has(key)) return pngCache.get(key);
  const png = await renderQr(rawToken, batch, version);
  pngCache.set(key, png);
  return png;
}

// --------------------------------------------------------------- validate

const SCAN = {
  success: "success",
  expired: "expired",
  replay: "replay",
  invalid: "invalid",
  not_found: "not_found",
  unauthorized: "unauthorized",
};

async function logScan({ batchId, actorUserId, outcome, failureReason = null, meta = {} }) {
  return prisma.qrScanLog.create({
    data: {
      target_type: "batch",
      target_id: batchId,
      purpose: "custody_transfer",
      actor_user_id: actorUserId || null,
      device_id: meta.deviceId || null,
      ip_address: meta.ip || null,
      location: meta.location || null,
      gps_lat: meta.gpsLat ?? null,
      gps_lng: meta.gpsLng ?? null,
      outcome,
      failure_reason: failureReason,
    },
  });
}

/**
 * Validate a presented token (spec QR Validation Engine). Every call —
 * success or not — is logged. Returns the wire payload for /qr/validate.
 */
async function validateToken({ token, actor = null, meta = {} }) {
  const record = await prisma.qrToken.findUnique({
    where: { token_hash: hashToken(token) },
    include: {
      batch: { include: { species: { select: { code: true, common_name: true } } } },
      owner: { select: { id: true, name: true, role: true } },
    },
  });
  if (!record) {
    await logScan({ batchId: null, actorUserId: actor?.id, outcome: SCAN.not_found, failureReason: "unknown_token", meta });
    return { valid: false, reason: "not_found", message: "QR token not recognised" };
  }

  // Lazy expiry: an ACTIVE token past its TTL is dead on first touch.
  if (record.status === "active" && record.expiry_at <= new Date()) {
    await prisma.qrToken.update({
      where: { id: record.id },
      data: { status: "expired", deactivated_at: new Date(), deactivation_reason: "expired" },
    });
    await logScan({ batchId: record.batch_id, actorUserId: actor?.id, outcome: SCAN.expired, failureReason: "token_expired", meta });
    return { valid: false, reason: "expired", message: "This QR has expired — ask the holder to regenerate it", version: record.version, batch_id: record.batch_id, code: record.batch.code };
  }

  if (record.status !== "active") {
    // Replay protection: a transferred/revoked/invalidated token is dead.
    // (Expired tokens keep the expired outcome rather than being reported as
    // a replay — both are anomalies, but the reason must be honest.)
    const expired = record.status === "expired";
    await logScan({
      batchId: record.batch_id,
      actorUserId: actor?.id,
      outcome: expired ? SCAN.expired : SCAN.replay,
      failureReason: `token_${record.status}`,
      meta,
    });
    return {
      valid: false,
      reason: expired ? "expired" : "replay",
      message: expired ? "This QR expired — the holder can regenerate it" : `This QR is no longer active (${record.status})`,
      version: record.version,
      batch_id: record.batch_id,
      code: record.batch.code,
      owner: { id: record.owner.id, name: record.owner.name, role: record.owner.role },
      status: record.status,
    };
  }

  await logScan({ batchId: record.batch_id, actorUserId: actor?.id, outcome: SCAN.success, meta });
  return {
    valid: true,
    batch: { id: record.batch.id, code: record.batch.code, species: record.batch.species, phase: record.batch.phase },
    owner: { id: record.owner.id, name: record.owner.name, role: record.owner.role },
    status: record.status,
    version: record.version,
    expires_at: record.expiry_at,
  };
}

// ---------------------------------------------------------- custody transfer

/** Guard shared by transfer: the receiving account must be a legal custodian. */
async function assertReceiverEligible(receiver) {
  if (!receiver.is_active) throw new ApiError("forbidden", "Account is disabled", 403);
  if (VERIFY_GATED_ROLES.includes(receiver.role) && receiver.kyc_status !== "verified") {
    throw new ApiError("account_not_verified", "Account is pending AYUSH verification — cannot receive custody", 403);
  }
}

/**
 * Custody transfer + QR rotation in ONE transaction (spec atomic rule).
 *
 * Phase 6 hardens the handover: ownership may only move (a) through an
 * APPROVED two-party TransferRequest — request row is marked COMPLETED inside
 * this same transaction — or (b) by an admin ADMIN_RECOVERY, where the batch's
 * ACTIVE token record is supplied directly (`record`) because the raw token
 * may be lost. In all cases: deactivate old token -> create next version for
 * the receiver -> move the batch -> append TRANSFER event (with GPS) + scan
 * log + audit + blockchain anchor.
 */
async function transferByToken({ token = null, receiver, meta = {}, request = null, record = null }) {
  const isRecovery = Boolean(request && request.type === "ADMIN_RECOVERY");

  if (record) {
    // Admin recovery path: token may be lost — the engine is handed the
    // batch's ACTIVE token row directly and the guard is admin-only.
    if (!isRecovery || receiver.role !== "admin") {
      throw new ApiError("forbidden", "Direct record transfers require an admin ADMIN_RECOVERY request", 403);
    }
  } else {
    if (!token) throw new ApiError("bad_request", "token is required", 400);
    const found = await prisma.qrToken.findUnique({
      where: { token_hash: hashToken(token) },
      include: {
        batch: { select: { id: true, code: true, phase: true, current_holder_user_id: true } },
      },
    });
    if (!found) {
      await logScan({ batchId: null, actorUserId: receiver.id, outcome: SCAN.not_found, failureReason: "unknown_token", meta });
      throw new ApiError("not_found", "QR token not recognised", 404);
    }
    record = found;
  }

  const { batch } = record;
  await assertReceiverEligible(receiver);

  if (record.status !== "active") {
    const expired = record.status === "expired";
    await logScan({
      batchId: batch.id,
      actorUserId: receiver.id,
      outcome: expired ? SCAN.expired : SCAN.replay,
      failureReason: `token_${record.status}`,
      meta,
    });
    throw new ApiError(
      expired ? "qr_expired" : "qr_inactive",
      expired ? "This QR expired — the holder can regenerate it" : `This QR is no longer active (${record.status})`,
      409
    );
  }
  if (record.expiry_at <= new Date()) {
    // ACTIVE but past TTL: flip + reject (recovery must regenerate first).
    await prisma.qrToken.update({
      where: { id: record.id },
      data: { status: "expired", deactivated_at: new Date(), deactivation_reason: "expired" },
    });
    await logScan({ batchId: batch.id, actorUserId: receiver.id, outcome: SCAN.expired, failureReason: "token_expired", meta });
    throw new ApiError("qr_expired", "This QR has expired — regenerate before transferring", 409);
  }
  if (record.owner_user_id !== batch.current_holder_user_id) {
    throw new ApiError("qr_state_mismatch", "QR owner and batch holder are out of sync — admin review required", 409);
  }
  if (receiver.id === batch.current_holder_user_id) {
    throw new ApiError("self_transfer", "You already hold custody of this batch", 409);
  }
  if (TERMINAL_PHASES.includes(batch.phase)) {
    throw new ApiError("invalid_transition", `Batches in phase '${batch.phase}' cannot be transferred`, 409);
  }

  // Phase 6: every governed move carries an APPROVED request for THIS move.
  if (!isRecovery) {
    if (!request) {
      throw new ApiError(
        "transfer_not_requested",
        "No approved transfer request for this move — request from the receiving party and get the holder's approval first",
        409
      );
    }
    if (request.batch_id !== batch.id || request.to_user_id !== receiver.id || request.status !== "approved") {
      throw new ApiError("invalid_state", "The approved transfer request does not match this batch and receiver", 409);
    }
    if (request.from_user_id !== batch.current_holder_user_id) {
      throw new ApiError("stale_holder", "The batch holder changed since this request was approved — re-request", 409);
    }
  }

  const fromUserId = batch.current_holder_user_id;
  const oldVersion = record.version;
  const isRecoveryPhase = isRecovery ? batch.phase : null;
  const nextPhase = isRecovery ? batch.phase : nextPhaseFor(batch.phase, receiver.role);
  if (!isRecovery && !nextPhase) {
    await logScan({ batchId: batch.id, actorUserId: receiver.id, outcome: SCAN.unauthorized, failureReason: `role_not_allowed:${receiver.role}@${batch.phase}`, meta });
    throw new ApiError(
      "invalid_transition",
      `A ${receiver.role} cannot receive custody while the batch is '${batch.phase}'`,
      409
    );
  }

  const out = await prisma.$transaction(async (tx) => {
    // 1) Kill the presented token.
    await tx.qrToken.update({
      where: { id: record.id },
      data: { status: "transferred", deactivated_at: new Date(), deactivation_reason: "transfer" },
    });

    // 2) Birth the next version for the new holder.
    const { token: next, raw } = await createToken(tx, {
      batchId: batch.id,
      ownerUserId: receiver.id,
      ownerRole: receiver.role,
      generatedByUserId: receiver.id,
      version: oldVersion + 1,
    });

    // 3) Move the batch (single source of truth).
    await tx.batch.update({
      where: { id: batch.id },
      data: { phase: nextPhase, current_holder_user_id: receiver.id },
    });

    // 4) Immutable TRANSFER event (GPS + request metadata) + scan + audit +
    //    ledger anchor — all in this transaction.
    const event = await tx.batchEvent.create({
      data: {
        batch_id: batch.id,
        event_type: "TRANSFER",
        actor_user_id: receiver.id,
        from_user_id: fromUserId,
        to_user_id: receiver.id,
        phase_before: batch.phase,
        phase_after: nextPhase,
        location: meta.location || null,
        gps_lat: meta.gpsLat ?? null,
        gps_lng: meta.gpsLng ?? null,
        payload_json: {
          method: isRecovery ? "admin_recovery" : "qr_transfer",
          token_version: oldVersion,
          new_token_version: next.version,
          request_id: request ? request.id : null,
          transfer_type: request ? request.type : null,
        },
        created_at: new Date(),
      },
    });
    await tx.qrScanLog.create({
      data: {
        target_type: "batch",
        target_id: batch.id,
        purpose: "custody_transfer",
        actor_user_id: receiver.id,
        device_id: meta.deviceId || null,
        ip_address: meta.ip || null,
        gps_lat: meta.gpsLat ?? null,
        gps_lng: meta.gpsLng ?? null,
        outcome: "success",
      },
    });
    await tx.auditLog.create({
      data: {
        actor_user_id: receiver.id,
        action: "BATCH_TRANSFERRED",
        target_type: "batch",
        target_id: batch.id,
        meta_json: {
          code: batch.code,
          from_user_id: fromUserId,
          to_user_id: receiver.id,
          phase_before: batch.phase,
          phase_after: nextPhase,
          token_version: oldVersion,
          new_token_version: next.version,
          request_id: request ? request.id : null,
          transfer_type: request ? request.type : null,
        },
      },
    });
    await tx.blockchainEvent.create({
      data: { anchor_code: "TRANSFERRED", entity_type: "batch_event", entity_id: event.id, status: "pending" },
    });

    // 5) Close the governed request in the same transaction.
    if (request) {
      await tx.transferRequest.update({
        where: { id: request.id },
        data: { status: "completed", completed_at: new Date(), batch_event_id: event.id },
      });
    }

    // Phase 14: ownership moved — publish to the previous holder AND the new
    // holder (queue-only; the notification worker delivers).
    if (!isRecovery && fromUserId !== receiver.id) {
      for (const uid of [fromUserId, receiver.id]) {
        await publish(tx, {
          code: "ownership_transferred",
          recipientUserId: uid,
          data: {
            code: batch.code,
            from: fromUserId,
            to: receiver.id,
            entity: { type: "batch", id: batch.id },
          },
        });
      }
    }

    return { next, raw };
  });

  return {
    batch_id: batch.id,
    code: batch.code,
    from_user_id: fromUserId,
    to_user_id: receiver.id,
    phase_before: batch.phase,
    phase_after: nextPhase,
    old_version: oldVersion,
    new_version: out.next.version,
    token_prefix: out.next.token_prefix,
    url: `${(env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/qr/${out.raw}`,
    png: await renderCard(batch, out.next.version, out.raw),
  };
}

// ------------------------------------------------------------- regenerate

/**
 * Rotate WITHOUT an ownership change (lost / damaged / expired / admin).
 * Old ACTIVE token -> REVOKED; replacement logged; next version -> ACTIVE.
 */
async function regenerateQr({ batchId, actor, reason, isAdmin = false }) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);

  const holderOk = batch.current_holder_user_id === actor.id;
  if (!holderOk && !isAdmin) {
    throw new ApiError("forbidden", "Only the current holder (or an admin) can request a replacement QR", 403);
  }

  const normalized = String(reason || "").toUpperCase();
  if (!REPLACEMENT_REASONS.includes(normalized)) {
    throw new ApiError("bad_request", `reason must be one of: ${REPLACEMENT_REASONS.join(", ")}`, 400);
  }
  const deactivationReason = normalized === "ADMIN_REPLACEMENT" ? "admin_replacement" : `replaced_${normalized.toLowerCase()}`;

  // Resolve the current active token (expired ones flip naturally).
  const active = await prisma.qrToken.findFirst({ where: { batch_id: batchId, status: "active" } });
  let latest = active;
  if (latest && latest.expiry_at <= new Date()) {
    await prisma.qrToken.update({
      where: { id: latest.id },
      data: { status: "expired", deactivated_at: new Date(), deactivation_reason: "expired" },
    });
    latest = null;
  }
  if (latest && !holderOk && !isAdmin) {
    throw new ApiError("forbidden", "Only the current holder (or an admin) can request a replacement QR", 403);
  }
  // Even without an active token, the latest owned token lets the holder renew.
  const ownerToken = await prisma.qrToken.findFirst({
    where: { batch_id: batchId, owner_user_id: batch.current_holder_user_id },
    orderBy: { version: "desc" },
  });
  if (!latest && !ownerToken) {
    throw new ApiError("invalid_state", "No QR exists for this batch yet", 409);
  }
  if (!latest && !holderOk && !isAdmin) {
    throw new ApiError("forbidden", "Only the current holder (or an admin) can request a replacement QR", 403);
  }
  const oldVersion = (latest || ownerToken).version;

  const out = await prisma.$transaction(async (tx) => {
    const oldToken = latest || ownerToken;
    if (latest) {
      await tx.qrToken.update({
        where: { id: latest.id },
        data: { status: "revoked", deactivated_at: new Date(), deactivation_reason: deactivationReason },
      });
    }
    const { token: next, raw } = await createToken(tx, {
      batchId,
      ownerUserId: batch.current_holder_user_id,
      ownerRole: (await tx.user.findUnique({ where: { id: batch.current_holder_user_id }, select: { role: true } })).role,
      generatedByUserId: actor.id,
      version: oldVersion + 1,
    });
    await tx.qrReplacementLog.create({
      data: {
        batch_id: batchId,
        old_token_id: oldToken ? oldToken.id : null,
        new_token_id: next.id,
        old_version: oldToken ? oldToken.version : null,
        new_version: next.version,
        reason: normalized,
        created_by_user_id: actor.id,
      },
    });
    await tx.batchEvent.create({
      data: {
        batch_id: batchId,
        event_type: "QR_REPLACED",
        actor_user_id: actor.id,
        payload_json: { reason: normalized, old_version: oldToken ? oldToken.version : null, new_version: next.version },
      },
    });
    await tx.auditLog.create({
      data: {
        actor_user_id: actor.id,
        action: "QR_REPLACED",
        target_type: "batch",
        target_id: batchId,
        meta_json: { code: batch.code, reason: normalized, old_version: oldToken ? oldToken.version : null, new_version: next.version },
      },
    });
    return { next, raw };
  });

  return {
    batch_id: batchId,
    code: batch.code,
    old_version: oldVersion,
    new_version: out.next.version,
    reason: normalized,
    token_prefix: out.next.token_prefix,
    url: `${(env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/qr/${out.raw}`,
    png: await renderCard(batch, out.next.version, out.raw),
  };
}

// --------------------------------------------------------------- queries

/** Active QR card (token + captioned PNG) for the current holder / admin. */
async function qrCard(batch, actor) {
  const isPrivileged = actor.role === "admin" || batch.current_holder_user_id === actor.id;
  if (!isPrivileged) throw new ApiError("forbidden", "Only the current holder (or an admin) can view this QR", 403);

  const token = await resolveActive(batch.id);
  if (!token) {
    const latest = await prisma.qrToken.findFirst({
      where: { batch_id: batch.id },
      orderBy: { version: "desc" },
      include: { owner: { select: { id: true, name: true, role: true } } },
    });
    return {
      batch_id: batch.id,
      code: batch.code,
      qr: null,
      message: "No active QR — the holder can request a replacement",
      latest: latest ? serializeToken(latest) : null,
    };
  }

  // Decrypt the stored token so the SAME QR can be printed again (stable
  // until rotation — a printed copy never silently dies on re-fetch).
  const raw = decryptToken(token.token_cipher);
  const url = `${(env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/qr/${raw}`;
  const png = await renderCard(batch, token.version, raw);
  return { batch_id: batch.id, code: batch.code, qr: { ...serializeToken(token), url, png } };
}

function serializeToken(t) {
  return {
    version: t.version,
    status: t.status,
    token_prefix: t.token_prefix,
    owner: t.owner ? { id: t.owner.id, name: t.owner.name, role: t.owner.role } : null,
    generated_at: t.generated_at,
    activated_at: t.activated_at,
    expiry_at: t.expiry_at,
  };
}

/** Full version history for a batch (spec QR History). */
async function qrHistory(batchId) {
  const [tokens, replacements] = await Promise.all([
    prisma.qrToken.findMany({
      where: { batch_id: batchId },
      orderBy: { version: "asc" },
      include: { owner: { select: { id: true, name: true, role: true } } },
    }),
    prisma.qrReplacementLog.findMany({
      where: { batch_id: batchId },
      orderBy: { created_at: "asc" },
      include: { created_by: { select: { id: true, name: true } } },
    }),
  ]);
  return {
    tokens: tokens.map((t) => serializeToken(t)),
    replacements: replacements.map((r) => ({
      reason: r.reason,
      old_version: r.old_version,
      new_version: r.new_version,
      created_by: r.created_by ? { id: r.created_by.id, name: r.created_by.name } : null,
      created_at: r.created_at,
    })),
  };
}

module.exports = {
  mintRawToken,
  hashToken,
  encryptToken,
  decryptToken,
  mintInitialQr,
  createToken,
  resolveActive,
  renderQr,
  renderCard,
  validateToken,
  transferByToken,
  regenerateQr,
  qrCard,
  qrHistory,
  assertReceiverEligible,
};
