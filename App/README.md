# HerbChain — Mobile App

React Native (Expo) client for [HerbChain](../README.md). One tabbed
experience per role: **farmer, transporter, lab, manufacturer, admin,
consumer** — with JWT session persistence, QR scanning, GPS capture, offline
sync support, and AI-assisted herb identification.

**Stack:** React Native 0.81 · Expo SDK 54 · React Navigation 6 · AsyncStorage · react-native-fast-tflite

## Run it

```bash
cd App
npm install
npx expo start
```

Then open with [Expo Go](https://expo.dev/go) (scan the terminal QR) or press
`a` / `i` for an emulator. The backend must be running — see the root README.

**API base URL:** auto-resolves the Expo dev host (LAN IP on devices,
`10.0.2.2` on Android emulators). To override, set `expo.extra.API_BASE_URL`
in `app.json` or pass it at build time via `expo.extra`.

## Feature map by role

| Role | Screens |
| --- | --- |
| **Farmer** | Home, batch list/detail, QR display, transfer requests, smart registration (AI ID), catalogue (25 AYUSH species), batch splitting, farm profile, crop calendar |
| **Transporter** | Dashboard, trips, shipment detail + map, pickup capture, delivery confirm/failure |
| **Lab** | Dashboard, intake queue, batch detail, sample creation, test entry, two-level review, certificates, rejection |
| **Manufacturer** | Dashboard, certified-batch marketplace, batch dossier, GRN receive, inventory, products, lineage, procurement tracker, production runs, recall impact |
| **Admin** | Dashboard, user management, compliance, reports, settings |
| **Consumer** | QR verification, digital product passport, origin story, lab certificate |

Screen-level wiring status (what talks to the real API vs. stubs) is tracked
in [`docs/gap/current_status.md`](../docs/gap/current_status.md).

## AI herb recognition (hybrid)

1. **On-device** — `App/services/recognition/tflite.js` runs
   `react-native-fast-tflite` with the model in `assets/models/`
   (drop in `plant_classifier.tflite` + `LABELS.txt` and build a custom dev
   client; plain Expo Go reports "unavailable" and falls back).
2. **Backend re-rank** — candidates are re-ranked against the AYUSH species
   catalogue via `POST /api/v1/identifications/detect` (fuzzy synonym
   matching), then the farmer confirms before batch registration.
3. **Fallback** — no model? The catalogue picker drives the same backend flow.

## Structure

```
App/
├── App.js               # providers: SafeArea → Auth
├── navigation/          # role-guarded tab navigators (AppNavigator.js)
├── pages/
│   ├── login/           # login + registration
│   ├── shared/          # notifications, support, settings, sync, docs
│   └── users/           # farmer/ transporter/ lab/ manufacturer/ admin/ consumer/
├── contexts/            # AuthContext (AsyncStorage session), NetworkContext
├── services/
│   ├── apiClient.js     # fetch wrapper ({data,error} envelope) + typed APIs
│   └── recognition/     # TFLite wrapper
├── language/            # i18n scaffolding
└── assets/models/       # optional plant_classifier.tflite + LABELS.txt
```

## Configuration

Feature flags and API config live in `app.json` under `expo.extra`
(`FEATURE_FLAGS`, `ENABLE_TRANSLATIONS`, `API_BASE_URL`). Camera, location,
and photo permissions are pre-declared for iOS/Android.
