export const SCANNER_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const BATCH_STATUS = {
  VALID: 'valid',
  INVALID: 'invalid',
  PENDING: 'pending',
};

export const SCANNER_CONFIG = {
  SCAN_DURATION: 2000,
  ANIMATION_DURATION: 300,
  PULSE_DURATION: 1000,
};

export const DEMO_BATCH_DATA = {
  herbType: 'Organic Basil',
  batchId: 'BT-2024-001',
  sourceFarmer: 'Green Valley Farm',
  timestamp: 'Jan 15, 2024 14:32',
};

export const ERROR_MESSAGES = {
  INVALID_BATCH: 'This batch appears to be adulterated or does not match our quality standards.',
  SCAN_FAILED: 'Unable to scan the QR code. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};
