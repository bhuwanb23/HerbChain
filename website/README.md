# HerbChain — Admin Web Portal

The AYUSH regulatory control tower for [HerbChain](../README.md): dashboards,
traceability exploration, user management, compliance, investigations,
recalls, and blockchain governance.

**Stack:** React 19 · Vite 7 · MUI 7 · Tailwind CSS 4 · Chart.js · Leaflet · React Router 7

## Quick start

```bash
# backend must be running first — see the root README
cd website
npm install
npm run dev        # http://localhost:5173
```

The API base URL defaults to `http://<window-host>:5000` and can be overridden
with `VITE_API_BASE_URL` in a `.env.local` file:

```
VITE_API_BASE_URL=http://192.168.1.10:5000
```

Sign in with the seeded admin account (`admin@herbchain.in` / `Admin@123456`
after `npm run seed` in `backend/`) — see the root README for all demo roles.

## Pages

| Route | Page | Status |
| --- | --- | --- |
| `/` | Dashboard — supply-chain KPIs, state filter | ✅ migrated to P13 portal API |
| `/trace` | Batch/product traceability explorer + consumer-passport resolve | ✅ migrated to P10/P12 |
| `/users` | User management (approve, suspend, roles) | ✅ migrated to P2 admin API |
| `/blockchain` | Ledger explorer — events, nodes, contracts, audit | ✅ P12 |
| `/investigations` | Investigation case list & creation | ✅ P13 |
| `/compliance` | Compliance alerts + rule engine | 🟡 legacy API, needs migration |
| `/recall` | Alerts & recalls | 🟡 legacy API |
| `/reports` | Reports & schedules | 🟡 legacy API |
| `/support` | Support tickets | 🟡 legacy API |
| `/integrations` | API/integration settings | 🟡 legacy API |
| `/incentives` | Incentives & funding | 🟡 legacy API |
| `/settings` | System settings + health | ✅ |

Routes are role-guarded via `RequireAuth` (`src/App.jsx`); sensitive pages
require the `admin` role.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (react-hooks + react-refresh rules) |

## Structure

```
src/
├── App.jsx            # router, auth guards, theme
├── components/        # header & shared chrome
├── contexts/          # AuthContext (JWT session persistence)
├── pages/             # one directory per page
└── services/
    └── apiClient.js   # fetch wrapper ({data,error} envelope) + typed APIs
```

## API contract

All calls go through `src/services/apiClient.js`, which unwraps the backend's
`{ data, error }` envelope and throws `ApiError` on failure. Typed helpers
(`AuthAPI`, `AdminAPI`, `AnalyticsAPI`, `BlockchainAPI`, …) mirror the backend
route map — see the root README's [API surface](../README.md#api-surface).
