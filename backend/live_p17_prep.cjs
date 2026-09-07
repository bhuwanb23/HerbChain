/**
 * Phase 17 live smoke prep — seeds the minimum for the HTTP smoke:
 * users (farmer/transporter/admin), a species, a farmer-owned asset,
 * and an existing batch + active QR token for conflict scenarios.
 *
 *   node live_p17_prep.cjs
 */
const path = require("path");
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:" + path.resolve(__dirname, "prisma/schema/p17_smoke.db");
require("dotenv").config({ path: path.join(__dirname, ".env") }); // same keys as the server

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { hashPassword } = require("./src/services/passwords");
const rbac = require("./src/db/rbac");
const notif = require("./src/services/notifications");
const { mintRawToken, hashToken, encryptToken } = require("./src/services/qrEngine");

(async () => {
  await rbac.seedRbac();
  await notif.seedTemplates();

  const mk = (email, role) =>
    prisma.user.create({ data: { name: role, email, password_hash: hashPassword("Admin@123456"), role, is_active: true, kyc_status: "verified" } });
  const farmer = await mk("p17.farmer@herbchain.in", "farmer");
  const tpt = await mk("p17.tpt@herbchain.in", "transporter");
  const admin = await mk("p17.admin@herbchain.in", "admin");

  const tulsi = await prisma.species.create({ data: { code: "p17-tulsi", common_name: "Holy Basil", scientific_name: "Ocimum tenuiflorum", ayush_category: "ayurveda" } });
  const asset = await prisma.asset.create({ data: { owner_user_id: farmer.id, kind: "image", mime_type: "image/jpeg", storage_key: "p17-seed.jpg" } });

  // A batch the farmer already holds (target for the offline transfer request).
  const batch = await prisma.batch.create({
    data: { code: "HERB-P17-000001", farmer_id: farmer.id, species_id: tulsi.id, harvest_date: new Date("2026-08-20"), weight_kg: 30, cultivation_type: "organic", phase: "with_farmer", test_status: "pending", current_holder_user_id: farmer.id },
  });
  const raw = mintRawToken();
  await prisma.qrToken.create({
    data: { batch_id: batch.id, version: 1, token_hash: hashToken(raw), token_cipher: encryptToken(raw), token_prefix: raw.slice(0, 10), status: "active", owner_user_id: farmer.id, owner_role: "farmer", generated_by_user_id: farmer.id, expiry_at: new Date(Date.now() + 30 * 86400000) },
  });

  console.log(JSON.stringify({ ok: true, farmer_id: farmer.id, tpt_id: tpt.id, batch_id: batch.id, asset_id: asset.id, species_id: tulsi.id }));
  require("fs").writeFileSync(path.join(__dirname, "p17_prep.json"), JSON.stringify({ farmer_id: farmer.id, tpt_id: tpt.id, admin_id: admin.id, batch_id: batch.id, asset_id: asset.id, species_id: tulsi.id }));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
