// Trip status constants
export const TRIP_STATUS = {
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
};

export const STATUS_LABELS = {
  [TRIP_STATUS.PICKED_UP]: 'Picked Up',
  [TRIP_STATUS.IN_TRANSIT]: 'In Transit',
  [TRIP_STATUS.DELIVERED]: 'Delivered',
};

export const STATUS_COLORS = {
  [TRIP_STATUS.PICKED_UP]: '#10b981',
  [TRIP_STATUS.IN_TRANSIT]: '#3B82F6',
  [TRIP_STATUS.DELIVERED]: '#6B7280',
};

// Timeline event types
export const TIMELINE_EVENTS = {
  PICKUP: 'pickup',
  CHECKPOINT: 'checkpoint',
  CURRENT: 'current',
  DELIVERY: 'delivery',
};

export const EVENT_LABELS = {
  [TIMELINE_EVENTS.PICKUP]: 'Package Picked Up',
  [TIMELINE_EVENTS.CHECKPOINT]: 'Checkpoint',
  [TIMELINE_EVENTS.CURRENT]: 'Current Location',
  [TIMELINE_EVENTS.DELIVERY]: 'Delivery Complete',
};

// Mock trip data
export const MOCK_TRIP_DATA = {
  tripId: 'TR-24901',
  status: TRIP_STATUS.IN_TRANSIT,
  batchIds: ['BTH-001', 'BTH-002', 'BTH-003'],
  expectedDelivery: 'Today, 2:30 PM',
  compliance: 'Temperature Controlled',
  eta: '14:30',
  distance: '12.5 km',
  duration: '22 min',
  currentLocation: 'Main Street Bridge',
  pickupLocation: 'Warehouse A - Downtown',
  deliveryLocation: 'Customer Location',
};

// Mock timeline data
export const MOCK_TIMELINE = [
  {
    id: 1,
    type: TIMELINE_EVENTS.PICKUP,
    title: 'Package Picked Up',
    time: '11:45 AM',
    location: 'Warehouse A - Downtown',
    completed: true,
  },
  {
    id: 2,
    type: TIMELINE_EVENTS.CHECKPOINT,
    title: 'Checkpoint 1',
    time: '12:30 PM',
    location: 'Highway Junction',
    completed: true,
  },
  {
    id: 3,
    type: TIMELINE_EVENTS.CURRENT,
    title: 'Current Location',
    time: 'Now',
    location: 'Main Street Bridge',
    completed: false,
    isCurrent: true,
  },
  {
    id: 4,
    type: TIMELINE_EVENTS.DELIVERY,
    title: 'Delivery Complete',
    time: 'Expected 2:30 PM',
    location: 'Customer Location',
    completed: false,
  },
];

// Map route data
export const ROUTE_DATA = {
  startPoint: { x: 50, y: 150 },
  waypoint: { x: 180, y: 110 },
  currentPoint: { x: 250, y: 120 },
  endPoint: { x: 350, y: 80 },
};

// Emergency contact data
export const EMERGENCY_CONTACTS = {
  dispatch: '+1-555-0123',
  support: '+1-555-0456',
  emergency: '911',
};

// Action bar buttons
export const ACTION_BUTTONS = [
  {
    id: 'contact',
    label: 'Contact',
    icon: '📞',
    type: 'secondary',
  },
  {
    id: 'share',
    label: 'Share Location',
    icon: '📤',
    type: 'primary',
  },
];
