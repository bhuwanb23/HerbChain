export const DELIVERY_STATES = {
  SCANNING: 'scanning',
  SCANNED: 'scanned',
  AUTHENTICATING: 'authenticating',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const AUTH_METHODS = {
  FINGERPRINT: 'fingerprint',
  SIGNATURE: 'signature',
};

export const DEMO_RECEIVER_DATA = {
  name: 'Dr. Sarah Chen',
  department: 'Processing Lab',
  id: 'LAB-2024-SC',
};

export const DEMO_BATCH_DATA = {
  batchId: 'BT-2024-0892',
  handoverTime: '14:32 PM',
  integrityStatus: 'verified',
};

export const DEMO_TRANSACTION_DATA = {
  transactionId: '#TXN-892-2024',
  dateTime: 'Dec 14, 2024 - 14:32',
  from: 'Collection Unit',
  to: 'Dr. Sarah Chen',
  authMethod: 'Fingerprint',
};

export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SCAN_FAILED: 'Unable to scan QR code. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

export const ANIMATION_DURATIONS = {
  SCAN_DURATION: 3000,
  STATUS_DISPLAY: 1000,
  PROCESSING: 2000,
  AUTO_DISMISS: 3000,
};
