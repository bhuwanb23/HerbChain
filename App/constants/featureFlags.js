/**
 * Feature flags — single switch for showing/hiding screens that aren't part of
 * the v1 core flow. Read from `expo.extra.FEATURE_FLAGS` in app.json so we can
 * toggle without a code change.
 *
 * v1 core = farmer register/show-QR, transporter scan/transfer, lab scan/report,
 * manufacturer scan/product, consumer traceability, admin overview.
 *
 * Every other screen (payments, trainings, notifications, reports, incentives)
 * is gated behind a flag and shows "Coming soon" or is hidden from nav.
 */
import Constants from 'expo-constants';

const extra =
  (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};

const DEFAULTS = {
  payments: false,
  trainings: false,
  notifications: false,
  reports: false,
  incentives: false,
  translations: false,
  prices: false,    // no backend module — hidden until A9 decision
  weather: false,   // no backend module — hidden until A9 decision
  crop_plans: true, // client-side only, uses species data
};

const fromConfig = {
  ...(extra.FEATURE_FLAGS || {}),
  translations: Boolean(extra.ENABLE_TRANSLATIONS),
};

export const FEATURE_FLAGS = Object.freeze({ ...DEFAULTS, ...fromConfig });

export function isEnabled(flag) {
  return Boolean(FEATURE_FLAGS[flag]);
}
