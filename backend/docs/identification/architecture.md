# Phase 4: AI/ML Herb Identification — Implementation

Status: **LIVE** — implemented, tested (68/68 active suites), live-smoked (15/15).
Reconciles `docs/phase_4.md` against the redesigned schema. All code lives in
`backend` on the new modular layout.

## 1. Product rule (unchanged from spec)

Recognition **never certifies** a herb — the lab is the final scientific
authority. AI only helps farmers register faster and reduces manual mistakes.
That is why every failure path (quality, provider down, no plant) degrades to
manual entry, never to a blocked registration.

## 2. Engine decision (chosen with the product owner)

A **provider-agnostic gateway** (not a direct app→cloud call):

| Provider | When it runs | Notes |
|---|---|---|
| `gemini` | `RECOGNITION_PROVIDER=gemini` or `GEMINI_API_KEY` set | Gemini Vision (spec Stage 1), strict-JSON top-N output |
| `azure_custom_vision` | `RECOGNITION_PROVIDER=azure_custom_vision` or Azure env configured | Custom-trained ML classifier (spec Option 2 / Stage 3–4 path) |
| `mock` | No keys configured / `RECOGNITION_PROVIDER=mock` | Offline deterministic dev/test driver; rows visibly tagged `mock-classifier` so audits can never confuse it with real recognition |

All drivers implement one interface (`detect(buffer, {mimeType, topK, mock}) →
{predictions, model}`) and expose their model identity statically (the cache
key needs it before the first call). This is the "ML image recognition"
upgrade path too: a future local ONNX/TF.js model is just another driver.

## 3. Database (spec "Database Additions in Phase 4")

One additive migration, **4 new tables** (57 → 61 models): `96_identification.prisma`

| Spec table | Schema model | Notes |
|---|---|---|
| `ai_identifications` | `AiIdentification` | Farmer-facing attempt: quality verdict, top-N `predictions_json`, top species + confidence, **verdict band**, farmer decision (`accepted`, `selected_species_id`, `mismatch`, `rejected_reason`), `batch_id` link |
| `ai_requests` | `AiRequest` | Model-audit log per provider call: provider, model+version, latency, success/error, `is_cached`, image hash |
| `image_hashes` | `ImageHashCache` | sha256 → stored result keyed `(hash, provider, model, version)`, hit counter, TTL |
| `ai_feedback` | `AiFeedback` | Post-lab accuracy row (prediction vs lab-certified species) — written by the lab phase |
| `herb_aliases` | `SpeciesSynonym` (**already existed**) | The "never trust AI text" mapping table — every synonym row is a lookup key |

`AiIdentification.status`: `pending → confirmed | rejected` (+ `error` for
no-plant). Every detection, confirmation, mismatch and rejection is persisted
→ the training corpus for the custom AYUSH model (spec Stage 2–4).

## 4. Flow (spec workflow, as built)

```
POST /api/v1/identifications/detect        (multipart: file, metadata?, mock?*)
  ├─ decode/format gate          400 invalid_image
  ├─ quality gate                blur / too dark / too small  -> 422 image_quality
  │     (sharp: Laplacian edge energy + luminance + resolution)
  ├─ asset saved (audit + future batch image)
  ├─ daily limit                 spec 50/day/user -> 429 rate_limited
  ├─ image-hash cache hit?       -> reuse result, log is_cached=true
  ├─ provider call (gateway)     failure -> 503 ai_unavailable (manual fallback)
  ├─ species alias mapping       code/common/scientific/synonym -> master Species
  └─ persist AiRequest + AiIdentification(pending) [+ cache]

POST /api/v1/identifications/:id/confirm   {accepted | species | rejected_reason}
  ├─ accept top pick   -> confirmed, accepted=true,  mismatch=false
  ├─ change species    -> confirmed, accepted=false, mismatch=true   (training data)
  ├─ reject            -> rejected (+reason)
  └─ accept w/ unmapped top -> 400 (must pick from the catalogue)

POST /api/v1/batches     { ..., identification_id }
  └─ species derived from the confirmed identification (explicit species wins)
     analysed photo auto-attached as the primary herb_image (no double upload)
     identification.batch_id set; CREATED event records identification_id
     reuse of a linked identification -> 409

GET /api/v1/identifications/mine | / (admin, filterable) | /:id (owner/admin)
```

*mock hint is forwarded from the client ONLY when the active provider is `mock`.

## 5. What the schema already covered (no new work)

- **Confidence display rules** → `verdict` + constants (`>=90 high`, `70–89
  medium`, `<70 low`, unmapped → `manual`).
- **Image hash for integrity** → `sha256` stored on every AiRequest /
  AiIdentification (spec "Image Tampering Detection").
- **Rate limiting / AI request logging** → AiRequest row per call + DB count
  of today's rows (multi-instance safe).
- **AI is optional, batch is mandatory** → 503/422 paths leave the farmer on
  the manual form.
- **Provider/model metadata on every row** → model audits & accuracy reports
  later (spec "Model Metadata").

## 6. Environment

```
RECOGNITION_PROVIDER=            # "" (auto) | mock | gemini | azure_custom_vision
GEMINI_API_KEY=                  # enables the gemini driver
GEMINI_MODEL=                    # default gemini-1.5-flash
AZURE_CV_ENDPOINT=               # https://<name>.cognitiveservices.azure.com/
AZURE_CV_PREDICTION_KEY=
AZURE_CV_PROJECT_ID=
AZURE_CV_PUBLISHED_NAME=
RECOGNITION_TOP_K=3              # top-N predictions
RECOGNITION_MIN_DIM=1024         # spec minimum resolution
RECOGNITION_MIN_SHARPNESS=3      # Laplacian edge-energy threshold
RECOGNITION_MIN_BRIGHTNESS=25    # mean luminance (0-255)
RECOGNITION_DAILY_LIMIT=50       # spec 50 AI requests/day/user
RECOGNITION_CACHE_TTL_DAYS=30
```

## 7. Test coverage (20 new cases, `npm run test:identification`)

Quality gate (small/blurry/dark/corrupt), verdict bands, alias resolution
(common/scientific/synonym), unmapped-label manual path, no-plant, cache hit,
permission gate (transporter 403), confirm accept/change/reject, double
confirm 409, ownership scoping, history scoping, admin filter, and the two
full batch-link journeys (accept-top and farmer-changed). Full regression:
**68/68** (auth 38 + batches 10 + identification 20).

## 8. Deferred / flagged

- `AiFeedback` rows: written when the lab phase certifies a batch (model →
  lab accuracy report; spec "Accuracy Feedback System").
- "Multiple plants" / "no plant found" visual segmentation: needs a trained
  model — today only *no detection at all* (empty top-N) is handled.
- Real virus scanning of uploads: hook point is the storage driver
  (spec Security); not wired to a scanner yet.
- Custom AYUSH model training: this phase's persisted predictions +
  confirmations + (later) lab results are the dataset (spec Stage 2–4).
