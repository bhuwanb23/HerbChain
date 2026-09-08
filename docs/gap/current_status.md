HerbChain — Project Status Overview

What It Is

HerbChain is an end-to-end Ayurvedic herbs supply chain management system. It tracks herbs from farm → lab → transporter → manufacturer → consumer, with full custody chain, QR-based traceability, lab testing, and anti-counterfeiting. Built for Ayush to eliminate stock manipulation, diversion, and lack of transparency.

Architecture

App/                    → React Native mobile app (Expo)
website/src/            → Admin web portal (React + Vite)
backend/                → Node.js + Express + Prisma (17 phases, 140+ models)
docs/                   → Phase specs, role docs, audit reports

────────────────────────────────────────────────────────────────────────────────

Backend (17 Phases — ✅ COMPLETE)

All 17 backend phases built, tested, 202/202 tests green:
- Auth/RBAC, Batches+QR, Transfers, Shipments+GPS+POD, Lab, Procurement/GRN, Products/Lineage, Consumer Verify, Admin Portal, Documents, Notifications, Blockchain, Analytics (10 domains), Offline Sync, Identification, Catalogue, Uploads

────────────────────────────────────────────────────────────────────────────────

Mobile App — Screen Status by Role

Farmer (20 screens wired)

┌───────────────┬───────────────────────┬───────────────┬──────────────────────────┐
│ Tab           │ Screen                │ Status        │ API                      │
├───────────────┼───────────────────────┼───────────────┼──────────────────────────┤
│ Home          │ FarmerHome            │ ✅ Done       │ BatchesAPI, TransfersAPI │
│ Batches       │ BatchList             │ ✅ Done       │ BatchesAPI.mine          │
│ Batches       │ BatchDetail           │ ✅ Done       │ BatchesAPI.detail        │
│ Batches       │ FarmerQR              │ ✅ Done       │ BatchesAPI.qr            │
│ Batches       │ HerbList              │ ✅ Exists     │ Old flow                 │
│ Batches       │ HerbRegister          │ ✅ Exists     │ Old flow                 │
│ Batches       │ HerbDetails           │ ✅ Exists     │ Old flow                 │
│ Batches       │ BatchSplit            │ ✅ Exists     │ Old flow                 │
│ Batches       │ SmartRegister         │ ✅ Exists     │ AI flow                  │
│ Batches       │ Catalogue             │ ✅ Exists     │ CatalogueAPI             │
│ Batches       │ CatalogueDetail       │ ✅ Exists     │ CatalogueAPI             │
│ Requests      │ TransferRequests      │ ✅ Done       │ TransfersAPI             │
│ Notifications │ FarmerNotifications   │ ⬜ Stub       │ —                        │
│ Profile       │ FarmerProfile         │ ✅ Exists     │ AuthContext              │
│ Profile       │ FarmProfile           │ ✅ Exists     │ Old flow                 │
│ Profile       │ CropCalendar          │ ✅ Exists     │ Old flow                 │
│ Profile       │ Weather               │ 🟡 ComingSoon │ Feature flag             │
│ Profile       │ Prices                │ 🟡 ComingSoon │ Feature flag             │
│ Profile       │ Training              │ 🟡 ComingSoon │ Feature flag             │
│ Profile       │ Payments              │ 🟡 ComingSoon │ Feature flag             │
│ Profile       │ Support/Settings/Sync │ ⬜ Stubs      │ —                        │
└───────────────┴───────────────────────┴───────────────┴──────────────────────────┘

Transporter (11 screens wired)

┌───────────────┬───────────────────────┬───────────────┬──────────────────────┐
│ Tab           │ Screen                │ Status        │ API                  │
├───────────────┼───────────────────────┼───────────────┼──────────────────────┤
│ Dashboard     │ TransporterHome       │ ✅ Done       │ ShipmentsAPI         │
│ Trips         │ TripsPage             │ ✅ Done       │ ShipmentsAPI.list    │
│ Trips         │ ShipmentDetail        │ ✅ Done       │ ShipmentsAPI.detail  │
│ Trips         │ PickupCapture         │ ✅ Done       │ ShipmentsAPI.pickup  │
│ Trips         │ DeliveryConfirm       │ ✅ Done       │ ShipmentsAPI.deliver │
│ Trips         │ DeliveryFailure       │ ✅ Done       │ ShipmentsAPI.fail    │
│ Scanner       │ Scanner               │ ⬜ Stub       │ —                    │
│ Notifications │ NotificationsScreen   │ ⬜ Stub       │ —                    │
│ Profile       │ TransporterProfile    │ ✅ Exists     │ —                    │
│ Profile       │ TransporterReports    │ 🟡 ComingSoon │ Feature flag         │
│ Profile       │ Support/Settings/Sync │ ⬜ Stubs      │ —                    │
└───────────────┴───────────────────────┴───────────────┴──────────────────────┘

Lab (12 screens wired)

┌──────────────┬─────────────────┬───────────┬───────────────────────┐
│ Tab          │ Screen          │ Status    │ API                   │
├──────────────┼─────────────────┼───────────┼───────────────────────┤
│ Dashboard    │ LabHome         │ ✅ Done   │ LabsAPI               │
│ Batches      │ LabQueue        │ ✅ Done   │ LabsAPI.queue         │
│ Batches      │ LabBatchDetail  │ ✅ Done   │ LabsAPI.detail        │
│ Batches      │ LabSampleCreate │ ✅ Done   │ LabsAPI.createSample  │
│ Batches      │ LabTestCreate   │ ✅ Done   │ LabsAPI.createTest    │
│ Batches      │ LabTestEntry    │ ✅ Done   │ LabsAPI.submitResults │
│ Batches      │ LabCertificate  │ ✅ Done   │ LabsAPI.issueCert     │
│ Batches      │ LabReject       │ ✅ Done   │ LabsAPI.reject        │
│ Testing      │ LabTesting      │ ✅ Exists │ Old flow              │
│ Certificates │ Certificates    │ ⬜ Stub   │ —                     │
│ Reports      │ LabReports      │ ✅ Exists │ Old flow              │
└──────────────┴─────────────────┴───────────┴───────────────────────┘

Manufacturer (18 screens wired)

┌─────────────┬──────────────────────────┬───────────┬─────────────────────────────┐
│ Tab         │ Screen                   │ Status    │ API                         │
├─────────────┼──────────────────────────┼───────────┼─────────────────────────────┤
│ Dashboard   │ ManufacturerHome         │ ✅ Done   │ ManufacturerAPI             │
│ Marketplace │ MarketplaceScreen        │ ✅ Done   │ ManufacturerAPI.marketplace │
│ Marketplace │ BatchDossierScreen       │ ✅ Done   │ ManufacturerAPI.detail      │
│ Marketplace │ GRNReceiveScreen         │ ✅ Done   │ ManufacturerAPI.receive     │
│ Inventory   │ InventoryScreen          │ ✅ Done   │ ManufacturerAPI.inventory   │
│ Products    │ ProductListScreen        │ ✅ Done   │ ProductsAPI.list            │
│ Products    │ ProductCreateScreen      │ ✅ Done   │ ProductsAPI.create          │
│ Products    │ ProductDetailScreen      │ ✅ Done   │ ProductsAPI.detail          │
│ Products    │ ProductLineageScreen     │ ✅ Done   │ ProductsAPI.lineage         │
│ Products    │ ProcurementTrackerScreen │ ✅ Done   │ ManufacturerAPI.requests    │
│ Products    │ RunListScreen            │ ✅ Done   │ ManufacturingAPI.list       │
│ Products    │ RunDetailScreen          │ ✅ Done   │ ManufacturingAPI.detail     │
│ Products    │ RecallImpactScreen       │ ✅ Done   │ ManufacturingAPI.impacts    │
│ Reports     │ ManufacturerReports      │ ✅ Exists │ —                           │
│ —           │ RawHerbManagement        │ ✅ Exists │ Old flow                    │
│ —           │ Production               │ ✅ Exists │ Old flow                    │
└─────────────┴──────────────────────────┴───────────┴─────────────────────────────┘

Admin (Mobile — 12 screens)

┌────────────┬──────────────────┬───────────┬─────────────────┐
│ Tab        │ Screen           │ Status    │ API             │
├────────────┼──────────────────┼───────────┼─────────────────┤
│ Dashboard  │ AdminHome        │ ✅ Done   │ AdminAPI        │
│ Users      │ UserManagement   │ ✅ Exists │ Old flow        │
│ Compliance │ CompliancePage   │ ✅ Exists │ Old flow        │
│ Reports    │ ReportsAnalytics │ ✅ Exists │ Old flow        │
│ Settings   │ SettingsScreen   │ ✅ Done   │ AdminAPI.health │
│ Settings   │ ProfileSettings  │ ✅ Exists │ —               │
│ Settings   │ IntegrationAPI   │ ✅ Exists │ —               │
│ Settings   │ SupportDispute   │ ✅ Exists │ —               │
└────────────┴──────────────────┴───────────┴─────────────────┘

Consumer (2 screens)

┌───────────────────┬───────────┬──────────────────────────────┐
│ Screen            │ Status    │ API                          │
├───────────────────┼───────────┼──────────────────────────────┤
│ ConsumerHome      │ ✅ Done   │ BatchesAPI.verify, VerifyAPI │
│ ConsumerDashboard │ ✅ Exists │ —                            │
└───────────────────┴───────────┴──────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────

Website (Admin Web Portal — 12 pages)

┌─────────────────┬─────────────┬───────────────────────────┐
│ Page            │ Status      │ API                       │
├─────────────────┼─────────────┼───────────────────────────┤
│ Dashboard       │ ✅ Migrated │ AdminAPI.portal.dashboard │
│ Users           │ ✅ Migrated │ AdminAPI.users.list       │
│ Trace           │ ✅ Migrated │ TraceabilityAPI           │
│ Settings        │ ✅ Migrated │ AdminAPI.health           │
│ Reports         │ 🟡 Old API  │ Needs migration           │
│ Compliance      │ 🟡 Old API  │ Needs migration           │
│ Alerts & Recall │ 🟡 Old API  │ Needs migration           │
│ Integrations    │ 🟡 Old API  │ Needs migration           │
│ Support         │ 🟡 Old API  │ Needs migration           │
│ Incentives      │ 🟡 Old API  │ Needs migration           │
│ Login           │ ✅ Working  │ AuthAPI                   │
└─────────────────┴─────────────┴───────────────────────────┘

────────────────────────────────────────────────────────────────────────────────

Summary Scorecard

┌──────────────────────┬───────┬────────────┬──────────────────┬───────────┐
│ Area                 │ Total │ Done       │ Stub/ComingSoon  │ Not Built │
├──────────────────────┼───────┼────────────┼──────────────────┼───────────┤
│ Mobile screens wired │ ~75   │ 52         │ 8                │ 15        │
│ Website pages        │ 12    │ 5 migrated │ 7 need migration │ 0         │
│ Backend phases       │ 17    │ 17 ✅      │ —                │ —         │
│ Backend tests        │ 202   │ 202 ✅     │ —                │ —         │
└──────────────────────┴───────┴────────────┴──────────────────┴───────────┘

Remaining Work (Phases A6–A9)

┌───────┬─────────────────────────────────────────────────────────────────────────────┬──────────────┐
│ Phase │ Scope                                                                       │ New Screens  │
├───────┼─────────────────────────────────────────────────────────────────────────────┼──────────────┤
│ A6    │ Shared screens: notifications center, settings, docs center, offline sync   │ ~5           │
│ A7    │ Admin web portal: migrate remaining 7 pages to P16 analytics                │ ~8 web pages │
│ A8    │ Consumer portal: product passport, authenticity, recall alerts, share       │ ~6           │
│ A9    │ Cleanup: prices/weather/crop decisions, E2E regression, old backend removal │ 0            │
└───────┴─────────────────────────────────────────────────────────────────────────────┴──────────────┘

Bottom line: Backend is fully done. Mobile has 52/75 screens wired with real API calls. Website has 5/12 pages migrated. Remaining work is A6 (shared stubs), A7 (web migration), A8 (consumer portal), A9 (cleanup). Want to continue with A6?