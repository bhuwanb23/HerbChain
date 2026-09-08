# Phase A8 — Consumer Portal

**Goal:** the public, no-login QR journey: scan → verification → digital product passport → origin/certs/journey → authenticity score → recall alerts → counterfeit detection → report a fake → share. Plus the **only real backend addition** in this plan (feedback / report-fake).
**Status:** ⬜ not started
**Depends on:** A0
**Backend:** P12/P13 ready (`verification.test.js` 11/11) except feedback/report-fake.

---

## Screens

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | QR Scan entry | `consumers/components/QRScanner.js` | `POST /api/v1/verify/scan` (public) | ⬜ |
| 2 | Product verification (✅ verified banner) | `ConsumerHome.js` / verify components | scan response payload | ⬜ |
| 3 | Digital Product Passport | new | `GET /api/v1/verify/product/:id` (verify path) | ⬜ |
| 4 | Manufacturer information | passport section | product payload | ⬜ |
| 5 | Ingredient information | passport section | product lineage | ⬜ |
| 6 | Origin view (farm locations, states) | `JourneyMap.js` | product lineage + batch GPS | ⬜ |
| 7 | Lab certification view | `Certifications.js` | cert payload | ⬜ |
| 8 | Supply chain journey timeline | `Timeline.js` | `GET /api/v1/verify/...` journey | ⬜ |
| 9 | Full traceability view | new | lineage endpoint | ⬜ |
| 10 | Authenticity score | new | scan response (P12 computes) | ⬜ |
| 11 | Sustainability info | new | species/geo payload | ⬜ |
| 12 | Recall & safety alerts | new | `GET /api/v1/verify/alerts` | ⬜ |
| 13 | Counterfeit detection warning | new | scan outcome INVALID/replay signals | ⬜ |
| 14 | Consumer feedback | **new + backend** | ⛏ add `POST /api/v1/verify/feedback` (small) | ⬜ |
| 15 | Report a fake product | **new + backend** | ⛏ add `POST /api/v1/verify/report-fake` (small) | ⬜ |
| 16 | Share verification | new | client-side share sheet + deep link | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Backend addition (small) | One migration-lite: `ConsumerFeedback` model (product_id nullable, scan ref, type feedback|fake_report, message, contact optional, status) + 2 public endpoints + tests. Keep to ~1 service file + routes + tests. | ⬜ |
| 2 | Scan flow | Camera → `verify/scan` → route to verified / counterfeit / recall states. | ⬜ |
| 3 | Passport + sections | Single scrollable passport screen with anchored sections (4–11) rather than 8 separate screens — matches docs' "4-5 screens" MVP count. | ⬜ |
| 4 | Alerts + counterfeit | Distinct visual states for recall (red) and suspicious scan (orange). | ⬜ |
| 5 | Feedback + report-fake | Form → new endpoints; admin sees rows via portal (A7 hook or simple admin list). | ⬜ |
| 6 | Share + multi-language | Share sheet with product deep link; verify i18n keys for consumer strings. | ⬜ |
| 7 | Smoke | Script: scan valid product QR → passport renders → scan tampered/invalid token → counterfeit state → submit report-fake → row exists. | ⬜ |
| 8 | Commit | similarity groups: backend addition / screens / smoke. | ⬜ |

## Acceptance criteria

- [ ] Full consumer journey works without login.
- [ ] Counterfeit + recall states visibly distinct and correct against seeded data.
- [ ] Feedback/report-fake persisted and visible admin-side.
- [ ] Backend regression still 202+ green (with new tests).
- [ ] `master_plan.md` index updated: A8 ✅.

## Risks / notes

- Keep the backend addition genuinely small — resist scope creep; anything bigger belongs in a future phase doc.
- Consumer screens must be aggressively light (public, mobile-web shareable) — no auth-gated calls.
