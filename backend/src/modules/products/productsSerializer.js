/** Wire serializers for the products & manufacturing module (Phase 10). */

function serializeUser(u) {
  return u ? { id: u.id, name: u.name, role: u.role } : null;
}

function serializeSpecies(s) {
  return s ? { id: s.id, code: s.code, common_name: s.common_name, scientific_name: s.scientific_name ?? null } : null;
}

function serializeFormula(f) {
  return {
    id: f.id,
    species: serializeSpecies(f.species),
    standard_quantity: f.standard_quantity ?? null,
    unit: f.unit ?? null,
    position: f.position,
  };
}

function serializeProduct(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    sku: p.sku ?? null,
    description: p.description ?? null,
    category: p.category,
    pack_size: p.pack_size ?? null,
    expiry_months: p.expiry_months ?? null,
    status: p.status,
    manufacturer: p.manufacturer ? { id: p.manufacturer.id, name: p.manufacturer.name } : null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    counts: p._count ? { runs: p._count.runs, lots: p._count.lots } : undefined,
  };
}

function serializeProductDetail(p) {
  return {
    ...serializeProduct(p),
    formulas: (p.formulas || []).map(serializeFormula),
    runs: (p.runs || []).map((r) => serializeRun(r, { light: true })),
    lots: (p.lots || []).map(serializeLotLight),
    affected: (p.affected_products || []).map(serializeAffected),
  };
}

function serializeIngredient(ing) {
  const b = ing.batch;
  return {
    id: ing.id,
    quantity_kg: ing.quantity_kg,
    unit: ing.unit,
    position: ing.position,
    state: ing.state,
    consumed_at: ing.consumed_at ?? null,
    batch: b
      ? {
          id: b.id,
          code: b.code,
          phase: b.phase ?? null,
          test_status: b.test_status ?? null,
          location: b.location ?? null,
          farmer: b.farmer ? { id: b.farmer.id, name: b.farmer.name } : null,
          species: serializeSpecies(b.species),
        }
      : null,
  };
}

function serializeRun(r, { light = false } = {}) {
  return {
    id: r.id,
    code: r.code,
    product_id: r.product_id,
    product: r.product ? { id: r.product.id, code: r.product.code, name: r.product.name } : undefined,
    status: r.status,
    planned_units: r.planned_units,
    production_date: r.production_date ?? null,
    completed_at: r.completed_at ?? null,
    notes: r.notes ?? null,
    ingredients: light ? undefined : (r.ingredients || []).map(serializeIngredient),
    lots: r.lots ? r.lots.map((l) => serializeLotLight(l)) : undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function serializeLotLight(l) {
  return {
    id: l.id,
    code: l.code,
    product_id: l.product_id,
    quantity_units: l.quantity_units,
    units_remaining: l.units_remaining,
    phase: l.phase,
    holder: l.holder ? { id: l.holder.id, name: l.holder.name, role: l.holder.role } : l.current_holder_user_id ? { id: l.current_holder_user_id } : null,
    expiry_date: l.expiry_date ?? null,
    qr: l.qr_token
      ? {
          status: l.qr_token.status,
          token_prefix: l.qr_token.token_prefix,
          minted_at: l.qr_token.minted_at,
        }
      : null,
    created_at: l.created_at,
  };
}

function serializeLot(l) {
  return {
    id: l.id,
    code: l.code,
    product: l.product
      ? {
          ...serializeProduct({ ...l.product, manufacturer: l.product.manufacturer, _count: undefined }),
          formulas: (l.product.formulas || []).map(serializeFormula),
        }
      : null,
    run: l.run
      ? {
          id: l.run.id,
          code: l.run.code,
          status: l.run.status,
          ingredients: (l.run.ingredients || []).map((ing) => ({
            quantity_kg: ing.quantity_kg,
            batch: { id: ing.batch?.id, code: ing.batch?.code },
          })),
        }
      : null,
    quantity_units: l.quantity_units,
    units_remaining: l.units_remaining,
    phase: l.phase,
    holder: serializeUser(l.holder),
    expiry_date: l.expiry_date ?? null,
    qr: l.qr_token
      ? {
          status: l.qr_token.status,
          token_prefix: l.qr_token.token_prefix,
          minted_at: l.qr_token.minted_at,
          revoked_at: l.qr_token.revoked_at ?? null,
        }
      : null,
    events: (l.events || []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      actor: serializeUser(e.actor),
      from: serializeUser(e.from_user),
      to: serializeUser(e.to_user),
      phase_before: e.phase_before ?? null,
      phase_after: e.phase_after ?? null,
      payload: e.payload_json ?? null,
      created_at: e.created_at,
    })),
    created_at: l.created_at,
  };
}

function serializeQrCard(card) {
  return {
    product_id: card.product_id,
    product_code: card.product_code,
    lot_id: card.lot_id,
    lot_code: card.lot_code,
    status: card.status,
    token_prefix: card.token_prefix,
    url: card.url,
    png: card.png,
    minted_at: card.minted_at,
  };
}

/** The QR facet returned by a completed run (raw token + prefix + lot). */
function serializeProductQrResult(out) {
  return {
    lot_code: out.qr.lot_code,
    token_prefix: out.qr.token_prefix,
    raw: out.qr.raw,
  };
}

function serializeLineageProduct({ product, snapshots }) {
  return {
    product: product
      ? {
          id: product.id,
          code: product.code,
          name: product.name,
          sku: product.sku ?? null,
          category: product.category,
          manufacturer: product.manufacturer ? { id: product.manufacturer.id, name: product.manufacturer.name } : null,
          formula: (product.formulas || []).map((f) => ({
            species: f.species ? { code: f.species.code, common_name: f.species.common_name } : null,
            standard_quantity: f.standard_quantity,
            unit: f.unit,
          })),
        }
      : null,
    runs: (product?.runs || []).map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      planned_units: r.planned_units,
      production_date: r.production_date ?? null,
      completed_at: r.completed_at ?? null,
      created_at: r.created_at,
      ingredients: (r.ingredients || []).map((ing) => {
        const b = ing.batch;
        const cert = b?.certifications?.[0] || null;
        return {
          quantity_kg: ing.quantity_kg,
          unit: ing.unit,
          batch: b
            ? {
                code: b.code,
                species: serializeSpecies(b.species),
                farmer: b.farmer ? { id: b.farmer.id, name: b.farmer.name } : null,
                origin: b.location ?? null,
                gps: b.gps_lat != null ? { lat: b.gps_lat, lng: b.gps_lng } : null,
                harvest_date: b.harvest_date ?? null,
                cultivation_type: b.cultivation_type ?? null,
              }
            : null,
          certificate: cert
            ? {
                certificate_number: cert.certificate_number,
                certificate_hash: cert.certificate_hash,
                lab: cert.lab_name ? { code: cert.lab_code, name: cert.lab_name } : null,
                species: cert.species ? { code: cert.species.code, common_name: cert.species.common_name } : null,
                issued_at: cert.issued_at,
                expiry_date: cert.expiry_date ?? null,
              }
            : null,
          journey: (b?.events || []).map((e) => ({
            event_type: e.event_type,
            actor: serializeUser(e.actor),
            from: e.from_user ? { id: e.from_user.id, name: e.from_user.name } : null,
            to: e.to_user ? { id: e.to_user.id, name: e.to_user.name } : null,
            phase_before: e.phase_before ?? null,
            phase_after: e.phase_after ?? null,
            created_at: e.created_at,
          })),
        };
      }),
      lots: (r.lots || []).map((l) => ({
        id: l.id,
        code: l.code,
        quantity_units: l.quantity_units,
        units_remaining: l.units_remaining,
        phase: l.phase,
        expiry_date: l.expiry_date ?? null,
        qr: l.qr_token ? { status: l.qr_token.status, token_prefix: l.qr_token.token_prefix } : null,
        created_at: l.created_at,
      })),
    })),
    lots: (product?.lots || []).map(serializeLotLight),
    snapshots: (snapshots || []).map(serializeSnapshot),
  };
}

function serializeSnapshot(s) {
  return {
    id: s.id,
    manufacturing_batch_id: s.manufacturing_batch_id,
    lot_id: s.lot_id ?? null,
    snapshot: s.snapshot_json,
    generated_by_user_id: s.generated_by_user_id ?? null,
    generated_at: s.generated_at,
  };
}

function serializeForwardTrace(t) {
  return {
    batch: t.batch,
    usage: (t.usage || []).map((u) => ({
      id: u.id,
      quantity_kg: u.quantity_kg,
      state: u.state,
      consumed_at: u.consumed_at ?? null,
      run: u.run
        ? {
            id: u.run.id,
            code: u.run.code,
            status: u.run.status,
            product: u.run.product,
            lots: (u.run.lots || []).map((l) => ({
              id: l.id,
              code: l.code,
              phase: l.phase,
              quantity_units: l.quantity_units,
              holder: l.holder ? { id: l.holder.id, name: l.holder.name, role: l.holder.role } : null,
              qr_prefix: l.qr_prefix,
              created_at: l.created_at,
            })),
          }
        : null,
    })),
    affected: t.affected,
  };
}

function serializeAffected(a) {
  return {
    id: a.id,
    batch: a.batch
      ? { id: a.batch.id, code: a.batch.code, species: serializeSpecies(a.batch.species) }
      : a.batch_id
        ? { id: a.batch_id }
        : null,
    product: a.product ? { id: a.product.id, code: a.product.code, name: a.product.name, status: a.product.status } : a.product_id ? { id: a.product_id } : null,
    manufacturing_batch_id: a.manufacturing_batch_id,
    lot_id: a.lot_id ?? null,
    impact_type: a.impact_type,
    status: a.status,
    notes: a.notes ?? null,
    detected_by_user_id: a.detected_by_user_id ?? null,
    detected_at: a.detected_at,
    resolved_at: a.resolved_at ?? null,
    created_at: a.created_at,
  };
}

module.exports = {
  serializeProduct,
  serializeProductDetail,
  serializeFormula,
  serializeRun,
  serializeLot,
  serializeLotLight,
  serializeQrCard,
  serializeProductQrResult,
  serializeLineageProduct,
  serializeForwardTrace,
  serializeAffected,
};
