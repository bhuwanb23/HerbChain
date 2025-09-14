export const TRIP_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const NOTIFICATION_TYPES = {
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const QUICK_ACTIONS = {
  START_TRIP: 'start-trip',
  SCAN_BATCH: 'scan-batch',
  CONFIRM: 'confirm',
};

export const COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  GRAY: '#6B7280',
  LIGHT_GRAY: '#9CA3AF',
};

export const GRADIENTS = {
  PRIMARY: ['#3B82F6', '#2563EB'],
  SUCCESS: ['#10B981', '#059669'],
  WARNING: ['#F59E0B', '#D97706'],
  ERROR: ['#EF4444', '#DC2626'],
};

export const DEFAULT_STATS = {
  completed: 8,
  active: 3,
  pending: 2,
};

export const SAMPLE_TRIPS = [
  {
    id: 'TR-8847',
    status: TRIP_STATUS.ACTIVE,
    route: 'Downtown Warehouse → Mall Center',
    progress: 75,
    eta: '14:30',
    distance: '8.2 km',
    customer: 'Mall Center',
  },
  {
    id: 'TR-8848',
    status: TRIP_STATUS.PENDING,
    route: 'Central Hub → Riverside District',
    progress: 100,
    scheduled: '15:00',
    distance: '12.5 km',
    customer: 'Riverside District',
  },
  {
    id: 'TR-8845',
    status: TRIP_STATUS.COMPLETED,
    route: 'North Station → Business Park',
    progress: 100,
    delivered: '12:45',
    customer: 'J. Smith',
  },
];

export const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Route Delay Alert',
    message: 'Traffic on Route A-102, +15 min delay expected',
    time: '2 min ago',
    type: NOTIFICATION_TYPES.WARNING,
  },
  {
    id: 2,
    title: 'Handover Ready',
    message: 'Package #TR-8847 ready for customer pickup',
    time: '5 min ago',
    type: NOTIFICATION_TYPES.INFO,
  },
  {
    id: 3,
    title: 'Fuel Low Warning',
    message: 'Consider refueling at next stop',
    time: '10 min ago',
    type: NOTIFICATION_TYPES.WARNING,
  },
];