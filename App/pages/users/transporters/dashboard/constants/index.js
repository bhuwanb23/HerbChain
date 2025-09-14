// Dashboard Data Constants
export const TRANSPORTER_INFO = {
  name: 'Rajesh Kumar',
  vehicleId: 'TN-01-AB-1234',
  status: 'Active',
  activeTrips: 2,
  totalTrips: 15,
  rating: 4.8,
};

export const STATUS_CARDS = [
  {
    id: 'pending-pickups',
    title: 'Pending Pickups',
    count: 3,
    icon: '📦',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    description: 'Ready for pickup',
  },
  {
    id: 'active-trips',
    title: 'Active Trips',
    count: 2,
    icon: '🚚',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'],
    description: 'In progress',
  },
  {
    id: 'deliveries',
    title: 'Deliveries',
    count: 5,
    icon: '📍',
    color: '#22c55e',
    gradient: ['#22c55e', '#16a34a'],
    description: 'Completed today',
  },
];

export const NOTIFICATION_TYPES = {
  DELAY: 'delay',
  HANDOVER: 'handover',
  INCENTIVE: 'incentive',
  ROUTE_UPDATE: 'route_update',
  EMERGENCY: 'emergency',
};

export const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: NOTIFICATION_TYPES.DELAY,
    title: 'Traffic Alert',
    message: 'Heavy traffic on Route A. Expected delay: 15 mins',
    timestamp: '2 min ago',
    isRead: false,
    priority: 'high',
    icon: '⚠️',
  },
  {
    id: 2,
    type: NOTIFICATION_TYPES.HANDOVER,
    title: 'Handover Confirmation',
    message: 'Package #1234 delivered successfully to Green Pharmacy',
    timestamp: '5 min ago',
    isRead: true,
    priority: 'medium',
    icon: '✅',
  },
  {
    id: 3,
    type: NOTIFICATION_TYPES.INCENTIVE,
    title: 'Bonus Earned',
    message: 'You earned ₹500 bonus for on-time delivery streak!',
    timestamp: '1 hour ago',
    isRead: true,
    priority: 'low',
    icon: '💰',
  },
  {
    id: 4,
    type: NOTIFICATION_TYPES.ROUTE_UPDATE,
    title: 'Route Optimization',
    message: 'New optimized route available. Save 8 minutes.',
    timestamp: '2 hours ago',
    isRead: false,
    priority: 'medium',
    icon: '🗺️',
  },
];

export const MAP_WIDGET_DATA = {
  currentLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Bangalore Central',
  },
  nextStop: {
    latitude: 12.9352,
    longitude: 77.6245,
    address: 'Green Pharmacy, Koramangala',
    distance: '8.2 km',
    eta: '25 mins',
  },
  routeProgress: 65, // percentage
};

export const QUICK_ACTIONS = [
  {
    id: 'start-trip',
    title: 'Start Trip',
    icon: '▶️',
    color: '#22c55e',
  },
  {
    id: 'scan-qr',
    title: 'Scan QR',
    icon: '📱',
    color: '#3B82F6',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    icon: '🚨',
    color: '#EF4444',
  },
  {
    id: 'fuel-log',
    title: 'Fuel Log',
    icon: '⛽',
    color: '#F59E0B',
  },
];

export const TRIP_STATS = {
  todayTrips: 5,
  weeklyTrips: 28,
  monthlyEarnings: 15400,
  averageRating: 4.8,
  onTimeDelivery: 94,
};
