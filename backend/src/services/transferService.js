/**
 * Batch transfer state machine — port of services/transfer_service.py.
 *
 * A "transfer" is the atomic operation that happens when an authenticated
 * user scans the current QR of a batch:
 *   1. Verifies the QR signature (HS256, via qrService).
 *   2. Confirms the scanned token equals BatchState.current_qr_token
 *      (dead/old QRs that leaked are rejected).
 *   3. Looks up the allowed transition for (current_phase, scanner_role).
 *   4. Atomically updates BatchState + appends a TRANSFER BatchEvent.
 *   5. Returns the new QR token to the new holder.
 *
 * The TRANSITIONS table (src/constants/enums.js) is the single source of
 * truth. All state-changing operations run inside a Prisma interactive
 * transaction so state + events stay consistent.
 */
const { prisma } = require("../db/client");
const {
  TRANSITIONS,
  TERMINAL_PHASES,
} = require("../constants/enums");
const {
  newEventId,
  newBatchId,
} = require("../utils/ids");
const qrService = require("./qrService");
const { TransferError } = require("../utils/errors");

// -------------------------------------------------------------- creation

async function createBatch({
  farmer,
  speciesName,
  harvestDate,
  location,
  weightKg,
  imageUrl = null,
  gpsLat = null,
  gpsLng = null,
  notes = null,
}) {
  if (farmer.role !== "farmer") {
    throw new TransferError("forbidden", "Only farmers can create herb batches");
  }
  if (!speciesName || !location) {
    throw new TransferError("bad_request", "species_name and location are required");
  }
  if (weightKg === null || Number(weightKg) <= 0) {
    throw new TransferError("bad_request", "weight_kg must be a positive number");
  }
  if (!harvestDate) {
    throw new TransferError("bad_request", "harvest_date is required");
  }

  const batchId = newBatchId();
  const token = qrService.issueBatchQr(batchId, farmer.user_id, "with_farmer");

  const { herb, state, event } = await prisma.$transaction(async (tx) => {
    const herb = await tx.herb.create({
      data: {
        batch_id: batchId,
        farmer_id: farmer.user_id,
        species_name: speciesName,
        image_url: imageUrl,
        harvest_date: harvestDate,
        location,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        weight_kg: Number(weightKg),
        notes,
      },
    });
    const state = await tx.batchState.create({
      data: {
        batch_id: batchId,
        current_holder_id: farmer.user_id,
        phase: "with_farmer",
        test_result: "pending",
        current_qr_token: token,
      },
    });
    const event = await tx.batchEvent.create({
      data: {
        event_id: newEventId(),
        batch_id: batchId,
        event_type: "CREATED",
        actor_id: farmer.user_id,
        from_party_id: null,
        to_party_id: farmer.user_id,
        phase_before: null,
        phase_after: "with_farmer",
        location,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        payload_json: { species_name: speciesName, weight_kg: Number(weightKg) },
        qr_token: token,
      },
    });
    return { herb, state, event };
  });

  return { herb, state, event, token };
}

// --------------------------------------------------------------- transfers

async function transferByScan({
  batchId,
  scanner,
  scannedQrToken,
  location = null,
  gpsLat = null,
  gpsLng = null,
  notes = null,
}) {
  if (!batchId) throw new TransferError("bad_request", "batch_id is required");
  if (!scanner || !scanner.user_id) {
    throw new TransferError("unauthorized", "Scanner identity is required");
  }
  if (!scannedQrToken) {
    throw new TransferError("bad_request", "scanned_qr_token is required");
  }

  return prisma.$transaction(async (tx) => {
    const state = await tx.batchState.findUnique({ where: { batch_id: batchId } });
    if (!state) throw new TransferError("not_found", `Batch '${batchId}' not found`);

    if (TERMINAL_PHASES.has(state.phase)) {
      throw new TransferError(
        "invalid_state",
        `Batch is in terminal phase '${state.phase}' and cannot be transferred`
      );
    }

    // 1) Cryptographic check
    let claims;
    try {
      claims = qrService.verifyBatchQr(scannedQrToken, batchId);
    } catch (err) {
      throw new TransferError("invalid_qr", err.message);
    }

    // 2) Replay/staleness check: scanned token must equal the active one
    if (!state.current_qr_token || state.current_qr_token !== scannedQrToken) {
      throw new TransferError("stale_qr", "This QR is no longer the active one for this batch");
    }

    if (claims.holderId !== state.current_holder_id) {
      throw new TransferError(
        "qr_state_mismatch",
        "QR holder does not match the current batch holder"
      );
    }

    // 3) Cannot transfer to yourself
    if (scanner.user_id === state.current_holder_id) {
      throw new TransferError("self_transfer", "You already hold this batch");
    }

    // 4) State machine
    const nextPhase = TRANSITIONS[`${state.phase}|${scanner.role}`];
    if (!nextPhase) {
      throw new TransferError(
        "invalid_transition",
        `A '${scanner.role}' cannot receive a batch that is currently '${state.phase}'`
      );
    }

    // 5) Extra guards
    if (state.phase === "at_lab" && state.test_result !== "approved") {
      throw new TransferError(
        "not_approved",
        `Lab has not approved this batch yet (test_result is '${state.test_result}')`
      );
    }

    // 6) Apply the transition
    const fromPartyId = state.current_holder_id;
    const fromPhase = state.phase;

    const newToken = qrService.issueBatchQr(batchId, scanner.user_id, nextPhase);

    const updated = await tx.batchState.update({
      where: { batch_id: batchId },
      data: {
        current_holder_id: scanner.user_id,
        phase: nextPhase,
        current_qr_token: newToken,
        updated_at: new Date(),
      },
    });

    const event = await tx.batchEvent.create({
      data: {
        event_id: newEventId(),
        batch_id: batchId,
        event_type: "TRANSFER",
        actor_id: scanner.user_id,
        from_party_id: fromPartyId,
        to_party_id: scanner.user_id,
        phase_before: fromPhase,
        phase_after: nextPhase,
        location,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        payload_json: notes ? { notes } : null,
        qr_token: scannedQrToken,
      },
    });

    return {
      batchId,
      fromPhase,
      toPhase: nextPhase,
      fromPartyId,
      toPartyId: scanner.user_id,
      newQrToken: newToken,
      eventId: event.event_id,
      occurredAt: event.created_at,
      updatedState: updated,
    };
  });
}

// -------------------------------------------------------------- batch split

async function splitBatch({ parentBatchId, actor, splits }) {
  if (!parentBatchId) throw new TransferError("bad_request", "parent_batch_id is required");
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    throw new TransferError("bad_request", "splits must be a non-empty list");
  }

  return prisma.$transaction(async (tx) => {
    const [parentHerb, parentState] = await Promise.all([
      tx.herb.findUnique({ where: { batch_id: parentBatchId } }),
      tx.batchState.findUnique({ where: { batch_id: parentBatchId } }),
    ]);
    if (!parentHerb || !parentState) {
      throw new TransferError("not_found", `Batch '${parentBatchId}' not found`);
    }

    if (actor.role !== "farmer") throw new TransferError("forbidden", "Only farmers can split batches");
    if (parentHerb.farmer_id !== actor.user_id) {
      throw new TransferError("forbidden", "Only the original farmer can split this batch");
    }
    if (parentState.current_holder_id !== actor.user_id) {
      throw new TransferError("forbidden", "You must currently hold the batch to split it");
    }
    if (!["with_farmer", "with_farmer_after_lab"].includes(parentState.phase)) {
      throw new TransferError(
        "invalid_state",
        `Cannot split a batch in phase '${parentState.phase}'`
      );
    }

    let total = 0;
    const cleaned = [];
    for (let idx = 0; idx < splits.length; idx += 1) {
      const kg = Number(splits[idx].weight_kg);
      if (!Number.isFinite(kg)) {
        throw new TransferError("bad_request", `splits[${idx}].weight_kg invalid`);
      }
      if (kg <= 0) {
        throw new TransferError("bad_request", `splits[${idx}].weight_kg must be > 0`);
      }
      total += kg;
      cleaned.push({ weight_kg: kg, note: splits[idx].note ?? null });
    }

    const parentKg = Number(parentHerb.weight_kg || 0);
    if (total > parentKg) {
      throw new TransferError(
        "bad_request",
        `Sum of split weights (${total}) exceeds parent batch weight (${parentKg})`
      );
    }

    const remaining = Number((parentKg - total).toFixed(2));
    const children = [];
    const childrenPayload = [];

    for (const item of cleaned) {
      const childId = newBatchId();
      const token = qrService.issueBatchQr(childId, actor.user_id, "with_farmer");

      await tx.herb.create({
        data: {
          batch_id: childId,
          farmer_id: actor.user_id,
          species_id: parentHerb.species_id,
          species_name: parentHerb.species_name,
          image_url: parentHerb.image_url,
          harvest_date: parentHerb.harvest_date,
          location: parentHerb.location,
          gps_lat: parentHerb.gps_lat,
          gps_lng: parentHerb.gps_lng,
          weight_kg: item.weight_kg,
          notes: item.note,
          parent_batch_id: parentBatchId,
        },
      });
      await tx.batchState.create({
        data: {
          batch_id: childId,
          current_holder_id: actor.user_id,
          phase: "with_farmer",
          test_result: "pending",
          current_qr_token: token,
        },
      });
      await tx.batchEvent.create({
        data: {
          event_id: newEventId(),
          batch_id: childId,
          event_type: "CREATED",
          actor_id: actor.user_id,
          from_party_id: null,
          to_party_id: actor.user_id,
          phase_before: null,
          phase_after: "with_farmer",
          location: parentHerb.location,
          gps_lat: parentHerb.gps_lat,
          gps_lng: parentHerb.gps_lng,
          payload_json: {
            parent_batch_id: parentBatchId,
            species_name: parentHerb.species_name,
            weight_kg: item.weight_kg,
            note: item.note,
          },
          qr_token: token,
        },
      });

      children.push({ batchId: childId, weightKg: item.weight_kg, qrToken: token, note: item.note });
      childrenPayload.push({
        child_batch_id: childId,
        weight_kg: item.weight_kg,
        note: item.note,
      });
    }

    const parentConsumed = Math.abs(remaining) < 1e-9;
    // Flask records the split event as with_farmer -> consumed when the
    // parent is fully split away.
    const phaseBefore = parentConsumed ? "with_farmer" : parentState.phase;
    await tx.batchState.update({
      where: { batch_id: parentBatchId },
      data: {
        phase: parentConsumed ? "consumed" : parentState.phase,
        current_qr_token: parentConsumed ? "" : parentState.current_qr_token,
        updated_at: new Date(),
      },
    });
    await tx.batchEvent.create({
      data: {
        event_id: newEventId(),
        batch_id: parentBatchId,
        event_type: "BATCH_SPLIT",
        actor_id: actor.user_id,
        from_party_id: actor.user_id,
        to_party_id: actor.user_id,
        phase_before: phaseBefore,
        phase_after: parentConsumed ? "consumed" : phaseBefore,
        location: parentHerb.location,
        gps_lat: parentHerb.gps_lat,
        gps_lng: parentHerb.gps_lng,
        payload_json: {
          children: childrenPayload,
          remaining_kg: remaining,
          consumed: parentConsumed,
        },
      },
    });

    return {
      parentBatchId,
      parentRemainingKg: remaining,
      parentConsumed,
      children,
    };
  });
}

// --------------------------------------------------------- intent records

async function recordLabRequest(lab, batchId) {
  if (lab.role !== "lab") throw new TransferError("forbidden", "Only labs can request testing");
  const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
  if (!state) throw new TransferError("not_found", `Batch '${batchId}' not found`);

  return prisma.batchEvent.create({
    data: {
      event_id: newEventId(),
      batch_id: batchId,
      event_type: "INTENT_LAB_REQUEST",
      actor_id: lab.user_id,
      from_party_id: null,
      to_party_id: lab.user_id,
      phase_before: state.phase,
      phase_after: state.phase,
      payload_json: { requested_at: new Date().toISOString() },
    },
  });
}

async function recordManufacturerOrder(manufacturer, batchId) {
  if (manufacturer.role !== "manufacturer") {
    throw new TransferError("forbidden", "Only manufacturers can place orders");
  }
  const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
  if (!state) throw new TransferError("not_found", `Batch '${batchId}' not found`);
  if (state.test_result !== "approved") {
    throw new TransferError("not_approved", "Cannot order a batch that is not approved by the lab");
  }

  return prisma.batchEvent.create({
    data: {
      event_id: newEventId(),
      batch_id: batchId,
      event_type: "INTENT_MANUFACTURER_ORDER",
      actor_id: manufacturer.user_id,
      from_party_id: null,
      to_party_id: manufacturer.user_id,
      phase_before: state.phase,
      phase_after: state.phase,
      payload_json: { ordered_at: new Date().toISOString() },
    },
  });
}

module.exports = {
  createBatch,
  transferByScan,
  splitBatch,
  recordLabRequest,
  recordManufacturerOrder,
};