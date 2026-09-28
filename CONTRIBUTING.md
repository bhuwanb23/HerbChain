# Contributing to HerbChain

Thanks for your interest in contributing! This document explains how to set up
the project locally and get your changes merged.

## Project overview

HerbChain has three active components:

| Directory | Stack | Role |
| --- | --- | --- |
| `backend/` | Node.js, Express, Prisma, SQLite | REST API, transfer/QR engine, 17 domain modules |
| `App/` | React Native (Expo) | Mobile app for farmers, transporters, labs, manufacturers, consumers, admins |
| `website/` | React 19, Vite, MUI, Tailwind | AYUSH admin web portal |

Design docs live in `docs/` (phase specs `docs/phase_1.md` … `phase_17.md`,
mobile plan `docs/app/`, database architecture `backend/docs/database/`). Read
the relevant phase doc before changing backend behavior — the docs are the
spec of record.

## Getting started

Prerequisites: **Node.js ≥ 20** and npm. (Python is not required — the backend
is fully Node-based.)

```bash
# 1. Backend
cd backend
cp .env.example .env       # dev defaults are safe
npm install
npm run generate           # prisma generate (multi-file schema)
npm run migrate            # apply committed migrations
npm run seed               # demo users + 25-species AYUSH catalogue
npm run dev                # http://localhost:5000

# 2. Website (new terminal)
cd website
npm install
npm run dev                # http://localhost:5173

# 3. Mobile app (new terminal)
cd App
npm install
npx expo start             # scan the QR with Expo Go
```

Seeded credentials are listed in the root [README](README.md#demo-credentials).

## Development workflow

1. **Fork / branch** — create a feature branch from `main`:
   `git checkout -b feat/my-feature`
2. **Make your changes** — keep PRs focused; one feature or fix per PR.
3. **Test** — backend changes must keep the suite green:
   ```bash
   cd backend && npm test
   ```
4. **Lint** — the website has ESLint (`npm run lint`); keep it clean.
5. **Commit** — use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add quality-hold filter to inventory screen`
   - `fix: reject stale QR tokens in transfer flow`
   - `docs: update phase 8 spec with two-level review`
   - `refactor:`, `test:`, `chore:` as appropriate.
6. **Open a pull request** with a clear description of *what* changed and *why*.
   Link any related issues.

## Coding conventions

- **Backend** — CommonJS (`require`), Express app factory pattern, one module
  directory per domain under `src/modules/`. Business logic belongs in
  `src/services/`, request validation in zod schemas under `src/validation/`.
  All list/read endpoints return the `{ data, error }` envelope via
  `src/utils/responses.js`.
- **State changes are transactional** — any operation that mutates batch
  custody/state must run inside a Prisma interactive transaction and append a
  `BatchEvent`. The transfer state machine lives in
  `src/constants/enums.js` (`TRANSITIONS`) — never bypass it.
- **Mobile** — functional React components with hooks; API access goes through
  `App/services/apiClient.js` (never raw `fetch` in screens); role navigation
  is wired in `App/navigation/AppNavigator.js`.
- **Website** — MUI components, API access through
  `website/src/services/apiClient.js`.
- **Secrets** — never commit `.env`, API keys, or SQLite database files. They
  are gitignored; configure via `backend/.env` (see `backend/.env.example`).

## Testing notes

- Backend tests use `node --test` + supertest; each suite gets an isolated
  SQLite DB copied from a template (see `backend/tests/_db.js`). Suites seed
  their own users/species/RBAC.
- To (re)build the empty template DB used by the test harness:
  ```bash
  cd backend
  npm run generate && npm run migrate
  npx prisma migrate deploy --schema prisma/schema --skip-generate
  # create the template:
  node scripts/create-test-template.mjs
  ```
- `npm run e2e` runs a golden-path journey against a running server.

## Reporting issues

Open a GitHub issue with:
- What you expected vs. what happened
- Steps to reproduce (include the phase/module if known)
- Backend logs (`backend/logs/`) if relevant

For security vulnerabilities, do **not** open a public issue — see
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
