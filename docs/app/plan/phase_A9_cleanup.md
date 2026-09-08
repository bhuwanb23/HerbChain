# Phase A9 — Scope Decisions, Retirement & Regression Harness

**Goal:** close out the plan: decide build-or-cut for the three backend-less features, retire the old Flask `backend/`, and leave behind a repeatable E2E verification harness so future changes can't silently break the app↔backend contract.
**Status:** ⬜ not started
**Depends on:** A2–A8 complete

---

## Work items

| # | Item | Detail | Status |
|---|---|---|---|
| 1 | Prices module decision | Options: (a) build small `prices` module (mandi price feed, admin-entered or scraped) + farmer Prices screen goes live; (b) cut → delete Prices screen + `PricesAPI`. Recommend (a)-lite: admin-entered reference prices per species, one endpoint, one screen. | ⬜ |
| 2 | Weather module decision | Options: (a) integrate a weather provider (needs API key + account); (b) cut feature flag off. Requires user decision + possibly a service signup — do **not** integrate without asking. | ⬜ |
| 3 | Crop plans decision | Current client-side crop calendar + species data may be enough. If server persistence wanted, it's a small `crop_plans` table + CRUD. Decide based on A3 usage. | ⬜ |
| 4 | Trainings / payments screens | Docs don't spec them as core; likely cut or defer. Confirm with user. | ⬜ |
| 5 | Flask `backend/` retirement | Once zero front-end calls hit it: mark deprecated (README note), stop maintaining, plan deletion in a separate commit after a soak period. Verify nothing in CI/deploy references it. | ⬜ |
| 6 | E2E regression harness | `scripts/e2e_journey.js` (node): the golden-path story against a fresh seeded DB — farmer registers → transporter moves → lab certifies → manufacturer produces → consumer verifies → admin sees analytics. Reuses live-smoke patterns from P16/P17. Wire into `npm test` as optional `npm run e2e`. | ⬜ |
| 7 | Docs final pass | Update `docs/app/AUDIT_REPORT.md` statuses to final; write `docs/app/handover.md` (how to run everything, seeded accounts, ports). | ⬜ |
| 8 | Commit | similarity groups. | ⬜ |

## Acceptance criteria

- [ ] All four scope decisions made and recorded here (with rationale).
- [ ] `backend/` either deleted or explicitly deprecated with a date.
- [ ] `npm run e2e` green end-to-end journey.
- [ ] Handover doc exists; a new dev can run backend + app + web from it in <10 minutes.
- [ ] `master_plan.md` index updated: A9 ✅ → plan complete.

## Risks / notes

- Weather provider integration needs an account/credential — always ask the user first (use service discovery, never integrate from memory).
- Flask retirement should be a deliberate, announced step — keep the code one `git checkout` away.
