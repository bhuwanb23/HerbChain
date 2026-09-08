# 🌿 HerbChain — Complete Gap Analysis

Every missing, incomplete, stubbed, or deferred element across the entire project, organized by layer and severity.

---

## 🔴 CRITICAL GAPS (Block Core Value Proposition)

These are features described in the vision that directly impact HerbChain's primary promise of end-to-end traceability and trust.

### 1. Consumer Digital Passport (A8) — ~6 screens missing

This is the **public-facing trust layer** — the reason consumers and regulators will care about HerbChain. Currently almost non-existent.

| Missing Screen | What It Should Do | Status |
|---|---|---|
| **Product Passport View** | Full journey: Farmer → Transporter → Lab → Transporter → Manufacturer with timestamps, locations, certifications | ❌ Not built |
| **Authenticity Verification** | Clear ✅/❌ badge showing product is genuine, QR is valid, chain is unbroken | ❌ Not built |
| **Origin Story** | Harvest location (map), farmer info (anonymized), harvest date, cultivation type | ❌ Not built |
| **Lab Certificate Display** | View actual test results, purity, heavy metals, microbial, certificate PDF | ❌ Not built |
| **Recall Alert View** | Consumer sees if their product batch is under recall | ❌ Not built |
| **Share/Export Journey** | Share product passport via link, WhatsApp, QR | ❌ Not built |

**Current state:** Only `ConsumerHome` (basic verify) and `ConsumerDashboard` (exists but unwired) are present.

---

### 2. QR Scanner — Transporter (Core Ownership Transfer)

| Missing Screen | What It Should Do | Status |
|---|---|---|
| **Transporter Scanner** | Camera-based QR scan → validate active QR → confirm ownership → trigger transfer → deactivate old QR → activate new QR | ⬜ Stub |

**Why this is critical:** The entire dynamic ownership model depends on the transporter being able to scan QRs at pickup and delivery. Without this, the chain of custody breaks at the most important handoff points.

---

### 3. Notifications Center (A6) — All Roles

| Role | Missing Screen | Status |
|---|---|---|
| Farmer | FarmerNotifications | ⬜ Stub |
| Transporter | NotificationsScreen | ⬜ Stub |
| Lab | (no dedicated screen) | ❌ Missing |
| Manufacturer | (no dedicated screen) | ❌ Missing |
| Admin | (no dedicated screen) | ❌ Missing |

**What's needed:** Real-time alerts for transfer requests, shipment updates, lab results, certification completions, recall triggers, compliance violations. Backend Phase 11 is complete — the data exists but users can't see it.

---

### 4. Offline Sync UI (A6)

| Missing Component | What It Should Do | Status |
|---|---|---|
| **Offline Queue View** | Show pending transactions stored locally | ⬜ Stub |
| **Sync Status Indicator** | Visual indicator (online/offline/syncing) on all screens | ❌ Missing |
| **Manual Sync Trigger** | Button to force sync when connectivity returns | ❌ Missing |
| **Sync Conflict Resolution** | Handle cases where offline data conflicts with server state | ❌ Missing |

**Why this matters:** Farmers and transporters operate in rural areas with poor connectivity. Backend Phase 14 handles the logic, but without UI, users have no visibility into what's queued or synced.

---

## 🟠 MAJOR GAPS (Significant Functional Holes)

### 5. Admin Web Portal Migration (A7) — 7 pages

| Page | Current State | What's Needed |
|---|---|---|
| **Reports & Analytics** | 🟡 Old API | Migrate to P16 analytics (10 domains). Dashboards for batches, shipments, certifications, compliance, supply chain volume |
| **Compliance Monitoring** | 🟡 Old API | Real-time compliance violations, failed tests, unauthorized transfers, expired certifications |
| **Alerts & Recall** | 🟡 Old API | Trigger recalls, view recall impact across supply chain, notify affected consumers |
| **Integrations** | 🟡 Old API | Manage external system connections (AYUSH databases, other government portals) |
| **Support & Disputes** | 🟡 Old API | Handle stakeholder disputes, flagged transactions, investigation workflows |
| **Incentives** | 🟡 Old API | Farmer incentive programs, subsidy tracking, compliance rewards |
| **Blockchain Audit** | ❌ Not listed | View blockchain-anchored events, transaction hashes, ledger verification |

---

### 6. Settings & Profile Management (A6) — All Roles

| Missing Component | Roles Affected | Status |
|---|---|---|
| **Notification Preferences** | All | ⬜ Stub |
| **Language/Locale** | All | ❌ Missing |
| **Security (PIN/Biometric)** | All | ❌ Missing |
| **Account Management** | All | ⬜ Stub |
| **Data & Privacy** | All | ❌ Missing |
| **App Version/Update** | All | ❌ Missing |

---

### 7. Documents Center (A6)

| Missing Component | What It Should Do | Status |
|---|---|---|
| **Document Upload UI** | Upload lab certificates, compliance docs, invoices, POD images | ❌ Missing |
| **Document Viewer** | View uploaded documents across the supply chain | ❌ Missing |
| **Document Verification** | Verify document authenticity against blockchain records | ❌ Missing |

Backend Phase 10 (Documents) and Phase 17 (Uploads) are complete — the API exists but there's no UI.

---

### 8. GPS/Location Visualization

| Missing Component | What It Should Do | Status |
|---|---|---|
| **Shipment Map View** | Live map showing transporter location during transit | ❌ Missing |
| **Harvest Location Map** | Show where herbs were harvested on consumer passport | ❌ Missing |
| **Route History** | View complete transport route with timestamps | ❌ Missing |
| **Geofence Alerts** | Alert if shipment deviates from expected route | ❌ Missing |

Backend captures GPS data (Phase 4: Shipments+GPS+POD) but there's no map visualization anywhere.

---

### 9. Blockchain Proof Visualization

| Missing Component | What It Should Do | Status |
|---|---|---|
| **Transaction Hash Display** | Show blockchain hash for each critical event | ❌ Missing |
| **Ledger Verification** | Allow admin to verify on-chain records match database | ❌ Missing |
| **Proof of Ownership** | Cryptographic proof that a specific entity owned a batch at a specific time | ❌ Missing |
| **Blockchain Explorer Link** | Link to external blockchain explorer for public verification | ❌ Missing |

Backend Phase 12 (Blockchain) anchors events, but no UI exposes this to users or admin.

---

## 🟡 MODERATE GAPS (Polish & Completeness)

### 10. Farmer Role — Incomplete Screens

| Screen | Status | Issue |
|---|---|---|
| **HerbList / HerbRegister / HerbDetails** | ✅ Exists (old flow) | Not wired to new backend API — using legacy flow |
| **BatchSplit** | ✅ Exists (old flow) | Not wired to new API. Critical for when a farmer splits a large batch |
| **FarmProfile** | ✅ Exists (old flow) | Needs migration to new API |
| **CropCalendar** | ✅ Exists (old flow) | Needs migration |
| **Weather** | 🟡 Feature flag | No real data integration |
| **Prices** | 🟡 Feature flag | No market data integration |
| **Training** | 🟡 Feature flag | No content |
| **Payments** | 🟡 Feature flag | No payment integration |
| **Support** | ⬜ Stub | No functionality |

---

### 11. Transporter Role — Incomplete Screens

| Screen | Status | Issue |
|---|---|---|
| **TransporterReports** | 🟡 Feature flag | No trip history, earnings, or performance reports |
| **Support** | ⬜ Stub | No functionality |
| **Settings/Sync** | ⬜ Stub | No functionality |

---

### 12. Lab Role — Incomplete Screens

| Screen | Status | Issue |
|---|---|---|
| **Certificates** | ⬜ Stub | Cannot browse/view issued certificates |
| **LabTesting** | ✅ Exists (old flow) | Not wired to new API |
| **LabReports** | ✅ Exists (old flow) | Not wired to new API |

---

### 13. Manufacturer Role — Incomplete Screens

| Screen | Status | Issue |
|---|---|---|
| **ManufacturerReports** | ✅ Exists | Not clear if wired to new P16 analytics |
| **RawHerbManagement** | ✅ Exists (old flow) | Not wired to new API |
| **Production** | ✅ Exists (old flow) | Not wired to new API |

---

### 14. Admin Mobile — Incomplete Screens

| Screen | Status | Issue |
|---|---|---|
| **UserManagement** | ✅ Exists (old flow) | Not wired to new API |
| **CompliancePage** | ✅ Exists (old flow) | Not wired to new API |
| **ReportsAnalytics** | ✅ Exists (old flow) | Not wired to new P16 analytics |
| **ProfileSettings** | ✅ Exists | Basic |
| **IntegrationAPI** | ✅ Exists | Basic |
| **SupportDispute** | ✅ Exists | Basic |

---

## 🔵 MINOR GAPS (Enhancement & Hardening)

### 15. AI Identification Flow Polish

| Item | Status |
|---|---|
| Camera → Image capture → AI prediction → Confidence display → Farmer confirmation → Registration | Exists but unclear if fully polished |
| Clear disclaimer that AI ≠ Lab certification | Needs verification |
| Fallback for low-confidence predictions | Needs verification |
| Multiple species suggestion | Needs verification |

---

### 16. E2E Testing (A9)

| Item | Status |
|---|---|
| End-to-end regression tests | ❌ Not built |
| Full supply chain journey test (Farm → Consumer) | ❌ Not built |
| Cross-role integration tests | ❌ Not built |
| Performance/load tests | ❌ Not built |

---

### 17. Legacy Code Cleanup (A9)

| Item | Status |
|---|---|
| Old backend removal | ❌ Not started |
| Old flow deprecation in mobile | ❌ Not started |
| Dead code cleanup | ❌ Not started |
| API versioning/migration guide | ❌ Not started |

---

### 18. Role Switching & Onboarding

| Item | Status |
|---|---|
| Single app, role-based login | Exists but needs verification |
| Role-specific onboarding/tutorial | ❌ Missing |
| Role switcher (for multi-role users) | ❌ Missing |

---

## 📊 COMPLETE GAP SUMMARY

| Category | Total Items | ❌ Not Built | ⬜ Stub | 🟡 Old Flow/Flag | ✅ Done |
|---|---|---|---|---|---|
| **Consumer Portal (A8)** | 6 | 6 | 0 | 0 | 0 |
| **Shared Screens (A6)** | 12 | 7 | 5 | 0 | 0 |
| **Admin Web (A7)** | 7 | 1 | 0 | 6 | 0 |
| **Farmer Screens** | 9 | 4 | 1 | 4 | 0 |
| **Transporter Screens** | 4 | 2 | 2 | 0 | 0 |
| **Lab Screens** | 3 | 0 | 1 | 2 | 0 |
| **Manufacturer Screens** | 3 | 0 | 0 | 2 | 1 |
| **Admin Mobile** | 6 | 0 | 0 | 3 | 3 |
| **GPS/Maps** | 4 | 4 | 0 | 0 | 0 |
| **Blockchain UI** | 4 | 4 | 0 | 0 | 0 |
| **AI Polish** | 4 | 0 | 0 | 0 | 4* |
| **Testing/Cleanup (A9)** | 4 | 4 | 0 | 0 | 0 |
| **Onboarding** | 3 | 2 | 0 | 0 | 1 |
| **TOTAL** | **~69** | **~34** | **~9** | **~17** | **~9** |

---

## 🎯 PRIORITY RECOMMENDATION

```
IMMEDIATE (Blocks demo & core value):
  1. Transporter Scanner (ownership transfer is broken without it)
  2. Consumer Digital Passport (A8 — the "wow" factor)
  3. Notifications Center (A6 — all roles need it)

HIGH (Completes the platform):
  4. Offline Sync UI (A6)
  5. Admin Web Migration (A7 — 7 pages)
  6. Documents Center (A6)

MEDIUM (Polish & production-readiness):
  7. GPS/Map Visualization
  8. Blockchain Proof UI
  9. Old flow migration (Farmer, Lab, Admin mobile)
  10. Settings across all roles

LOW (Nice-to-have):
  11. Farmer extras (Weather, Prices, Training, Payments)
  12. E2E testing & cleanup (A9)
  13. Role onboarding
```

---

**Where do you want to start?** I can dive deep into any of these gaps — write the screens, design the flows, build the API integrations, or architect the solutions. Just point me at a priority. 🌿