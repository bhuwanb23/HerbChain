/**
 * Product routes — port of routes/products.py.
 *
 * Creating a product:
 *   - The manufacturer must currently hold each source batch.
 *   - Each source batch becomes phase=consumed (terminal).
 *   - A product QR token is minted (consumer-readable forever).
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { createProductSchema, zodDetails } = require("../validation/schemas");
const { serializeProduct } = require("../serializers");
const qrService = require("../services/qrService");
const { newEventId, newProductId } = require("../utils/ids");

async function productWithLinks(product) {
  const links = await prisma.productBatchLink.findMany({
    where: { product_id: product.product_id },
  });
  return serializeProduct(product, { includeLinks: true, links });
}

function mountProducts(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        create: "POST /api/v1/products",
        list_mine: "GET /api/v1/products/mine",
        get: "GET /api/v1/products/<product_id>",
        qr: "GET /api/v1/products/<product_id>/qr",
      },
    });
  });

  router.post("/", requireRole("manufacturer"), asyncHandler(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid product data", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;
    const manufacturer = req.user;
    const batches = d.source_batches;

    // Pre-validate every source batch upfront so we don't half-commit.
    const statesToConsume = [];
    const seenIds = new Set();
    for (const link of batches) {
      const batchId = link.batch_id;
      if (seenIds.has(batchId)) {
        return error(res, "bad_request", `Duplicate batch '${batchId}' in source list`, 400);
      }
      seenIds.add(batchId);

      const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
      if (!state) return error(res, "not_found", `Batch '${batchId}' not found`, 404);
      if (state.current_holder_id !== manufacturer.user_id) {
        return error(res, "forbidden", `You don't currently hold batch '${batchId}'`, 403);
      }
      if (state.phase !== "with_manufacturer") {
        return error(
          res,
          "invalid_state",
          `Batch '${batchId}' must be in phase 'with_manufacturer' (got '${state.phase}')`,
          409
        );
      }
      statesToConsume.push({ batchId, quantityKg: Number(link.quantity_kg) });
    }

    const productId = newProductId();
    const qrToken = qrService.issueProductQr(productId);

    const { product, links } = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          product_id: productId,
          manufacturer_id: manufacturer.user_id,
          name: d.name,
          sku: d.sku ?? null,
          description: d.description ?? null,
          image_url: d.image_url ?? null,
          qr_token: qrToken,
        },
      });

      const links = [];
      for (const { batchId, quantityKg } of statesToConsume) {
        const link = await tx.productBatchLink.create({
          data: { product_id: productId, batch_id: batchId, quantity_kg: quantityKg },
        });
        links.push(link);

        await tx.batchState.update({
          where: { batch_id: batchId },
          data: { phase: "consumed", current_qr_token: "", updated_at: new Date() },
        });

        await tx.batchEvent.create({
          data: {
            event_id: newEventId(),
            batch_id: batchId,
            event_type: "PRODUCT_LINK",
            actor_id: manufacturer.user_id,
            from_party_id: manufacturer.user_id,
            to_party_id: manufacturer.user_id,
            phase_before: "with_manufacturer",
            phase_after: "consumed",
            payload_json: { product_id: productId, quantity_kg: quantityKg },
          },
        });
      }
      return { product, links };
    });

    return ok(
      res,
      {
        product: serializeProduct(product, { includeLinks: true, links }),
        qr_token: qrToken,
        qr_png: await qrService.renderPngDataUrl(qrToken),
      },
      201
    );
  }));

  router.get("/mine", requireRole("manufacturer"), asyncHandler(async (req, res) => {
    const rows = await prisma.product.findMany({
      where: { manufacturer_id: req.user.user_id },
      orderBy: { created_at: "desc" },
    });
    const products = [];
    for (const p of rows) products.push(await productWithLinks(p));
    return ok(res, { products, total: products.length });
  }));

  router.get("/:product_id", requireAuth, asyncHandler(async (req, res) => {
    const p = await prisma.product.findUnique({ where: { product_id: req.params.product_id } });
    if (!p) return error(res, "not_found", `Product '${req.params.product_id}' not found`, 404);
    return ok(res, { product: await productWithLinks(p) });
  }));

  router.get("/:product_id/qr", requireRole("manufacturer", "admin"), asyncHandler(async (req, res) => {
    const p = await prisma.product.findUnique({ where: { product_id: req.params.product_id } });
    if (!p) return error(res, "not_found", `Product '${req.params.product_id}' not found`, 404);
    if (p.manufacturer_id !== req.user.user_id && req.user.role !== "admin") {
      return error(res, "forbidden", "Only the product's manufacturer can fetch this QR", 403);
    }
    return ok(res, {
      product_id: req.params.product_id,
      qr_token: p.qr_token,
      qr_png: await qrService.renderPngDataUrl(p.qr_token),
    });
  }));

  app.use("/api/v1/products", router);
}

module.exports = { mountProducts };