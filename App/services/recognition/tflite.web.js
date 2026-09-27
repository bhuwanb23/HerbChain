/**
 * Web-platform stub for `react-native-fast-tflite`.
 *
 * Metro redirects imports of the native module here when bundling for web
 * (see metro.config.js). The API mirrors the subset of fast-tflite used by
 * services/recognition/tflite.js; on web we simply report "unavailable" so
 * the app falls back to the catalogue picker + backend re-rank flow.
 */
export async function loadTensorflowModel() {
  return null;
}

export async function loadLlamaModel() {
  return null;
}

export const TensorflowModule = undefined;
export const LlamaModule = undefined;
