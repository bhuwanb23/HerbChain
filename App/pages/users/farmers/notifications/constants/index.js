// Notification categories mirror the backend `category` field
// (backend/src/constants/notifications.js → NOTIFICATION_TEMPLATES).
export const NOTIFICATION_TYPES = {
  ALL: 'all',
  BATCH: 'batch',
  SHIPMENT: 'shipment',
  OWNERSHIP: 'ownership',
  LAB: 'lab',
  MANUFACTURER: 'manufacturer',
  RECALL: 'recall',
  USER: 'user',
  SECURITY: 'security',
  REPORTS: 'reports',
};

export const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'batch', label: 'Batches', icon: '🌿' },
  { id: 'shipment', label: 'Pickups', icon: '🚚' },
  { id: 'ownership', label: 'Transfers', icon: '🔄' },
  { id: 'lab', label: 'Lab Tests', icon: '🧪' },
  { id: 'manufacturer', label: 'Orders', icon: '🏭' },
  { id: 'recall', label: 'Recalls', icon: '⚠️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'user', label: 'Account', icon: '👤' },
  { id: 'reports', label: 'Reports', icon: '📊' },
];
