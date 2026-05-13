# HerbChain

End-to-end traceability for AYUSH herbs: every step from farmer to consumer is a
signed QR scan that atomically transfers ownership of a batch. Local-first,
SQLite-backed, no blockchain.

```
Farmer --QR--> Transporter --QR--> Lab --QR--> Transporter --QR--> Manufacturer --product QR--> Consumer
```

Each arrow is an authenticated scan that (a) verifies the QR's HMAC signature,
(b) invalidates the previous QR, (c) transfers ownership, (d) mints the next QR.

## What's in this repo

| Folder | Stack | What it is |
| --- | --- | --- |
| [`backend/`](backend/) | Flask 3 + SQLAlchemy + Flask-Migrate | REST API, auth, QR + transfer services, SQLite database. |
| [`App/`](App/) | React Native (Expo) | Mobile app, one home screen per role (farmer / transporter / lab / manufacturer / consumer / admin). |
| [`website/`](website/) | React + Vite + MUI | Admin dashboard: stats, batch traceability, user management, settings. |
| [`_archive/`](_archive/) | — | Old prototype and Hyperledger Fabric scaffold, kept for reference but not part of v1. |

## One-command demo (`make demo`)

If you have GNU make installed (Git Bash, WSL, msys, or `choco install make`):

```bash
make demo
```

That runs, in order:

1. `make install` — pip install + npm install for all three projects
2. `make migrate` — apply Alembic migrations to SQLite
3. `make seed` — seed 6 demo users and 3 demo batches (different phases)
4. `make run-backend` — start the Flask API on `:5000`

After it prints the credentials, open `website/` and `App/` in two more
terminals and run `make run-website` / `make run-app`.

### Windows-friendly (no make)

```powershell
./scripts/demo.ps1
```

Does the same thing using PowerShell — installs, migrates, seeds, then prints
the demo credentials. Start the website and app in separate terminals afterwards.

## Manual setup (3 terminals)

### Terminal 1 — backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate           # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp env.example .env                # tweak JWT_SECRET_KEY + QR_SIGNING_KEY for non-dev
cd server
flask --app app db upgrade         # apply migrations
python scripts/seed_demo.py --fresh
flask --app app run --host 0.0.0.0 --port 5000
# or, for prod-style: waitress-serve --listen=0.0.0.0:5000 app:app
```

### Terminal 2 — website

```bash
cd website
cp .env.example .env.local         # set VITE_API_BASE_URL if backend isn't on localhost:5000
npm install
npm run dev                        # http://localhost:5173
```

### Terminal 3 — mobile app

```bash
cd App
npm install
npx expo start
```

Open the Expo Go app on your phone (same Wi-Fi as the laptop) and scan the QR
shown in the terminal. The mobile client auto-detects the dev host; if the
backend lives elsewhere, edit `App/app.json` →  `expo.extra.API_BASE_URL`.

## Demo credentials

After `python scripts/seed_demo.py --fresh`:

| Email | Password | Role |
| --- | --- | --- |
| `farmer1@herbchain.local` | `farmerpass` | farmer |
| `transporter1@herbchain.local` | `transpass` | transporter |
| `lab1@herbchain.local` | `labpass` | lab |
| `manufacturer1@herbchain.local` | `mfgpass` | manufacturer |
| `consumer1@herbchain.local` | `conspass` | consumer |
| `admin@herbchain.local` | `adminpass` | admin |

The seeded batches:

- `HERB-…` (Ashwagandha) — currently `with_farmer`, ready for a transporter pickup.
- `HERB-…` (Tulsi) — `in_transit_to_lab`, transporter holds it.
- `HERB-…` (Brahmi) — went the whole way: farmer → transporter → lab (approved) → transporter → manufacturer → product `PROD-…`.

Trace the third one in the website at `/trace/<HERB-…>` to see the full timeline.

## Architecture in one screen

```
                 +-----------------+      +-----------------+
   Expo Go --->  |  React Native   |      |     Vite +      |
                 |   mobile app    |      |   React MUI     |  <--- browser
                 +--------+--------+      +--------+--------+
                          |                        |
                          v                        v
                 +-----------------------------------------+
                 |   Flask API (gunicorn / waitress)       |
                 |   /api/v1/* + /admin/* + /trace/...     |
                 +--------------------+--------------------+
                                      |
                                      v
                       +--------------+--------------+
                       |  SQLite (backend/.../*.db)  |
                       +-----------------------------+
```

Key design decisions are in [`backend/server/README.md`](backend/server/README.md):

- Schema split between `Herb` (immutable facts), `BatchState` (mutable current state), `BatchEvent` (append-only audit log).
- QR payloads are signed JWTs (`HMAC-SHA256` with `QR_SIGNING_KEY`); the old token dies the moment the next holder scans.
- All write endpoints are protected by Flask-JWT-Extended + role decorators (`@require_role`).
- One unified `POST /api/v1/batches/<id>/transfer` endpoint drives the state machine.

## Testing

```bash
cd backend
pytest              # auth, transfer flow, QR security, traceability
```

## Project layout

```
HerbChain/
├── App/                          # React Native (Expo) mobile app
├── backend/
│   ├── env.example
│   ├── pytest.ini
│   ├── requirements.txt
│   └── server/
│       ├── app.py                # Flask application factory
│       ├── models/               # SQLAlchemy models
│       ├── routes/               # auth / batches / lab_reports / products / traceability / admin
│       ├── schemas/              # marshmallow request schemas
│       ├── services/             # qr_service, transfer_service, traceability_service
│       ├── utils/                # auth decorators, response helpers
│       ├── tests/                # pytest suite
│       └── scripts/
│           ├── seed_demo.py
│           └── migrate_legacy_data.py
├── website/                      # React admin dashboard
├── scripts/                      # repo-wide demo scripts
├── _archive/
│   ├── prototype/                # original HTML/CSS prototype
│   └── blockchain/               # Hyperledger Fabric scaffold (out of v1 scope)
├── Makefile
└── README.md
```

## License

This project is part of the HerbChain SIH 2024 submission. Educational use.
