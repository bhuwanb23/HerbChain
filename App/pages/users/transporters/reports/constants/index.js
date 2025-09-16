export const REPORT_FILTERS = {
  periodOptions: [
    { id: 'day', label: 'Daily' },
    { id: 'week', label: 'Weekly' },
    { id: 'month', label: 'Monthly' },
  ],
  activePeriod: 'week',
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
  breakdown: [
    { id: 'base', label: 'Base Pay', subtitle: 'Regular trips', amount: 2840, color: '#2563EB', icon: 'currency-usd' },
    { id: 'bonus', label: 'Bonuses', subtitle: 'Performance rewards', amount: 420, color: '#F59E0B', icon: 'star-outline' },
    { id: 'eco', label: 'Eco Incentives', subtitle: 'Green driving', amount: 185, color: '#10B981', icon: 'leaf' },
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

export const CHARTS = {
  tripVolume: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [28, 35, 42, 38, 45, 32, 29],
  },
  deliveryPerformance: {
    onTime: 94,
    delayed: 6,
  },
};

export const RECEIPTS = [
  { id: 'TR-2024-001', date: 'Jan 15, 2024', route: 'Downtown Route', amount: 45.50 },
  { id: 'TR-2024-002', date: 'Jan 14, 2024', route: 'Express Delivery', amount: 62.30 },
  { id: 'TR-2024-003', date: 'Jan 13, 2024', route: 'Bulk Transport', amount: 89.75 },
];


