# Phase 11 — Consumer Verification Portal (Digital Product Passport)

Status: **LIVE** — public `/verify` endpoints (no auth) + internal
`/api/v1/verify` analytics mounted; `65_verification.prisma` adds 3 models
(`ConsumerScan`, `CounterfeitAlert`, `ProductVerificationCache`) +
`Product.verification_status`; migration `20260904160000_phase11_consumer_verification`,
schema **92 → 95 models**. Tests: `tests/verification/` (11 scenarios over
real HTTP incl. rate limiting), part of `npm test` (135 cases total).

Spec: `docs/phase_11.md`.

## 1. What this phase is

Everything from Phase 1 to Phase 10 (farmers → transporters → labs →
manufacturers → AYUSH) culminates in one public moment: **a consumer scans
the permanent product QR and instantly verifies authenticity, origin,
certification and traceability — with no login, no registration, no app.**
The consumer QR is the *product* QR (`ProductQrToken`, minted once at run
completion) — never the internal batch *ownership* QR, which rotates on
every custody hop and stays internal.

## 2. Core philosophy (from the spec)

1. **Public QR, public verdict.** The passport is served to anyone. The
   engine checks, in order: product exists → product active → QR valid →
   lineage exists → certificates valid, and returns exactly one of
   `VERIFIED | EXPIRED | RECALLED | UNDER_INVESTIGATION | INVALID`.
2. **Never expose internal operational data.** Passport sections expose
   public codes (`PRD-…`, `BAT-…`, `CERT-…`) and names only — never DB ids,
   user ids, ownership ids, emails, phones, addresses, government ids or
   financial data. Farmer detail is name + district only (spec "Privacy
   Rules").
3. **Every scan is tracked.** One scan writes a `ConsumerScan` (geo + device
   dimensions + engine verdict) AND a forensic `qr_scan_logs` row
   (`purpose=consumer_view`, GPS + failure reason). The two streams feed
   demand analytics and counterfeit detection respectively.
4. **Counterfeit detection is deterministic + auditable.** Same token
   scanned from far-apart places in minutes (`geo_velocity`), scan bursts
   (`scan_burst`), excessive daily volume, post-revoke scans and
   unknown-token floods each raise a `CounterfeitAlert` (reason + severity +
   evidence JSON) — deduped per (token, reason).
5. **Recalls reach the consumer instantly.** `assessBatchImpact` (Phase 10)
   now also flips `Product.verification_status → RECALLED` and purges the
   passport cache, so the very next scan shows `⚠ RECALLED — Do Not
   Consume`.
6. **Fast path without external infra.** No Redis in this stack: the
   passport fast path is the `product_verification_cache` table (TTL via env
   `VERIFY_CACHE_TTL_SECONDS`, purge-on-recall). It ports 1:1 to a Redis
   cache keyed by token hash if the portal scales horizontally.

## 3. Public security controls

| Control | Implementation |
|---|---|
| Rate limiting | In-memory sliding window per IP on the public router (`PUBLIC_VERIFY_RATE_LIMIT`, default 100/min — spec example; 0 disables) |
| Bot probing | Unknown-token flood detection (`unknown_token_burst`) + scan-burst alerts; unknown tokens still get an honest `INVALID` passport |
| No stored secrets | Raw QR tokens are never stored — lookups are SHA-256 hash only (`ProductQrToken.token_hash`) |
| Hidden internal ids | Passport / journey / certificate serializers emit only codes + names |
| Traffic monitoring | AYUSH analytics endpoint (scans, geo demand, top products, devices, trend, alerts) |
| Cache safety | Passport cache purged on product recall / status change — a recalled product can never serve a stale `VERIFIED` |

## 4. Engine verdicts

| Status | Verified | When | Badge |
|---|---|---|---|
| `VERIFIED` | ✅ | product active + QR active + lineage present + all ingredient certs active & unexpired | success |
| `EXPIRED` | ❌ | authentic, but an ingredient certificate has lapsed | warning |
| `RECALLED` | ❌ | `product.status = recalled` or an open `AffectedProduct` row — `do_not_consume` notice | danger |
| `UNDER_INVESTIGATION` | ❌ | open `CounterfeitAlert` on the token/product — verification withheld | warning |
| `INVALID` | ❌ | unknown token / revoked QR / missing product / incomplete lineage (`reason` explains which) | danger |

The verdict is persisted on `products.verification_status` at every scan
(and by the recall flow) so AYUSH can filter recalled/flagged products
without re-scanning. `unverified` is the pre-first-scan default.

## 5. The passport (nine consumer sections)

Built from the live lineage (`ProductQrToken → lot → run → ingredient
batches → farmers/certificates/events` + lot events), cacheable:

1. **Product identity** — name, category, pack size, lot code, expiry
2. **Authenticity status** — the big badge (verified / under review /
   recall active / invalid)
3. **Manufacturer info** — name, AYUSH licence number + status, location,
   production date, expiry date (`ManufacturerProfile` + lot dates)
4. **Ingredient summary** — species common names + quantities
   (consumer-friendly; batch codes behind "View Details")
5. **Origin information** — distinct farms: farmer name, district, state,
   harvest date, batch code; sensitive farmer data (phone/email/address)
   never leaves the DB
6. **Laboratory certification** — certificate number, lab name, PASS/status,
   issued/expiry dates per source batch
7. **Supply chain journey** — consumer timeline
   `🌱 Harvested → 🚛 Transported (N legs) → 🔬 Laboratory Tested →
   ✅ Certified → 🏭 Manufactured`, derived from batch + lot events (internal
   operational detail stays hidden)
8. **Sustainability** — cultivation types (organic/conventional/wild),
   organic-certified flags, regions
9. **Product trust score** — 0–100 from lab pass (40) + traceability
   complete (30) + licensed manufacturer (15) + verified supply chain (15)

## 6. API surface

Public (no auth, rate-limited):

| Endpoint | Purpose |
|---|---|
| `POST /verify/scan` | **The tracking entry**: records the scan + runs the engine + returns the full passport (portal flow: scan QR → passport) |
| `GET /verify/product/:token` | Passport summary — side-effect free (no scan row), populates the cache; for shares/links/crawlers |
| `GET /verify/product/:token/journey` | Supply-chain timeline (§7) |
| `GET /verify/product/:token/certificate` | Certificate view (§6) |

`POST /verify/scan` accepts the raw token or a portal URL
(`https://verify.…/p/<token>`, `/qr/<token>`) — the last path segment is the
token. Geo/device facets come from the body (`country`, `state`, `city`,
`device_type`, `gps_lat/lng`) + headers (`user-agent`, `x-device-id`, `ip`).

Internal (auth + `verify.analytics.view` — admin sees all, manufacturer is
scoped to its own products):

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/verify/analytics` | Scan KPIs (total, 7d/30d, by outcome), most-scanned products, geographic demand, device mix, 14-day trend, alert summary |
| `GET /api/v1/verify/scans` | Scan list (filters: outcome, product_id) |
| `GET /api/v1/verify/alerts` | Counterfeit alerts (filter status/severity) |
| `POST /api/v1/verify/alerts/:id/resolve` | Close an alert (admin or affected product's manufacturer) |

## 7. Models (`65_verification.prisma`)

| Model | Table | Role |
|---|---|---|
| `ConsumerScan` | `consumer_scans` | One anonymous scan: token hash, resolved product/lot, engine outcome, country/state/city, device_type, ip, user_agent — the demand + counterfeit signal stream |
| `CounterfeitAlert` | `counterfeit_alerts` | Anomaly verdict: reason + severity + status + evidence JSON; `open → investigating → resolved` |
| `ProductVerificationCache` | `product_verification_cache` | Frozen passport per token hash with TTL; purged on recall/status change |
| `Product.verification_status` | (column) | Persisted engine verdict (VERIFIED/EXPIRED/RECALLED/UNDER_INVESTIGATION/INVALID/unverified) |

Each scan also writes the existing forensic `qr_scan_logs` row
(`purpose=consumer_view`, GPS + failure reason) — the Phase-1 "one scan
stream" stays intact for tamper forensics; `ConsumerScan` is its analytics
companion (spec "Consumer Scan Tracking").

## 8. Verification

- `npx prisma validate --schema prisma/schema` → valid ✅ (95 models).
- Migration `20260904160000_phase11_consumer_verification` applied; template
  DB rebuilt from all 13 migrations; Prisma client regenerated.
- `npm test` → **135/135** across all ten suites (11 new verification cases:
  full VERIFIED passport + privacy assertions, GET side-effect free, journey
  + certificate views, cache fast path + expiry + recall purge, RECALLED
  with do-not-consume, UNDER_INVESTIGATION, unknown-token + revoked-QR
  INVALID paths, scan-burst + geo-velocity alerts, AYUSH analytics + scoping,
  rate limiting 429).
- Live smoke over real HTTP (demo farmer → transporter → lab certify →
  manufacturer procurement → finished lot `PRD-…` → public scan → VERIFIED
  passport with all nine sections → journey + certificate → recall drill →
  RECALLED + do-not-consume → counterfeit burst alert → AYUSH analytics):
  **56/56 checks passed**.

## 9. Supersession notes

- Phase 1 merged consumer views into `qr_scan_logs` (one anomaly stream);
  Phase 11 adds the dedicated analytics table `ConsumerScan` while keeping
  the forensic row per scan — see `docs/database/architecture.md` §5d.
- Phase 10's auth-gated `/api/v1/products/qr/verify` remains for internal
  checks; the public passport is the consumer entry point
  (`docs/products/architecture.md` §6).
- `verification_statuses` as a *lookup table* (spec "New Database Tables")
  is intentionally not materialized: statuses are a fixed code list owned by
  `src/constants/verification.js` (project convention), and the persisted
  verdict lives on `products.verification_status`. Same for the Redis cache —
  the table form is used (spec marks it optional).