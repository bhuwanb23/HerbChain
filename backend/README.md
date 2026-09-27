# HerbChain Backend (Node)

Express + Prisma + SQLite API for the HerbChain AYUSH traceability platform.
Prisma makes Postgres a drop-in via `DATABASE_URL`.

> Status: complete — 241 routes, 211 tests green (`npm test`).

## Quick start

```bash
cd backend
cp .env.example .env          # defaults are fine for local dev
npm install
npm run generate              # prisma generate (multi-file schema)
npm run migrate               # apply committed migrations (prisma migrate deploy)
npm run seed                  # demo users + 25-species AYUSH catalogue
npm run dev                   # http://localhost:5000
```

Seeded accounts: `admin@herbchain.in` / `Admin@123456` (admin), plus
`consumer|farmer|transporter|lab|manufacturer|distributor|retailer@herbchain.in`
/ `Demo@123456`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with auto-reload (`node --watch`) |
| `npm start` | Start |
| `npm run seed` / `npm run seed:fresh` | Seed demo data (wipes first with `--fresh`) |
| `npm run migrate` | Apply committed migrations (`prisma migrate deploy`) |
| `npm run db:push` | Sync schema without migrations (dev only) |
| `npm test` | Full test suite (`node --test tests/*/*.test.js`) |
| `npm run e2e` | Golden-path journey against a running server (`BASE_URL`, default `http://localhost:5000`) |
| `npm run test:<suite>` | Single suite (`auth`, `batches`, `admin`, …) |

## Layout

```
backend/
├── prisma/
│   ├── schema/              # multi-file schema (25 .prisma files) + herbchain.db (dev)
│   │   └── migrations/      # committed migrations (20 applied, incl. consumer_feedback)
│   ├── schema.legacy.prisma # archived single-file schema (reference only)
│   ├── migrations.legacy/   # archived pre-multi-file migration (reference only)
│   └── scratch_new.db        # empty template copied by the test harness
├── src/
│   ├── index.js             # entry point (API + optional queue workers)
│   ├── app.js               # Express app factory, route mounting, error box
│   ├── config/              # env + logging
│   ├── constants/           # role/phase/enum choices + transfer table
│   ├── db/                  # Prisma client singleton + RBAC permissions
│   ├── middleware/          # requireAuth / requirePermission
│   ├── modules/             # one dir per domain (routes + wiring):
│   │   ├── identity/        #   auth, register, admin users
│   │   ├── trace/           #   batches, QR
│   │   ├── catalogue/       #   species (public read path)
│   │   ├── transfers/ shipments/ lab/ procurement/ products/
│   │   ├── identification/ uploads/ verification/ blockchain/
│   │   ├── admin/           #   admin portal (dashboard, alerts, recalls)
│   │   ├── analytics/ notifications/ documents/ sync/ support/ prices/
│   ├── services/            # business logic (transfer, qr, trace, ledger, …)
│   ├── validation/          # zod schemas (auth / batch / identification)
│   ├── serializers/         # response serializers
│   ├── utils/               # response envelope, errors, ids
│   └── scripts/             # seed + AYUSH catalogue data
└── tests/                   # node:test suites, one dir per domain
    ├── _db.js               # isolated-DB harness (copies prisma/scratch_new.db)
    └── */                   # admin, analytics, auth, batches, blockchain,
                             # catalogue, documents, identification, lab,
                             # notifications, prices, procurement, products,
                             # qr, shipments, sync, transfers, verification
```

## Testing

- Suites run under `node --test "tests/*/*.test.js"` with supertest against the
  Express app — no server port needed.
- Each suite gets an isolated SQLite DB: `tests/_db.js` copies
  `prisma/scratch_new.db` to a temp file and pins `DATABASE_URL` before the
  Prisma client loads.
- Suites seed their own users/species/RBAC (the template DB is intentionally
  empty).
