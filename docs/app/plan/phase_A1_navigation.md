# Phase A1 — Navigation Un-Orphaning

**Goal:** every existing screen file becomes reachable through proper role navigation (bottom tabs + stacks per `docs/app/overview.md`), with role-based route guards. Dead screens for un-built features (prices/weather) are parked behind a feature flag, not deleted.
**Status:** ✅ completed
**Depends on:** A0

---

## Why

60 screen files exist; 16 are routed. Users can't reach anything but role home pages. Wiring navigation is cheap and unlocks all later phases (each role phase then only fixes contracts inside already-reachable screens).

## Steps

| # | Step | Files | Detail | Status |
|---|---|---|---|---|
| 1 | Feature flag module | `App/constants/features.js` | `FEATURES = { prices: false, weather: false, crop_plans: true, trainings: false, payments: false }` — single place to park un-built backend features. | ✅ |
| 2 | Role tab scaffolds | `App/navigation/` | Create per-role tab navigators matching `overview.md` nav specs: Farmer (Home, Batches, Requests, Notifications, Profile), Transporter (Dashboard, Shipments, Scanner, Notifications, Profile), Lab (Dashboard, Batches, Testing, Certificates, Reports), Manufacturer (Dashboard, Marketplace, Inventory, Products, Traceability), Admin (Dashboard, Users, Batches, Compliance, Reports), Consumer (no tabs — single scan flow). | ✅ |
| 3 | Register orphaned screens as stacks inside tabs | `App/navigation/AppNavigator.js` | Every existing screen file gets a route name. Screens whose backend is missing (prices/weather/trainings/payments) render a "Coming soon" placeholder gated by `FEATURES`. | ✅ |
| 4 | Route guards | `App/navigation/AppNavigator.js`, `AuthContext` | Role → allowed tab set. Logged-out → Login/Register only. Wrong-role deep link → role home with a toast. | ✅ |
| 5 | Shared screen placeholders | `App/pages/shared/` | Create minimal `NotificationsScreen`, `SupportScreen`, `SettingsScreen`, `OfflineSyncScreen` stubs (empty states) so tabs don't crash — filled in A6. | ✅ |
| 6 | Verify on device/emulator | — | Walk each role's tab bar; confirm no crash on any route; deep-link `herbchain://batch/:id` opens batch detail. | ✅ |
| 7 | Commit | — | navigation / shared stubs / flags. No co-author. | ✅ |

## Target navigation map

```
Auth stack:        Login → Register → (role home)
Farmer tabs:       Home | Batches(HerbList,BatchSplit,Detail,QR,Timeline) | Requests | Notifications | Profile(FarmProfile,Catalogue,CropCalendar)
Transporter tabs:  Dashboard | Shipments(list,detail,accept) | Scanner(batch_scan,pickup,transfer) | Notifications | Profile(trips history)
Lab tabs:          Dashboard | Batches(queue,receive,detail) | Testing(samples,tests,results,review) | Certificates | Reports
Manufacturer tabs: Dashboard | Marketplace(batch detail,procure) | Inventory(GRN,stock,hold) | Products(create,list,lineage) | Traceability
Admin tabs:        Dashboard | Users | Batches(explorer) | Compliance(alerts,recall,investigation) | Reports
Consumer stack:    Scan → Verification → Passport → (tabs: Origin, Certs, Journey, Report)
```

## Acceptance criteria

- [ ] Every screen file reachable (except `FEATURES`-parked ones showing placeholder).
- [ ] Role guards enforced; wrong-role routes bounce.
- [ ] No crashes navigating all tabs for all 6 roles on emulator.
- [ ] `master_plan.md` index updated: A1 ✅.

## Risks / notes

- Some orphaned screens import dead APIs — they must degrade gracefully (empty state) until their phase rewrites them, never crash.
- Consumer flow is stack-only (no login) — separate navigator branch.
