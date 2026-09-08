# Auth Architecture — Phase 2 Implementation Plan (new backend)

Status: **PLAN** for `second_backend` (Express + Prisma against the redesigned
53-model schema). Product spec: `docs/phase_2.md` (untracked, user-authored).
Schema conventions + module layout: `second_backend/docs/database/architecture.md`.

This document reconciles the product spec with the new schema and the locked
decisions, lists the small schema deltas Phase 2 needs, and gives the build
order. No Phase 2 code is written yet.

## 1. Decision log (what we locked and why)

| # | Decision | Choice |
|---|---|---|
| D1 | Onboarding | Self-register + AYUSH admin approval. Consumers active immediately; org roles gated until verified (D2 nuance for farmers) |
| D2 | Farmer lifecycle | **Provisional-active** — matches spec §2 "Farmer → Auto Approved". Farmers can create batches immediately (each batch is GPS + identity-tagged, so the data itself is the audit trail); `kyc_status` still records pending → verified for AYUSH's bookkeeping, and admin can suspend/reject anytime. Transporter, lab, manufacturer, distributor, retailer are **hard-gated**: no business capability until verified + org code assigned |
| D3 | Sessions | Server-side **rotating sessions**: opaque refresh token, SHA-256 in `Session`, rotated in place on every refresh; reuse of a rotated token revokes all sessions for the user |
| D4 | Verification in Phase 2 | Password-only login. `email_verified_at`/`phone_verified_at` are recorded markers; OTP/SMS delivery deferred to the notifications phase |
| D5 | Password recovery | In Phase 2 (spec §20): **reset token via email stub** — short-lived single-use token, delivered through a console/log mailer until a real provider lands; reset invalidates all sessions |
| D6 | Registration payload | **Identity-first** (name, phone/email, password, role → account + empty profile row + status). Role-specific profile data (farm, vehicle, accreditation, licenses, govt ID) is collected by each domain phase; `VerificationRequest` + document upload attach at approval time |
| D7 | RBAC storage | **DB-driven permissions** per spec §14 (`Permission` + `RolePermission` tables, seeded from a catalog) so new roles (State Inspector, Regional Officer, Consumer Auditor) need no code change |
| D8 | Admin | Created only by bootstrap seed — never self-registrable. Admin **monitors, never owns** (spec §13): admin excluded from custody roles |

## 2. Spec → schema reconciliation

Phase-2 spec proposes 6 new tables (§23). Mapping against the new 53-model
schema:

| Spec table (§23) | Verdict | Where it lands |
|---|---|---|
| `user_sessions` | ✅ already exists | `Session` — upgraded: refresh stored as SHA-256 (raw never in DB), rotation in place, reuse detection, `device_id` column added (delta S2) |
| `auth_logs` | ✅ already exists | `AuditLog` — action codes `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `TOKEN_REFRESH`, `ACCOUNT_LOCKED`, `PASSWORD_CHANGE`, `PASSWORD_RESET`, `REFRESH_REUSE`, `REGISTER`, `ROLE_CHANGE`, `USER_*`; `meta_json` carries success flag, IP, user-agent, device |
| `user_status_logs` | ✅ covered | `AuditLog` actions `USER_VERIFIED`/`USER_REJECTED`/`USER_SUSPENDED`/`USER_ACTIVATED` with `meta_json { old_status, new_status, reason }` — append-only by design |
| `verification_requests` | ➕ **new table** | `VerificationRequest` (delta S3) — status PENDING/APPROVED/REJECTED, `verified_by`, `verified_at`; supporting documents attach later via `EntityDocument` (`entity_type = verification_request`) once the assets phase lands |
| `permissions` | ➕ **new table** | `Permission` (delta S4) — catalog of `permission_key`s |
| `role_permissions` | ➕ **new table** | `RolePermission` (delta S4) — role → permission grants |

Additional schema deltas Phase 2 needs (all additive):

- **S1 — fraud lock fields on `User`**: `failed_login_count Int @default(0)`,
  `locked_until DateTime?` (spec §19: 5 failed attempts → temporary lock).
- **S2 — `Session.device_id String?`** so clients can label/revoke a specific
  device and the audit stream can correlate.
- **S3 — `VerificationRequest`** model (§5 workflow) with relations to the
  subject user and the verifying admin.
- **S4 — `Permission` + `RolePermission`** (DB-driven RBAC).
- **S5 — `PasswordResetToken`** (single-use reset tokens: `token_hash`,
  `expires_at`, `used_at`, `ip_address`).

No other schema changes: states live on `User` (`kyc_status`, `is_active`,
`locked_until`, `deleted_at`) and the wire exposes a derived
`account_status` (see §4).

## 3. Roles & the account-status state machine

Role codes (single role per user, lowercase): `consumer | farmer |
transporter | lab | manufacturer | distributor | retailer | admin`.

| User-state column | Values | Meaning |
|---|---|---|
| `is_active` | true / false | Hard on/off (admin suspend/blacklist) |
| `kyc_status` | none \| pending \| verified \| rejected | Identity/org verification (D2 farmer nuance) |
| `locked_until` | null / DateTime | Temporary fraud lock after failed logins |
| `deleted_at` | null / DateTime | Permanent deactivation (soft) |

**Wire `account_status`** (serializer-derived, matches spec §3 vocabulary):
`ACTIVE` | `PENDING` | `SUSPENDED` | `REJECTED` | `DEACTIVATED`

| account_status | computed when |
|---|---|
| `PENDING` | org role, `kyc_status = pending` (can log in, see own profile, not transact) |
| `ACTIVE` | consumer, or org role `kyc_status = verified` + farmer provisional, all while `is_active` and not locked/deleted |
| `SUSPENDED` | `is_active = false` or `locked_until` in the future |
| `REJECTED` | `kyc_status = rejected` |
| `DEACTIVATED` | `deleted_at` set |

## 4. RBAC — DB-driven permissions

Middleware chain per request: JWT validate → load user fresh (DB truth) →
account-status gate → role/permission gate → handler. Ownership validation
(the QR/state-machine layer) is a fourth layer that Phase 3+ owns — auth never
assumes a role may touch a batch just because it may touch the endpoint.

**Catalog seeds** (from spec §13; keys are the wire contract — grow per phase):

`batch.create`, `batch.view`, `batch.transfer`, `batch.receive`,
`batch.request`, `lab.test`, `lab.certify`, `lab.reject`, `product.create`,
`product.link`, `product.qr`, `shipment.manage`, `shipment.assign`,
`trace.resolve` (consumer scan), `profile.self`, `admin.users.manage`,
`admin.audit.view`, `admin.trace.view`, `admin.analytics.view`

Role → permission grants are **rows in `RolePermission`** (seeded to match
spec §13, editable at runtime for future roles). Admin grants are seeded on
bootstrap. `requirePermission("lab.certify")` checks: active + (verified gate
for org business keys) + grant row exists.

Error codes (existing envelope): `401 unauthorized | token_expired`,
`403 forbidden | account_not_verified | account_suspended`,
`409 email_taken`, `429 rate_limited`.

## 5. Token & session spec

- **Access**: JWT HS256, 15 min. Claims: `sub` = User.id, `sid` = Session.id,
  `role`, `name`, `type=access`, `jti`. `sid`-revoked sessions are rejected on
  the next request (no waiting for expiry). DB load per request keeps role /
  status changes instant.
- **Refresh**: 256-bit opaque, only `sha256` stored. One `Session` per device
  (`device_id`/`user_agent`/`ip`), rotated **in place** on `/refresh`
  (new hash + new token returned; client replaces its copy).
- **Reuse detection**: presented token whose hash matches nothing current ⇒
  theft ⇒ revoke **all** the user's sessions + audit `REFRESH_REUSE` + 401.
- **Revocation points**: logout (session), password change (all but current;
  current re-issued), password reset (all), admin suspend/blacklist (user
  gate), reuse detection (all).
- Sessions live 30 d, sliding on refresh; the device list screen
  (`GET /auth/sessions`) is backed by the same rows.

## 6. Fraud protection (spec §19) in Phase 2

- **Failed-login lock**: 5 consecutive failures per identifier/device →
  `locked_until = now + 15 min` (escalating: 15 m → 1 h → 24 h), audit
  `ACCOUNT_LOCKED`; success clears the counter.
- **Rate limiting**: `/login`, `/register`, `/refresh` — in-memory sliding
  window now (Redis behind an interface when deployed) → `429 rate_limited`.
- **Device tracking**: `device_id`, IP, user-agent, OS/browser on every
  `Session` + `AuditLog` row.
- **Suspicious geo-velocity flagging** (Chennai→Delhi in 2 min) is deferred to
  the intel/analytics phase — but every event already logs IP + timestamp, so
  the detector has its raw feed.

## 7. API surface (final)

Mounts: `/api/v1/auth/*` (public + self-service), `/api/v1/admin/*`
(admin-only). Same `{data}` / `{error}` envelope as today.

| Route | Auth | Behavior |
|---|---|---|
| `POST /auth/register` | — | `{name, phone, email?, password, role}` → 201 `{user, tokens}`. Consumer: ACTIVE. Farmer: provisional ACTIVE. Other orgs: PENDING + empty profile + `VerificationRequest`. Admin role rejected |
| `POST /auth/login` | — | `{identifier (email \| phone), password, device_id?, device_name?}` → tokens + `user`; opens Session; updates `last_login_at`; audit LOGIN / LOGIN_FAILED |
| `POST /auth/refresh` | refresh (header or body) | Rotate → `{access_token, refresh_token}` |
| `POST /auth/logout` | ✓ | Revoke calling session (via `sid`); audit LOGOUT |
| `GET /auth/me` | ✓ | `user` incl. `account_status`, role, profile/verification summary |
| `PATCH /auth/me` | ✓ | Update name/phone/locale |
| `POST /auth/change-password` | ✓ | `{old_password, new_password}` → revoke others, re-issue current |
| `POST /auth/forgot-password` | — | `{identifier}` → issue reset token (email stub); no account enumeration in the response |
| `POST /auth/reset-password` | reset token | `{token, new_password}` → single use, revoke all sessions |
| `GET /auth/sessions` · `DELETE /auth/sessions/:id` | ✓ | device list / revoke device |
| `GET /admin/users?role&status` | admin | verification queue |
| `GET /admin/users/:id` | admin | full dossier (user + profile + addresses + verification requests) |
| `POST /admin/users/:id/approve` | admin | `{org_code?, notes}` → verified + code; audit |
| `POST /admin/users/:id/reject` | admin | `{reason}` → rejected; audit |
| `POST /admin/users/:id/suspend` · `/activate` | admin | `{reason}` → is_active toggle; audit |
| `POST /admin/users/:id/role` | admin | role change + profile row create/remove; audit |

Spec-§22 aliases (`GET /me`, `/my-sessions`, `/session/:id`) are satisfied by
the `/auth/*` forms above — no duplicate mounts (legacy clients already call
`/api/v1/auth/*`).

## 8. Schema deltas to apply first (one migration)

Sketch — full Prisma lands with the code step:

```
// 02_security.prisma
model PasswordResetToken { id, user_id -> User, token_hash @unique,
  expires_at, used_at?, ip_address?, created_at }          // S5

Session: + device_id String?                               // S2

model Permission { id, key @unique, description?, module?, is_active, created_at }
model RolePermission { id, role, permission_id -> Permission, @@unique([role, permission_id]) }   // S4

// 01_identity.prisma
User: + failed_login_count Int @default(0)                 // S1
      + locked_until DateTime?
      + verification_requests VerificationRequest[] (subject)
      + verification_decisions VerificationRequest[] (verifier)

model VerificationRequest { id, user_id -> User, req_type,   // S3
  status (pending|approved|rejected), verified_by_user_id?, verified_at?,
  notes?, created_at, updated_at }  // docs attach later via EntityDocument
```

## 9. Codebase layout (`second_backend/src`)

```
src/config/env.js             # JWT 15m/30d, lock thresholds, rate limits, mailer stub flag
src/constants/roles.js        # role codes, account-status derivation
src/db/rbac.js                # seeded Permission/RolePermission catalog (spec §13)
src/middleware/auth.js        # requireAuth / requirePermission / requireAdmin
src/services/passwords.js     # bcrypt wrap (10 rounds)
src/services/tokens.js        # access JWT mint/verify; refresh mint/hash (sha256)
src/services/sessions.js      # create / rotate-in-place / revoke / reuse-detection
src/services/lockout.js       # failed-login counter + temporary lock
src/services/audit.js         # AuditLog writer (actor, action, meta)
src/services/users.js         # register (role → profile row + kyc), findByEmail/Phone
src/services/verification.js  # admin approve/reject/suspend/role-change + org codes
src/services/reset.js         # forgot/reset token lifecycle (email stub)
src/modules/identity/         # routes + serializers + zod schemas (auth, me, sessions, admin)
src/app.js                    # mount /api/v1/auth + /api/v1/admin
scripts/seed.js               # bootstrap admin + demo users per role (verified)
tests/auth/…                  # isolated-DB suite
```

## 10. Test plan (node:test + supertest, migrations applied per test DB)

Register (per role status outcome, dup email/phone, admin-role rejected,
farmer provisional-active, org gated), login (email + phone, wrong creds
identical response, disabled, lock after 5, rate limit), refresh (rotation,
reuse ⇒ revoke-all, expiry), logout / device revoke / change-password
(revoke-others), reset (single-use, revoke-all), RBAC (deny, verification
gate, role change effect), admin approve/reject/suspend (+ audit rows),
farmer's batch.create while lab's is gated.

## 11. Build order (each step green before the next)

1. Apply schema deltas S1–S5 (migration) + regenerate client
2. `constants` + `services` (passwords, tokens, sessions, lockout, audit) — unit tests
3. `middleware/auth.js` + RBAC catalog seed
4. Register / login / refresh / logout / me
5. change-password + sessions list/revoke
6. forgot / reset (email stub)
7. Admin user management (queue, approve/reject/suspend/role)
8. Seed bootstrap (admin + verified demo org users per role)
9. Full auth suite green; live smoke incl. reuse-attack + lockout checks

## 12. Assumptions for review

- Farmer provisional-active (D2) — derived from spec §2; can be tightened to
  full gating by flipping one capability seed if AYUSH wants it later.
- Single role per user; role change is an audited admin action.
- Access 15 min / refresh 30 d (env-configurable).
- Org codes auto-generated on approval (`FRM-2026-0001` style per role prefix).
- Email-stub mailer: reset links print to server log / a dev inbox until the
  notifications phase wires a real provider.
- Verification documents (govt ID, licenses) arrive with the assets phase;
  until then admin approval may proceed on profile data + notes.
