# Phase A0 — Backend Cutover (both front-ends → `second_backend`)

**Goal:** every HTTP call from `App/` and `website/` hits `second_backend`. No new screens. After this phase, login/register/session works end-to-end on both front-ends against the new backend.
**Status:** ⬜ not started

---

## Why first

Everything else is blocked on the contract. `App/services/apiClient.js` exposes 13 API namespaces — 8 speak dead Flask routes. `website/src/services/apiClient.js` points `AdminAPI` at `/admin/api/*` (Flask) and defaults to port 5000 which happens to match `second_backend`'s default `PORT=5000`, so **only route rewrites are needed, not host changes**.

## Steps

| # | Step | Files | Detail | Status |
|---|---|---|---|---|
| 1 | Inventory dead endpoints | `App/services/apiClient.js` | Map every method in the 13 namespaces to its new-backend replacement (table below). Produce the rewrite list. | ⬜ |
| 2 | Rewrite `App/services/apiClient.js` | same | Replace dead routes with new contract (see mapping table). Keep the `{data,error}` envelope handling — `second_backend` uses the same envelope. | ⬜ |
| 3 | Rewrite `website/src/services/apiClient.js` | same | `AdminAPI` → `/api/v1/admin/portal/*` + `/api/v1/admin/users*`; add missing namespaces (analytics, notifications, documents) for later phases. | ⬜ |
| 4 | Auth parity check | `App/contexts/AuthContext.js`, `website/src/contexts/*` | New backend returns `access_token` + `refresh_token`; confirm both stores/refreshes correctly. Verify `/auth/me` shape (`user` object with `role`). | ⬜ |
| 5 | CORS + env | `second_backend/.env`, `website/.env*` | `CORS_ORIGIN` must include the web dev host; `VITE_API_BASE_URL` set for website; `API_BASE_URL` via `app.json` extra for app. | ⬜ |
| 6 | Smoke: web login → dashboard data | `website/` | Run backend (PORT=5000) + website dev server; login with a seeded admin; dashboard page renders real data. | ⬜ |
| 7 | Smoke: app login → auth/me | `App/` | Expo app login with seeded farmer; `AuthContext` holds tokens; `/auth/me` refresh works. | ⬜ |
| 8 | Grep-gate: zero dead prefixes | both | `grep -r "/api/v1/herbs\|/api/v1/crop\|/api/v1/catalogue\|/admin/api\|/api/v1/traceability\|/api/v1/farm\|/api/v1/prices\|/api/v1/weather\|/api/v1/recognition" App/ website/src/` → 0 hits (excluding documented exceptions). | ⬜ |
| 9 | Commit in similarity groups | — | apiClient rewrites / auth context / env / docs. No co-author. | ⬜ |

## Endpoint mapping table (the rewrite list)

| Old (dead) | New (`second_backend`) | Notes |
|---|---|---|
| `POST /api/v1/herbs` (register batch) | `POST /api/v1/batches` | payload: `species_id, quantity, unit, harvest_date, cultivation_type, asset_ids[]` |
| `GET /api/v1/herbs/mine` | `GET /api/v1/batches/mine` | |
| `GET /api/v1/herbs/:id` | `GET /api/v1/batches/:id` | |
| `POST /api/v1/herbs/:id/split` | `POST /api/v1/batches/:id/split` | |
| `GET /api/v1/herbs/lab/pending` etc. | `GET /api/v1/labs/batches?status=…` | lab queue moved to labs module |
| `GET /api/v1/catalogue` / `/:id` | `GET /api/v1/species` / `/:code` | read-only for app; species create/update stays admin (`/api/v1/admin`-scoped if needed) |
| `POST/PUT/DELETE /api/v1/catalogue` | admin species routes (check `adminRoutes`) | app-side: drop write paths |
| `GET/PUT /api/v1/farm/me` | `GET /api/v1/auth/me` + farmer profile fields | verify profile update endpoint in adminRoutes; else defer to A3 |
| `GET/POST /api/v1/crop-plans` | ❂ no direct equivalent | keep client-side; decide in A9 (crop calendar works off species + local plans) |
| `GET /api/v1/weather` | ❂ none | stub/disable card in A1; decide in A9 |
| `GET/POST /api/v1/prices` | ❂ none | hide prices screen in A1; decide in A9 |
| `POST /api/v1/recognition/herbs` | `POST /api/v1/identifications` (P4: detect→confirm) | two-call flow: upload asset → detect → confirm |
| `GET /api/v1/traceability/batch/:id` | `GET /api/v1/batches/:id/events` | |
| `GET /api/v1/traceability/product/:id` | `GET /api/v1/products/:id` (includes lineage) | |
| `POST /api/v1/traceability/resolve` | `POST /api/v1/verify/scan` (public) | |
| `GET /admin/api/stats` | `GET /api/v1/admin/portal/dashboard` | |
| `GET /admin/api/users` | `GET /api/v1/admin/users` | |
| `GET /admin/api/batches` | `GET /api/v1/admin/portal/search?type=batch&q=…` or `/api/v1/batches` admin-scoped | verify at implementation |
| `GET /admin/api/events` | `GET /api/v1/admin/portal/audit` | |
| `GET /admin/api/products` | `GET /api/v1/admin/portal/products/:id` / search | |
| `GET /admin/api/lab-reports` | `GET /api/v1/labs/...` (lab-scoped) or portal reports | |
| `GET /admin/api/health` | `GET /api/v1/ping` | |

## Acceptance criteria

- [ ] Both front-ends log in against `second_backend` and render one real data screen each.
- [ ] Grep-gate (step 8) passes.
- [ ] Backend untouched (no schema/code changes in this phase).
- [ ] `master_plan.md` index updated: A0 ✅.

## Risks / notes

- `website` defaults to port 5000 = `second_backend` default → zero host friction.
- Old Flask `backend/` stays in repo untouched until A9 (reference for contract quirks).
- If any admin endpoint shape differs from what web pages expect, adapt the **client**, not the backend.
