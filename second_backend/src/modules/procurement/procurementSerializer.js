/** Wire serializers for the manufacturer procurement module (Phase 9). */
const { inventoryState } = require("../../constants/procurement");

function serializeSpecies(s) {
  return s ? { id: s.id, code: s.code, common_name: s.common_name } : null;
}

function serializeCertificate(c) {
  return c
    ? {
        id: c.id,
        certificate_number: c.certificate_number,
        certificate_hash: c.certificate_hash,
        lab_code: c.lab_code ?? null,
        lab_name: c.lab_name ?? null,
        species: serializeSpecies(c.species || (c.batch?.species ?? null)),
        issued_at: c.issued_at,
        expiry_date: c.expiry_date ?? null,
        status: c.status,
        pass_count: c.pass_count,
        fail_count: c.fail_count,
      }
    : null;
}

/** A certified batch on the procurement marketplace (spec §2 fields). */
function serializeCertifiedBatch({ batch, cert, inventory }) {
  return {
    batch: {
      id: batch.id,
      code: batch.code,
      species: serializeSpecies(batch.species),
      quantity_kg: batch.weight_kg,
      phase: batch.phase,
      test_status: batch.test_status,
      current_holder: batch.current_holder
        ? { id: batch.current_holder.id, name: batch.current_holder.name, role: batch.current_holder.role }
        : null,
      farmer: batch.farmer ? { id: batch.farmer.id, name: batch.farmer.name } : null,
      location: batch.location ?? null,
      gps: { lat: batch.gps_lat ?? null, lng: batch.gps_lng ?? null },
      harvest_date: batch.harvest_date ?? null,
      created_at: batch.created_at,
    },
    certificate: serializeCertificate(cert),
    inventory: inventory
      ? {
          total_quantity_kg: inventory.total_quantity_kg,
          available_quantity_kg: inventory.available_quantity_kg,
          reserved_quantity_kg: inventory.reserved_quantity_kg,
          consumed_quantity_kg: inventory.consumed_quantity_kg,
        }
      : null,
  };
}

/** Traceability dossier for one certified batch (spec §2, before procurement). */
function serializeDossier({ batch, cert, inventory, shipments }) {
  return {
    batch: {
      id: batch.id,
      code: batch.code,
      species: serializeSpecies(batch.species),
      quantity_kg: batch.weight_kg,
      phase: batch.phase,
      test_status: batch.test_status,
      cultivation_type: batch.cultivation_type ?? null,
      current_holder: batch.current_holder
        ? { id: batch.current_holder.id, name: batch.current_holder.name, role: batch.current_holder.role }
        : null,
      farmer: batch.farmer ? { id: batch.farmer.id, name: batch.farmer.name, role: batch.farmer.role } : null,
      location: batch.location ?? null,
      gps: { lat: batch.gps_lat ?? null, lng: batch.gps_lng ?? null },
      harvest_date: batch.harvest_date ?? null,
      lab_receipt: batch.lab_receipts?.[0]
        ? {
            received_quantity_kg: batch.lab_receipts[0].received_quantity_kg ?? null,
            condition_status: batch.lab_receipts[0].condition_status,
            received_at: batch.lab_receipts[0].received_at,
          }
        : null,
      species_verifications: (batch.species_verifications || []).map((v) => ({
        status: v.status,
        farmer_species: v.farmer_species,
        ai_prediction_code: v.ai_prediction_code ?? null,
        lab_species: v.lab_species,
        verified_at: v.verified_at,
      })),
      timeline: (batch.events || []).map((e) => ({
        event_type: e.event_type,
        actor: e.actor ? { id: e.actor.id, name: e.actor.name, role: e.actor.role } : null,
        from: e.from_user ? { id: e.from_user.id, name: e.from_user.name, role: e.from_user.role } : null,
        to: e.to_user ? { id: e.to_user.id, name: e.to_user.name, role: e.to_user.role } : null,
        created_at: e.created_at,
      })),
    },
    certificate: serializeCertificate(cert),
    inventory: inventory
      ? {
          total_quantity_kg: inventory.total_quantity_kg,
          available_quantity_kg: inventory.available_quantity_kg,
          reserved_quantity_kg: inventory.reserved_quantity_kg,
          consumed_quantity_kg: inventory.consumed_quantity_kg,
        }
      : null,
    shipments: (shipments || []).map((s) => ({
      id: s.id,
      shipment_no: s.shipment_no,
      status: s.status,
      transporter: s.transporter ? { id: s.transporter.id, name: s.transporter.name } : null,
      created_at: s.created_at,
    })),
  };
}

function serializeRequest(r) {
  return {
    id: r.id,
    request_no: r.request_no,
    status: r.status,
    requested_quantity_kg: r.requested_quantity_kg,
    approved_quantity_kg: r.approved_quantity_kg ?? null,
    decision_note: r.decision_note ?? null,
    requested_at: r.requested_at,
    decided_at: r.decided_at ?? null,
    manufacturer: r.manufacturer ? { id: r.manufacturer.id, name: r.manufacturer.name, role: r.manufacturer.role } : null,
    batch: r.batch
      ? {
          id: r.batch.id,
          code: r.batch.code,
          species: serializeSpecies(r.batch.species),
          phase: r.batch.phase,
          test_status: r.batch.test_status,
          quantity_kg: r.batch.weight_kg ?? null,
          current_holder_user_id: r.batch.current_holder_user_id,
        }
      : null,
    allocation: r.allocation
      ? {
          id: r.allocation.id,
          allocated_quantity_kg: r.allocation.allocated_quantity_kg,
          status: r.allocation.status,
          allocated_at: r.allocation.allocated_at,
          resolved_at: r.allocation.resolved_at ?? null,
        }
      : null,
    shipment: r.shipment ? { id: r.shipment.id, shipment_no: r.shipment.shipment_no, status: r.shipment.status } : null,
  };
}

function serializeGrn(g) {
  return {
    id: g.id,
    grn_number: g.grn_number,
    received_quantity_kg: g.received_quantity_kg,
    accepted_quantity_kg: g.accepted_quantity_kg,
    rejected_quantity_kg: g.rejected_quantity_kg,
    rejection_reason: g.rejection_reason ?? null,
    received_at: g.received_at,
    manufacturer: g.manufacturer ? { id: g.manufacturer.id, name: g.manufacturer.name, role: g.manufacturer.role } : null,
    batch: g.batch
      ? { id: g.batch.id, code: g.batch.code, species: serializeSpecies(g.batch.species) }
      : null,
    shipment: g.shipment ? { id: g.shipment.id, shipment_no: g.shipment.shipment_no, status: g.shipment.status } : null,
  };
}

function serializeInventoryItem(item) {
  return {
    id: item.id,
    state: item.state || inventoryState(item),
    batch: item.batch
      ? {
          id: item.batch.id,
          code: item.batch.code,
          species: serializeSpecies(item.batch.species),
          certificate: item.batch.certifications?.[0]
            ? {
                certificate_number: item.batch.certifications[0].certificate_number,
                status: item.batch.certifications[0].status,
                expiry_date: item.batch.certifications[0].expiry_date ?? null,
              }
            : null,
        }
      : null,
    quantities: {
      available_kg: item.available_quantity_kg,
      reserved_kg: item.reserved_quantity_kg,
      consumed_kg: item.consumed_quantity_kg,
      discarded_kg: item.discarded_quantity_kg,
    },
    unit: item.unit,
    active_holds: (item.holds || []).map((h) => ({ id: h.id, reason: h.reason, created_at: h.created_at })),
    last_transaction: item.transactions?.[0]
      ? {
          transaction_type: item.transactions[0].transaction_type,
          quantity_kg: item.transactions[0].quantity_kg,
          created_at: item.transactions[0].created_at,
        }
      : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function serializeTransaction(t) {
  return {
    id: t.id,
    inventory_id: t.inventory_id,
    transaction_type: t.transaction_type,
    quantity_kg: t.quantity_kg,
    reference_id: t.reference_id ?? null,
    notes: t.notes ?? null,
    created_by_user_id: t.created_by_user_id ?? null,
    created_at: t.created_at,
  };
}

function serializeHold(h) {
  return {
    id: h.id,
    batch_id: h.batch_id,
    reason: h.reason,
    status: h.status,
    created_by_user_id: h.created_by_user_id ?? null,
    created_at: h.created_at,
    resolved_at: h.resolved_at ?? null,
    resolution_note: h.resolution_note ?? null,
  };
}

module.exports = {
  serializeCertifiedBatch,
  serializeDossier,
  serializeRequest,
  serializeGrn,
  serializeInventoryItem,
  serializeTransaction,
  serializeHold,
};