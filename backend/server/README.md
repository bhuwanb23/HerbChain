# HerbChain — Backend

Flask 3 + SQLAlchemy + Flask-Migrate. SQLite by default, drop-in compatible
with Postgres via `DATABASE_URL`.

## Quick start

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate            # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp env.example .env                 # edit JWT_SECRET_KEY + QR_SIGNING_KEY before prod

cd server
flask --app app db upgrade
python scripts/seed_demo.py --fresh   # 6 demo users + 3 demo batches
flask --app app run --host 0.0.0.0 --port 5000
# Prod-style alternative on Windows:
#   waitress-serve --listen=0.0.0.0:5000 app:app
# On Linux/macOS:
#   gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Tests:

```bash
cd backend
pytest
```

## Architecture

### Data model

| Table | Role |
| --- | --- |
| `users` | Identity, role (`farmer | transporter | lab | manufacturer | consumer | admin`), bcrypt password hash, `is_active`. |
| `herbs` | **Immutable** facts about a harvested batch: species, weight, harvest date, GPS, image URL. Optional `species_id` link to `herb_catalogue` and optional `parent_batch_id` self-FK for split children. |
| `batch_states` | **Mutable** denormalised current state of each batch: `phase`, `test_result`, `current_holder_id`, `current_qr_token`. One row per herb. |
| `batch_events` | Append-only timeline (`CREATED`, `TRANSFER`, `LAB_REPORT`, `PRODUCT_LINK`, `BATCH_SPLIT`, …). The single source of truth for traceability. |
| `lab_reports` | Structured lab test metrics (pass/fail outcome lives on `BatchState.test_result`). |
| `products` / `product_batch_links` | Manufacturer finished goods and the herb batches they consumed. |
| `herb_catalogue` | Master AYUSH herb species (admin-curated). `species_id`, common + scientific name, synonyms (used by the AI re-ranker), description, medicinal uses, seasons. |
| `price_quotes` | Admin-recorded market price snapshots per species; latest one wins for display. |
| `farm_profiles` | One per farmer: land size, soil + irrigation type, certifications, GPS, address. |
| `crop_plans` | Farmer-owned plant→harvest schedule per species + plot, with status enum. |
| `weather_snapshots` | Cached weather provider responses keyed on rounded `(lat, lng)`; 1 hr TTL applied by the service. |

### Phase state machine

```
                          farmer registers batch
                                   |
                                   v
                              with_farmer
                                   |  transporter scans
                                   v
                         in_transit_to_lab
                                   |  lab scans
                                   v
                                at_lab  ──> LAB_REPORT (sets test_result)
                                   |  transporter scans (only if approved)
                                   v
                    in_transit_to_manufacturer
                                   |  manufacturer scans
                                   v
                          with_manufacturer
                                   |  PRODUCT_LINK
                                   v
                               consumed
```

The transition table (`services/transfer_service.py:TRANSITIONS`) is the only
place this is encoded. Any scan not in the table is rejected with
`invalid_transition`.

### QR codes (security)

QR payloads are compact JWTs signed with `HMAC-SHA256` and `QR_SIGNING_KEY`:

```json
{ "batch_id": "HERB-…", "holder_id": "…", "phase": "with_farmer",
  "nonce": "…", "iat": …, "exp": … }
```

Properties enforced by `services/qr_service.py` + `services/transfer_service.py`:

- **Cryptographic integrity** — signature mismatch ⇒ `invalid_qr`.
- **Replay protection** — the scanned token must equal `BatchState.current_qr_token`; otherwise `stale_qr`. The previous QR dies the instant the next scan succeeds.
- **Expiry** — every token has `exp` (default 30 days). Expired ⇒ `invalid_qr`.
- **Role guard** — `(current_phase, scanner_role)` must be in the transitions table.

PNG rendering is on-demand via `GET /api/v1/batches/<id>/qr` and only succeeds
when the caller is the current holder.

### Auth

- `Flask-JWT-Extended` issues access + refresh tokens at `/api/v1/auth/login`.
- All write endpoints use `@require_role(...)`; nobody trusts an actor ID from
  the request body.
- Passwords are bcrypt-hashed via `passlib`.

## API surface

| Method + path | Auth | Role | Purpose |
| --- | --- | --- | --- |
| `POST /api/v1/auth/register` | — | — | Create user. |
| `POST /api/v1/auth/login` | — | — | Email + password ⇒ JWTs. |
| `POST /api/v1/auth/refresh` | refresh-JWT | — | Refresh access token. |
| `GET  /api/v1/auth/me` | JWT | — | Current user profile. |
| `POST /api/v1/batches` | JWT | farmer | Register a batch, mint initial QR. |
| `GET  /api/v1/batches/mine` | JWT | any | Batches currently held by me. |
| `GET  /api/v1/batches/<id>` | JWT | any | Batch state + herb + recent events. |
| `GET  /api/v1/batches/<id>/qr` | JWT | holder | PNG (`image/png`) of the current QR. |
| `POST /api/v1/batches/<id>/transfer` | JWT | any | Unified scan-to-transfer endpoint. |
| `POST /api/v1/batches/<id>/split` | JWT | farmer | Split a held batch into N children (each gets its own QR). |
| `POST /api/v1/lab-reports` | JWT | lab | File a report; sets `test_result`. |
| `POST /api/v1/products` | JWT | manufacturer | Create a finished product from one or more batches. |
| `GET  /api/v1/farm/me` | JWT | farmer | Read my farm profile. |
| `PUT  /api/v1/farm/me` | JWT | farmer | Upsert my farm profile. |
| `GET  /api/v1/catalogue` | JWT | any | Search the AYUSH herb catalogue (`?q=`, `?category=`). |
| `GET  /api/v1/catalogue/<species_id>` | JWT | any | One species + latest price. |
| `POST /api/v1/catalogue` | JWT | admin | Add a species. |
| `PUT  /api/v1/catalogue/<species_id>` | JWT | admin | Update / activate / deactivate a species. |
| `GET  /api/v1/crop-plans` | JWT | farmer | List my crop plans. |
| `POST /api/v1/crop-plans` | JWT | farmer | Create a crop plan against a known species. |
| `PUT/DELETE /api/v1/crop-plans/<id>` | JWT | farmer | Modify my own plan. |
| `POST /api/v1/recognition/herbs` | JWT | any | Re-rank on-device TFLite candidates against the AYUSH catalogue (top-3). |
| `GET  /api/v1/weather?lat=&lng=` | JWT | any | Current + 3-day forecast (OpenWeatherMap, falls back to a deterministic stub when no API key is set). |
| `GET  /api/v1/prices` | JWT | any | Latest price per species. |
| `GET  /api/v1/prices/<species_id>` | JWT | any | Full history for one species. |
| `POST /api/v1/prices` | JWT | admin | Record a new price quote. |
| `GET  /api/v1/traceability/batch/<id>` | — | — | Public journey timeline for a batch. |
| `GET  /api/v1/traceability/product/<id>` | — | — | Public lineage for a product. |
| `POST /api/v1/traceability/resolve` | — | — | Resolve any signed QR ⇒ batch or product journey. |
| `GET  /admin/api/stats` | JWT | admin | Aggregated counts (users by role, batches by phase, test results). |
| `GET  /admin/api/batches` | JWT | admin | Recent batches + state. |
| `GET  /admin/api/users` | JWT | admin | User list. |

All responses use the envelope `{ "data": ..., "error": null }` or
`{ "data": null, "error": { "code": "...", "message": "...", "details": ... } }`.

## Project layout

```
backend/
├── env.example
├── pytest.ini
├── requirements.txt
└── server/
    ├── app.py                 # Flask factory, error handlers, blueprint registration
    ├── config/
    │   └── logging.py
    ├── migrations/            # Alembic revisions
    ├── models/                # SQLAlchemy models (see Data model above)
    ├── routes/                # Blueprints — one file per resource
    │   ├── admin.py
    │   ├── auth.py
    │   ├── batches.py         # incl. /<id>/split
    │   ├── crop_plans.py
    │   ├── farm.py
    │   ├── herb_catalogue.py
    │   ├── lab_reports.py
    │   ├── prices.py
    │   ├── products.py
    │   ├── recognition.py
    │   ├── traceability.py
    │   └── weather.py
    ├── schemas/               # marshmallow request schemas
    ├── services/
    │   ├── qr_service.py
    │   ├── transfer_service.py     # incl. split_batch
    │   ├── recognition_service.py  # hybrid rerank against catalogue
    │   ├── weather_service.py      # provider + cache + stub fallback
    │   └── traceability_service.py
    ├── utils/
    │   ├── auth.py            # @require_auth, @require_role, current_user
    │   └── responses.py       # ok() / error() envelope helpers
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_transfer_flow.py
    │   ├── test_qr_security.py
    │   ├── test_traceability.py
    │   ├── test_catalogue.py
    │   ├── test_farm_profile.py
    │   ├── test_crop_plans.py
    │   ├── test_recognition.py
    │   ├── test_batch_split.py
    │   ├── test_prices.py
    │   └── test_weather.py
    └── scripts/
        ├── seed_demo.py
        ├── migrate_legacy_data.py
        └── inspect_db.py
```

## Environment variables

See [`env.example`](../env.example). Notable ones:

- `JWT_SECRET_KEY` — rotating this invalidates all auth tokens.
- `QR_SIGNING_KEY` — rotating this invalidates **every** outstanding QR; every batch will need a new one minted before its next scan.
- `DATABASE_URL` — defaults to `sqlite:///herbchain.db`. Set to a `postgresql+psycopg2://...` URL for Postgres.
- `OPENWEATHER_API_KEY` — optional. If unset, `/api/v1/weather` returns a deterministic stubbed payload so the demo works offline.

## Production notes (local "production-ready")

- Run via `waitress` (Windows) or `gunicorn` (Linux/macOS), not Flask's dev server.
- Set strong `JWT_SECRET_KEY` and `QR_SIGNING_KEY`.
- Keep `CORS_ORIGINS` to an explicit list (not `*`) when exposing to the network.
- Back up `instance/herbchain.db` regularly — it's the entire state.
