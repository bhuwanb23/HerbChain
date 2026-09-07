# HerbChain Backend (Node)

Re-implementation of the Flask backend in Node.js — same API surface, same
behavior. **Express + Prisma + SQLite** (Prisma makes Postgres a drop-in via
`DATABASE_URL`).

> Status: base scaffold booting. Routes, services, seed and tests are being
> ported step by step from `backend/` (Flask).

## Quick start

```bash
cd backend
cp .env.example .env          # defaults are fine for local dev
npm install                   # installs deps + runs prisma generate
npx prisma migrate dev --name init   # create SQLite schema + migration
npm run dev                   # http://localhost:5000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with auto-reload (`node --watch`) |
| `npm start` | Start |
| `npm run seed` / `npm run seed:fresh` | Seed demo data (wipes first with `--fresh`) |
| `npm run migrate` | Apply committed migrations (`prisma migrate deploy`) |
| `npm run db:push` | Sync schema without migrations (dev only) |
| `npm test` | Run the test suite (`node --test`) |

## Layout

```
backend/
├── prisma/
│   ├── schema.prisma         # 12 tables, 1:1 with the Flask models
│   └── migrations/
├── src/
│   ├── index.js              # entry point
│   ├── app.js                # Express app factory + envelope + error handlers
│   ├── config/               # env + logging
│   ├── constants/            # role/phase/enum choices + transfer table
│   ├── db/                   # Prisma client singleton
│   ├── middleware/           # requireAuth / requireRole
│   ├── routes/               # one file per resource (Flask blueprint 1:1)
│   ├── services/             # qr / transfer / traceability / recognition / weather
│   ├── serializers/          # to_dict() ports
│   ├── utils/                # response envelope, id helpers
│   └── scripts/              # seed + AYUSH catalogue data
└── tests/                    # node:test suite (port of backend/server/tests)
```

## Porting status (from the Flask backend)

All Flask functionality has been ported 1:1 and verified:

- [x] Base scaffold: Express app, config, Prisma schema (all tables)
- [x] Auth (register / login / refresh / me + RBAC)
- [x] QR service + transfer state machine + batch split
- [x] Batch / lab-report / product routes
- [x] Catalogue / farm / crop-plans / prices / recognition / weather / traceability / admin
- [x] Seed script + 25-species AYUSH catalogue
- [x] Test suite port + parity check — **53 tests, 53 passing** (`npm test`), matching the Flask pytest suite count

Tests run with `node --test` against isolated per-process SQLite databases
(`.testdb/`, gitignored), using supertest against the Express app — no server
port needed.

## Parity notes

- Response envelope is identical: `{ "data": ..., "error": null }`.
- QR tokens are HS256 JWTs with the same claims as Flask
  (`typ/sub/holder/phase/nonce/iat/exp`), so tokens minted by either backend
  with the same `QR_SIGNING_KEY` verify on both.
- Enum columns are TEXT; allowed values are enforced in code (same as the
  marshmallow OneOf validation the Flask API performs).