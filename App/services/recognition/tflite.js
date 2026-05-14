/**
 * Thin wrapper around `react-native-fast-tflite` for on-device plant ID.
 *
 * The model file is expected at App/assets/models/plant_classifier.tflite, and
 * a matching `LABELS.txt` (one class per line) at the same path. Both are
 * loaded lazily so plain Expo Go (no native module) gracefully reports
 * "unavailable" and the app falls back to a labels-only flow on the backend.
 *
 * Public API:
 *     isAvailable()                 -> boolean
 *     recognizeImage(uri, topK=5)   -> [{label, score}]
 *     getStatus()                   -> { available, reason, modelReady }
 */
import { Platform } from 'react-native';

let _tflite = null;          // module reference, if successfully imported
let _model = null;           // loaded model handle
let _labels = null;          // string[]
let _loadAttempted = false;
let _lastReason = null;

function _tryImportTflite() {
  if (_tflite || _lastReason === 'no_module') return _tflite;
  try {
    // require() so Metro doesn't try to resolve it at bundle time for Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _tflite = require('react-native-fast-tflite');
    return _tflite;
  } catch (err) {
    _lastReason = 'no_module';
    return null;
  }
}

function _tryLoadLabels() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const labelsAsset = require('../../assets/models/LABELS.txt');
    if (typeof labelsAsset === 'string') {
      _labels = labelsAsset.split('\n').map((s) => s.trim()).filter(Boolean);
    } else if (labelsAsset && labelsAsset.default) {
      _labels = String(labelsAsset.default)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch (_err) {
    _labels = null;
  }
}

async function _loadModelOnce() {
  if (_loadAttempted) return _model;
  _loadAttempted = true;
  const mod = _tryImportTflite();
  if (!mod) return null;
  try {
    _tryLoadLabels();
    // The require returns the asset descriptor (number id), which fast-tflite supports.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const modelAsset = require('../../assets/models/plant_classifier.tflite');
    _model = await mod.loadTensorflowModel(modelAsset);
    return _model;
  } catch (err) {
    _lastReason = `load_failed:${err?.message || err}`;
    return null;
  }
}

export function isAvailable() {
  return Boolean(_tryImportTflite());
}

export function getStatus() {
  const available = isAvailable();
  return {
    available,
    reason: available ? null : _lastReason || 'unsupported_platform',
    modelReady: Boolean(_model),
    platform: Platform.OS,
  };
}

/**
 * Run the on-device model against `imageUri`. Returns a top-K array
 * of `{ label, score }`. If the model isn't available, returns an empty
 * array — callers should then prompt the user to pick from the catalogue.
 *
 * NOTE: the actual TFLite preprocessing pipeline depends on the model
 * input signature. For now we just attempt to invoke; full preprocessing
 * (resize -> Uint8Array -> normalize) is platform-specific and gated on
 * the user dropping in a real model. The function is structured so the
 * preprocessing can be added without callers changing.
 */
// eslint-disable-next-line no-unused-vars
export async function recognizeImage(imageUri, topK = 5) {
  const model = await _loadModelOnce();
  if (!model || !_labels) {
    return [];
  }
  // Preprocessing intentionally omitted until a real model is bundled.
  // Returning [] forces the SmartRegister screen to fall back to its
  // "pick from catalogue" flow, which still talks to the backend re-ranker
  // (the catalogue strings themselves count as candidates).
  return [];
}
