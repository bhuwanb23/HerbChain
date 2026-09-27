# Security Policy

## Supported versions

HerbChain is an actively developed project. Security fixes are applied to the
latest `main` branch.

| Version | Supported |
| --- | --- |
| latest `main` | ✅ |
| older tags / branches | ❌ |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, report them privately using one of these channels:

1. **GitHub private vulnerability reporting** — on the repository page, go to
   *Security → Report a vulnerability* (preferred).
2. **Email** — contact the maintainer at `bhuwanseervi4567@gmail.com` with
   `[HerbChain Security]` in the subject line.

Include as much of the following as you can:

- Type of issue (e.g. broken access control, QR token forgery, SQL injection)
- Full paths of source file(s) related to the manifestation of the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## What to expect

- Initial triage within **7 days**
- Status update within **30 days**
- Credit given to reporters in the changelog (unless anonymity is requested)

## Security-relevant areas

When auditing HerbChain, the highest-value areas are:

- **QR custody tokens** — HS256 JWTs signed with `QR_SIGNING_KEY`
  (`backend/src/services/qrService.js`). Replay/staleness checks live in
  `transferService.js`.
- **Transfer state machine** — `backend/src/constants/enums.js` (`TRANSITIONS`)
  and `backend/src/services/transferService.js`. Ownership may only change
  through governed transfer requests (phase 6) executed inside a Prisma
  transaction.
- **Auth & RBAC** — JWT access/refresh flow, permission middleware
  (`backend/src/middleware/`, `backend/src/db/rbac.js`).
- **Public endpoints** — `/verify/*` (consumer passport) and
  `/api/v1/documents/shares/:code` are unauthenticated and rate-limited;
  verify they never leak more than intended.
- **Uploads** — `backend/src/modules/uploads/` (multer) and document
  virus-scan worker (`backend/src/services/documentWorker.js`).

## Known demo-only defaults

The repository ships with intentionally insecure **development defaults** so
it runs out of the box:

- `SECRET_KEY` / `JWT_SECRET_KEY` / `QR_SIGNING_KEY` are `change-me-*` values
- Demo accounts with published passwords (`Admin@123456`, `Demo@123456`)
- SQLite with no encryption; CORS set to `*`

These are **not** production settings. Before any real deployment: generate
strong secrets, rotate all credentials, restrict CORS, enable TLS, and review
`backend/.env.example` against `backend/src/config/env.js`.
