# HerbChain — Developer Handover

**Date:** 2026-09-08 · **Status:** Production-ready (Phases 1–17 backend + Phases A0–A8 frontend)

---

## Quick Start (< 10 minutes)

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push --force-reset   # fresh SQLite
node scripts/seed.js               # seed admin + test data (if exists)
npm test                           # 202/202 tests should pass
npm run e2e                        # E2E golden-path journey (requires running server)
PORT=5000 node src/server.js       # start backend on :5000
```

### 2. Mobile App (React Native / Expo)

```bash
cd App
npm install
npx expo start                     # scan QR with Expo Go
```

### 3. Admin Web Portal (React + Vite)

```bash
cd website
npm install
npm run dev                        # Vite dev server on :5173
```

---

## Architecture

```
App/                    → React Native mobile (Expo)
  pages/users/          → 6 role-based screen sets (farmer, transporter, lab, manufacturer, admin, consumer)
  navigation/           → AppNavigator.js with per-role tab navigators
  services/apiClient.js → 15+ API namespaces pointing at backend

website/src/            → Admin web portal (React + Vite)
  pages/                → Dashboard, trace, compliance, reports, users, settings, blockchain, investigations, etc.
  services/apiClient.js → AdminAPI, AnalyticsAPI, ReportsAPI, BlockchainAPI, etc.

backend/                → Node.js + Express + Prisma (SQLite)
  prisma/schema/        → 25+ schema files, 140+ models
  src/modules/          → 17 domain modules
  src/services/         → Business logic layer
  tests/                → 202 tests across 16 suites
```

---

## Backend Modules (Phases 1–17)

| Phase | Module | Key Endpoints |
|---|---|---|
| 1–2 | Auth / RBAC | `/api/v1/auth/login`, `/register`, `/me`, `/refresh` |
| 3 | Batches + QR | `/api/v1/batches/*`, `/qr/*` |
| 4 | Identification | `/api/v1/identifications/*` |
| 5 | Transfers | `/api/v1/transfers/*` |
| 6 | Shipments | `/api/v1/shipments/*` |
| 7 | Lab | `/api/v1/labs/*` |
| 8 | Procurement | `/api/v1/manufacturer/*` |
| 9 | Products | `/api/v1/products/*`, `/manufacturing/*` |
| 10 | Consumer Verify | `/verify/scan` (public), `/api/v1/verify/*` |
| 11 | Admin Portal | `/api/v1/admin/portal/*` (21 endpoints) |
| 12 | Blockchain | `/api/v1/blockchain/*` |
| 13 | Notifications | `/api/v1/notifications/*` |
| 14 | Documents | `/api/v1/documents/*` |
| 15 | Analytics | `/api/v1/analytics/*` (10 domains) |
| 16 | Reports | `/api/v1/reports/*` |
| 17 | Offline Sync | `/api/v1/sync/*`, `/api/v1/devices/*` |
| A6 | Support | `/api/v1/support/*` |
| A8 | Consumer Feedback | `/verify/feedback`, `/verify/report-fake` (public) |
| A9 | Prices | `/api/v1/prices/*` |

---

## Seeded Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@herbchain.com | Admin@123456 |

Other roles (farmer, transporter, lab, manufacturer) are created via `/api/v1/auth/register`.

---

## Ports

| Service | Port |
|---|---|
| Backend | 5000 |
| Website (Vite) | 5173 |
| Expo | 8081 |

---

## Testing

```bash
cd backend && npm test          # Unit + integration (202 tests)
cd backend && npm run e2e       # E2E golden-path journey
```

---

## Key Files

| File | Purpose |
|---|---|
| `backend/src/app.js` | Express app + route mounting |
| `backend/prisma/schema/` | Database schema (25 files) |
| `backend/src/services/` | Business logic (17+ services) |
| `App/navigation/AppNavigator.js` | Mobile navigation (6 role tabs) |
| `App/services/apiClient.js` | Mobile API client (15+ namespaces) |
| `website/src/App.jsx` | Web routing |
| `website/src/services/apiClient.js` | Web API client |
| `docs/app/master_plan.md` | Phase tracking |
| `docs/app/overview.md` | Product spec |
