export const REPORT_FILTERS = {
  periodOptions: [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ],
  activePeriod: 'month',
};

export const ANALYTICS_SUMMARY = {
  totalTrips: 128,
  successRate: 92,
  avgDeliveryTime: '42m',
  distanceCoveredKm: 1842,
};

export const EARNINGS = {
  total: 128450,
  pending: 18450,
  bonuses: 12400,
  trend: [
    { label: 'W1', value: 18000 },
    { label: 'W2', value: 22000 },
    { label: 'W3', value: 26500 },
    { label: 'W4', value: 31500 },
  ],
};

export const COMPLIANCE = {
  compliantRate: 88,
  failedDeliveries: 5,
  disputes: 2,
  reasons: [
    { id: 'delay', label: 'Delay beyond SLA', count: 3 },
    { id: 'geo', label: 'Out of geofence', count: 2 },
  ],
  blockchainLogs: [
    { id: '0x1', hash: '0x9cf...ab12', note: 'Batch BT-2024-001 handover' },
    { id: '0x2', hash: '0x7de...c9f3', note: 'Trip TRIP-003 completion' },
  ],
};

export const IMPACT = {
  co2SavedKg: 146.3,
  badges: [
    { id: 'eco', label: 'Eco Route', color: '#10B981' },
    { id: 'ontime', label: 'On-Time', color: '#3B82F6' },
  ],
};


