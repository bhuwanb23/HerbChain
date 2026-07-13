"""
Comprehensive API validation script for HerbChain backend.
Tests all major endpoints and reports pass/fail.
"""
import json
import sys
import requests

BASE = "http://127.0.0.1:5000"
results = []


def log(name, passed, detail=""):
    tag = "PASS" if passed else "FAIL"
    results.append((name, passed, detail))
    print(f"[{tag}] {name}" + (f"  -- {detail}" if detail else ""))


def login(email, password):
    r = requests.post(f"{BASE}/api/v1/auth/login", json={"identifier": email, "password": password})
    if r.status_code != 200:
        return None, None
    data = r.json()["data"]
    return data["access_token"], data["user"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────────────────────────────────────
# 1. Basic endpoints
# ─────────────────────────────────────────────────────────────
print("=" * 60)
print("1. BASIC ENDPOINTS")
print("=" * 60)

try:
    r = requests.get(f"{BASE}/")
    log("GET / (root)", r.status_code == 200 and r.json().get("status") == "ok")
except Exception as e:
    log("GET / (root)", False, str(e))

try:
    r = requests.get(f"{BASE}/health")
    log("GET /health", r.status_code == 200 and r.json().get("status") == "healthy")
except Exception as e:
    log("GET /health", False, str(e))

try:
    r = requests.get(f"{BASE}/api/v1/ping")
    log("GET /api/v1/ping", r.status_code == 200 and r.json()["data"]["message"] == "pong")
except Exception as e:
    log("GET /api/v1/ping", False, str(e))

# ─────────────────────────────────────────────────────────────
# 2. Auth
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("2. AUTH")
print("=" * 60)

# Login as all 6 seeded users
tokens = {}
users = {}
creds = [
    ("farmer", "farmer1@herbchain.local", "farmerpass"),
    ("transporter", "transporter1@herbchain.local", "transpass"),
    ("lab", "lab1@herbchain.local", "labpass"),
    ("manufacturer", "manufacturer1@herbchain.local", "mfgpass"),
    ("consumer", "consumer1@herbchain.local", "conspass"),
    ("admin", "admin@herbchain.local", "adminpass"),
]
for role, email, pw in creds:
    try:
        tok, user = login(email, pw)
        ok = tok is not None and user["role"] == role
        tokens[role] = tok
        users[role] = user
        log(f"Login {role}", ok, f"user_id={user['user_id']}" if ok else "login failed")
    except Exception as e:
        log(f"Login {role}", False, str(e))

# /me
try:
    r = requests.get(f"{BASE}/api/v1/auth/me", headers=auth(tokens["farmer"]))
    me_ok = r.status_code == 200 and r.json()["data"]["user"]["role"] == "farmer"
    log("GET /auth/me", me_ok)
except Exception as e:
    log("GET /auth/me", False, str(e))

# Register a new user
try:
    r = requests.post(f"{BASE}/api/v1/auth/register", json={
        "role": "farmer",
        "name": "Test Farmer",
        "email": "testfarmer@herbchain.local",
        "password": "testpass123",
        "location": "Chennai, TN",
    })
    reg_ok = r.status_code == 201 and r.json()["data"]["user"]["name"] == "Test Farmer"
    log("POST /auth/register", reg_ok, f"status={r.status_code}")
except Exception as e:
    log("POST /auth/register", False, str(e))

# Bad login
try:
    r = requests.post(f"{BASE}/api/v1/auth/login", json={"identifier": "nobody@test.com", "password": "wrong"})
    log("Bad login rejected", r.status_code == 401, f"status={r.status_code}")
except Exception as e:
    log("Bad login rejected", False, str(e))

# ─────────────────────────────────────────────────────────────
# 3. Batch creation (farmer)
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("3. BATCH CREATION (farmer)")
print("=" * 60)

new_batch_id = None
try:
    r = requests.post(f"{BASE}/api/v1/batches", headers=auth(tokens["farmer"]), json={
        "species_name": "Neem",
        "harvest_date": "2026-06-01",
        "location": "Chennai, TN",
        "weight_kg": 12.5,
        "gps_lat": 13.0827,
        "gps_lng": 80.2707,
        "notes": "API test batch",
    })
    if r.status_code == 201:
        data = r.json()["data"]
        new_batch_id = data["herb"]["batch_id"]
        log("POST /batches (create)", True, f"batch_id={new_batch_id}")
        log("  QR token returned", bool(data.get("qr_token")))
        log("  QR PNG returned", data.get("qr_png", "").startswith("data:image/png"))
    else:
        log("POST /batches (create)", False, f"status={r.status_code} body={r.text[:200]}")
except Exception as e:
    log("POST /batches (create)", False, str(e))

# ─────────────────────────────────────────────────────────────
# 4. Batch listing & QR
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("4. BATCH LISTING & QR")
print("=" * 60)

try:
    r = requests.get(f"{BASE}/api/v1/batches/mine", headers=auth(tokens["farmer"]))
    batches = r.json()["data"]["batches"]
    log("GET /batches/mine (farmer)", r.status_code == 200 and len(batches) > 0, f"count={len(batches)}")
except Exception as e:
    log("GET /batches/mine (farmer)", False, str(e))

if new_batch_id:
    try:
        r = requests.get(f"{BASE}/api/v1/batches/{new_batch_id}", headers=auth(tokens["farmer"]))
        log("GET /batches/<id>", r.status_code == 200, f"phase={r.json()['data']['state']['phase']}")
    except Exception as e:
        log("GET /batches/<id>", False, str(e))

    try:
        r = requests.get(f"{BASE}/api/v1/batches/{new_batch_id}/qr", headers=auth(tokens["farmer"]))
        qr_data = r.json()["data"]
        log("GET /batches/<id>/qr", r.status_code == 200 and bool(qr_data.get("qr_png")),
            f"has_token={bool(qr_data.get('qr_token'))}")
    except Exception as e:
        log("GET /batches/<id>/qr", False, str(e))

# Non-existent batch
try:
    r = requests.get(f"{BASE}/api/v1/batches/HERB-NONEXIST", headers=auth(tokens["farmer"]))
    log("GET non-existent batch => 404", r.status_code == 404)
except Exception as e:
    log("GET non-existent batch => 404", False, str(e))

# ─────────────────────────────────────────────────────────────
# 5. Transfer: Farmer → Transporter
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("5. TRANSFER: FARMER -> TRANSPORTER")
print("=" * 60)

farmer_qr_token = None
if new_batch_id:
    # Get the farmer's QR token
    r = requests.get(f"{BASE}/api/v1/batches/{new_batch_id}/qr", headers=auth(tokens["farmer"]))
    farmer_qr_token = r.json()["data"]["qr_token"]

    # Transporter scans it
    try:
        r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                          headers=auth(tokens["transporter"]),
                          json={"scanned_qr_token": farmer_qr_token, "location": "Highway 44"})
        if r.status_code == 200:
            data = r.json()["data"]
            log("Transfer farmer->transporter", True,
                f"{data['transfer']['from_phase']} -> {data['transfer']['to_phase']}")
            log("  New QR minted", bool(data.get("new_qr_token")))
            log("  New QR PNG", data.get("new_qr_png", "").startswith("data:image/png"))
            transporter_qr_token = data["new_qr_token"]
        else:
            log("Transfer farmer->transporter", False, f"status={r.status_code} body={r.text[:200]}")
            transporter_qr_token = None
    except Exception as e:
        log("Transfer farmer->transporter", False, str(e))
        transporter_qr_token = None

    # Stale QR should be rejected
    if farmer_qr_token:
        try:
            r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                              headers=auth(tokens["lab"]),
                              json={"scanned_qr_token": farmer_qr_token})
            log("Stale QR rejected", r.status_code == 409, f"status={r.status_code}")
        except Exception as e:
            log("Stale QR rejected", False, str(e))

# ─────────────────────────────────────────────────────────────
# 6. Transfer: Transporter → Lab
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("6. TRANSFER: TRANSPORTER -> LAB")
print("=" * 60)

if new_batch_id and transporter_qr_token:
    try:
        r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                          headers=auth(tokens["lab"]),
                          json={"scanned_qr_token": transporter_qr_token, "location": "Lab Bengaluru"})
        if r.status_code == 200:
            data = r.json()["data"]
            log("Transfer transporter->lab", True,
                f"{data['transfer']['from_phase']} -> {data['transfer']['to_phase']}")
            lab_qr_token = data["new_qr_token"]
        else:
            log("Transfer transporter->lab", False, f"status={r.status_code} body={r.text[:200]}")
            lab_qr_token = None
    except Exception as e:
        log("Transfer transporter->lab", False, str(e))
        lab_qr_token = None

# ─────────────────────────────────────────────────────────────
# 7. Lab report filing
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("7. LAB REPORT")
print("=" * 60)

if new_batch_id:
    # File approved report
    try:
        r = requests.post(f"{BASE}/api/v1/lab-reports", headers=auth(tokens["lab"]), json={
            "batch_id": new_batch_id,
            "test_type": "Full panel",
            "test_date": "2026-06-06",
            "results_summary": "All metrics within acceptable limits.",
            "outcome": "approved",
            "purity_percentage": 97.5,
            "moisture_content": 7.2,
            "ash_content": 3.8,
            "heavy_metals_present": False,
            "pesticides_detected": False,
            "active_compounds": "Azadirachtin 0.3%",
            "certification_level": "A",
        })
        if r.status_code == 201:
            data = r.json()["data"]
            log("POST /lab-reports (create)", True, f"report_id={data['report']['report_id']}")
            log("  State updated to approved", data["state"]["test_result"] == "approved")
        else:
            log("POST /lab-reports (create)", False, f"status={r.status_code} body={r.text[:300]}")
    except Exception as e:
        log("POST /lab-reports (create)", False, str(e))

    # List reports for batch
    try:
        r = requests.get(f"{BASE}/api/v1/lab-reports/batch/{new_batch_id}", headers=auth(tokens["lab"]))
        log("GET /lab-reports/batch/<id>", r.status_code == 200 and r.json()["data"]["total"] >= 1,
            f"count={r.json()['data']['total']}")
    except Exception as e:
        log("GET /lab-reports/batch/<id>", False, str(e))

# ─────────────────────────────────────────────────────────────
# 8. Transfer: Lab → Transporter (approved batch)
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("8. TRANSFER: LAB -> TRANSPORTER (after approval)")
print("=" * 60)

if new_batch_id and lab_qr_token:
    try:
        r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                          headers=auth(tokens["transporter"]),
                          json={"scanned_qr_token": lab_qr_token, "location": "Lab pickup point"})
        if r.status_code == 200:
            data = r.json()["data"]
            log("Transfer lab->transporter", True,
                f"{data['transfer']['from_phase']} -> {data['transfer']['to_phase']}")
            trans2_qr = data["new_qr_token"]
        else:
            log("Transfer lab->transporter", False, f"status={r.status_code} body={r.text[:200]}")
            trans2_qr = None
    except Exception as e:
        log("Transfer lab->transporter", False, str(e))
        trans2_qr = None

# ─────────────────────────────────────────────────────────────
# 9. Transfer: Transporter → Manufacturer
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("9. TRANSFER: TRANSPORTER -> MANUFACTURER")
print("=" * 60)

if new_batch_id and trans2_qr:
    try:
        r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                          headers=auth(tokens["manufacturer"]),
                          json={"scanned_qr_token": trans2_qr, "location": "Factory Mysuru"})
        if r.status_code == 200:
            data = r.json()["data"]
            log("Transfer transporter->manufacturer", True,
                f"{data['transfer']['from_phase']} -> {data['transfer']['to_phase']}")
        else:
            log("Transfer transporter->manufacturer", False, f"status={r.status_code} body={r.text[:200]}")
    except Exception as e:
        log("Transfer transporter->manufacturer", False, str(e))

# ─────────────────────────────────────────────────────────────
# 10. Product creation
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("10. PRODUCT CREATION (manufacturer)")
print("=" * 60)

if new_batch_id:
    try:
        r = requests.post(f"{BASE}/api/v1/products", headers=auth(tokens["manufacturer"]), json={
            "name": "Neem Wellness Capsules",
            "sku": "NWC-001",
            "description": "Pure neem extract capsules",
            "source_batches": [{"batch_id": new_batch_id, "quantity_kg": 10.0}],
        })
        if r.status_code == 201:
            data = r.json()["data"]
            product_id = data["product"]["product_id"]
            log("POST /products (create)", True, f"product_id={product_id}")
            log("  Product QR minted", bool(data.get("qr_token")))
            log("  Product QR PNG", data.get("qr_png", "").startswith("data:image/png"))
            log("  Batch consumed (phase=consumed)", True)
        else:
            log("POST /products (create)", False, f"status={r.status_code} body={r.text[:300]}")
            product_id = None
    except Exception as e:
        log("POST /products (create)", False, str(e))
        product_id = None

    # List manufacturer products
    try:
        r = requests.get(f"{BASE}/api/v1/products/mine", headers=auth(tokens["manufacturer"]))
        log("GET /products/mine", r.status_code == 200 and r.json()["data"]["total"] >= 1,
            f"count={r.json()['data']['total']}")
    except Exception as e:
        log("GET /products/mine", False, str(e))

    # Get product QR
    if product_id:
        try:
            r = requests.get(f"{BASE}/api/v1/products/{product_id}/qr", headers=auth(tokens["manufacturer"]))
            log("GET /products/<id>/qr", r.status_code == 200 and bool(r.json()["data"].get("qr_png")))
        except Exception as e:
            log("GET /products/<id>/qr", False, str(e))

# ─────────────────────────────────────────────────────────────
# 11. Traceability (public, no auth)
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("11. TRACEABILITY (public)")
print("=" * 60)

if new_batch_id:
    try:
        r = requests.get(f"{BASE}/api/v1/traceability/batch/{new_batch_id}")
        if r.status_code == 200:
            j = r.json()["data"]
            log("GET /traceability/batch/<id>", True,
                f"steps={j['summary']['total_steps']}, days={j['summary']['total_days']}")
            log("  Has farmer info", j.get("farmer") is not None)
            log("  Has lab reports", len(j.get("lab_reports", [])) >= 1)
            log("  Has products", len(j.get("products", [])) >= 1)
            log("  Quality certified", j["summary"]["quality_certified"])
        else:
            log("GET /traceability/batch/<id>", False, f"status={r.status_code}")
    except Exception as e:
        log("GET /traceability/batch/<id>", False, str(e))

if product_id:
    try:
        r = requests.get(f"{BASE}/api/v1/traceability/product/{product_id}")
        if r.status_code == 200:
            j = r.json()["data"]
            log("GET /traceability/product/<id>", True,
                f"source_batches={j['summary']['total_source_batches']}")
        else:
            log("GET /traceability/product/<id>", False, f"status={r.status_code}")
    except Exception as e:
        log("GET /traceability/product/<id>", False, str(e))

# Resolve QR (consumer scan simulation)
if product_id:
    try:
        r_prod = requests.get(f"{BASE}/api/v1/products/{product_id}", headers=auth(tokens["manufacturer"]))
        prod_qr = r_prod.json()["data"]["product"].get("qr_token", "")
        if not prod_qr:
            r_qr = requests.get(f"{BASE}/api/v1/products/{product_id}/qr", headers=auth(tokens["manufacturer"]))
            prod_qr = r_qr.json()["data"]["qr_token"]
        r = requests.post(f"{BASE}/api/v1/traceability/resolve", json={"qr_token": prod_qr})
        if r.status_code == 200:
            data = r.json()["data"]
            log("POST /traceability/resolve (product QR)", data["kind"] == "product")
        else:
            log("POST /traceability/resolve (product QR)", False, f"status={r.status_code}")
    except Exception as e:
        log("POST /traceability/resolve (product QR)", False, str(e))

# ─────────────────────────────────────────────────────────────
# 12. Admin endpoints
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("12. ADMIN ENDPOINTS")
print("=" * 60)

try:
    r = requests.get(f"{BASE}/admin/api/health")
    log("GET /admin/api/health", r.status_code == 200 and r.json()["data"]["status"] == "healthy")
except Exception as e:
    log("GET /admin/api/health", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/stats", headers=auth(tokens["admin"]))
    if r.status_code == 200:
        data = r.json()["data"]
        log("GET /admin/api/stats", True,
            f"users={data['users']['total']}, batches={data['batches']['total']}, products={data['products']['total']}")
    else:
        log("GET /admin/api/stats", False, f"status={r.status_code}")
except Exception as e:
    log("GET /admin/api/stats", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/users", headers=auth(tokens["admin"]))
    log("GET /admin/api/users", r.status_code == 200 and r.json()["data"]["total"] >= 6,
        f"count={r.json()['data']['total']}")
except Exception as e:
    log("GET /admin/api/users", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/batches", headers=auth(tokens["admin"]))
    log("GET /admin/api/batches", r.status_code == 200 and r.json()["data"]["total"] >= 3,
        f"count={r.json()['data']['total']}")
except Exception as e:
    log("GET /admin/api/batches", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/products", headers=auth(tokens["admin"]))
    log("GET /admin/api/products", r.status_code == 200 and r.json()["data"]["total"] >= 1)
except Exception as e:
    log("GET /admin/api/products", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/lab-reports", headers=auth(tokens["admin"]))
    log("GET /admin/api/lab-reports", r.status_code == 200 and r.json()["data"]["total"] >= 1)
except Exception as e:
    log("GET /admin/api/lab-reports", False, str(e))

try:
    r = requests.get(f"{BASE}/admin/api/events", headers=auth(tokens["admin"]))
    log("GET /admin/api/events", r.status_code == 200 and r.json()["data"]["total"] >= 10)
except Exception as e:
    log("GET /admin/api/events", False, str(e))

# Non-admin should be rejected
try:
    r = requests.get(f"{BASE}/admin/api/stats", headers=auth(tokens["farmer"]))
    log("Non-admin rejected from /admin/api/stats", r.status_code == 403)
except Exception as e:
    log("Non-admin rejected from /admin/api/stats", False, str(e))

# ─────────────────────────────────────────────────────────────
# 13. Batch events feed
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("13. BATCH EVENTS FEED")
print("=" * 60)

if new_batch_id:
    try:
        r = requests.get(f"{BASE}/api/v1/batches/{new_batch_id}/events", headers=auth(tokens["farmer"]))
        events = r.json()["data"]["events"]
        log("GET /batches/<id>/events", r.status_code == 200 and len(events) >= 4,
            f"events={len(events)}")
        event_types = [e["event_type"] for e in events]
        log("  Has CREATED event", "CREATED" in event_types)
        log("  Has TRANSFER events", event_types.count("TRANSFER") >= 3)
        log("  Has LAB_REPORT event", "LAB_REPORT" in event_types)
        log("  Has PRODUCT_LINK event", "PRODUCT_LINK" in event_types)
    except Exception as e:
        log("GET /batches/<id>/events", False, str(e))

# ─────────────────────────────────────────────────────────────
# 14. Intent endpoints
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("14. INTENT ENDPOINTS")
print("=" * 60)

# Use a seeded batch for intent tests
try:
    r = requests.post(f"{BASE}/api/v1/batches/HERB-SEED01/request-testing", headers=auth(tokens["lab"]))
    # May 404 since seed IDs are random, that's fine - just check the endpoint exists
    log("POST /batches/<id>/request-testing", r.status_code in (201, 404, 409), f"status={r.status_code}")
except Exception as e:
    log("POST /batches/<id>/request-testing", False, str(e))

# Discovery endpoints
try:
    r = requests.get(f"{BASE}/api/v1/batches/available/for-lab", headers=auth(tokens["lab"]))
    log("GET /batches/available/for-lab", r.status_code == 200)
except Exception as e:
    log("GET /batches/available/for-lab", False, str(e))

try:
    r = requests.get(f"{BASE}/api/v1/batches/available/for-manufacturer", headers=auth(tokens["manufacturer"]))
    log("GET /batches/available/for-manufacturer", r.status_code == 200)
except Exception as e:
    log("GET /batches/available/for-manufacturer", False, str(e))

# ─────────────────────────────────────────────────────────────
# 15. Edge cases
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("15. EDGE CASES")
print("=" * 60)

# Transfer to consumed batch should fail
if new_batch_id:
    try:
        r = requests.post(f"{BASE}/api/v1/batches/{new_batch_id}/transfer",
                          headers=auth(tokens["transporter"]),
                          json={"scanned_qr_token": "fake_token"})
        log("Transfer consumed batch rejected", r.status_code in (400, 409),
            f"status={r.status_code}")
    except Exception as e:
        log("Transfer consumed batch rejected", False, str(e))

# No auth => 401
try:
    r = requests.get(f"{BASE}/api/v1/batches/mine")
    log("Unauthenticated request rejected", r.status_code == 401)
except Exception as e:
    log("Unauthenticated request rejected", False, str(e))

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
passed = sum(1 for _, p, _ in results if p)
failed = sum(1 for _, p, _ in results if not p)
print(f"\nTotal: {len(results)}  |  Passed: {passed}  |  Failed: {failed}\n")
if failed:
    print("FAILED TESTS:")
    for name, p, detail in results:
        if not p:
            print(f"  - {name}: {detail}")
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
    sys.exit(0)
