// Batch filter options
export const BATCH_FILTERS = {
  ALL: 'All Batches',
  TULSI: 'Tulsi',
  ASHWAGANDHA: 'Ashwagandha',
  NEEM: 'Neem',
};

export const HERB_FILTERS = {
  TULSI: 'Tulsi',
  ASHWAGANDHA: 'Ashwagandha',
  NEEM: 'Neem',
  BRAHMI: 'Brahmi',
};

export const LOCATION_FILTERS = {
  RAJASTHAN: 'Rajasthan',
  MAHARASHTRA: 'Maharashtra',
  GUJARAT: 'Gujarat',
  KARNATAKA: 'Karnataka',
};

export const STATUS_FILTERS = {
  PENDING: 'Pending',
  TESTING: 'Testing',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DELIVERED: 'Delivered',
};

// Timeline steps
export const TIMELINE_STEPS = [
  {
    id: 'verification',
    title: 'Verification',
    icon: 'checkmark',
    status: 'completed',
  },
  {
    id: 'testing',
    title: 'Testing',
    icon: 'flask',
    status: 'active',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    icon: 'shield-outline',
    status: 'pending',
  },
  {
    id: 'delivery',
    title: 'Delivery',
    icon: 'truck-outline',
    status: 'pending',
  },
];

// Mock batch data
export const MOCK_BATCHES = [
  {
    id: 'TUL-2024-001',
    name: 'TUL-2024-001',
    type: 'Tulsi - Premium Grade',
    farmer: 'Rajesh Kumar',
    region: 'Rajasthan',
    status: 'testing',
    received: '2 hours ago',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/0efedca586-20b0a7039c4d6d05118c.png',
    details: {
      weight: '50 kg',
      quality: 'Premium',
      batchNumber: 'TUL-2024-001',
      harvestDate: '2024-01-15',
      labReceived: '2024-01-16',
    },
  },
  {
    id: 'ASH-2024-007',
    name: 'ASH-2024-007',
    type: 'Ashwagandha Root',
    farmer: 'Priya Sharma',
    region: 'Maharashtra',
    status: 'approved',
    received: '1 day ago',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4f570a1f87-0aceb3d8cabd2312a2ec.png',
    details: {
      weight: '75 kg',
      quality: 'Standard',
      batchNumber: 'ASH-2024-007',
      harvestDate: '2024-01-10',
      labReceived: '2024-01-12',
    },
  },
  {
    id: 'NEE-2024-012',
    name: 'NEE-2024-012',
    type: 'Neem Leaves',
    farmer: 'Amit Patel',
    region: 'Gujarat',
    status: 'pending',
    received: '30 min ago',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c9abf213e7-ee4207663438c9c52cf1.png',
    details: {
      weight: '40 kg',
      quality: 'Organic',
      batchNumber: 'NEE-2024-012',
      harvestDate: '2024-01-18',
      labReceived: '2024-01-18',
    },
  },
];

// Status colors and styles
export const STATUS_CONFIG = {
  pending: {
    backgroundColor: '#DBEAFE',
    textColor: '#1E40AF',
    label: 'Pending',
  },
  testing: {
    backgroundColor: '#FFEDD5',
    textColor: '#9A3412',
    label: 'Testing',
  },
  approved: {
    backgroundColor: '#DCFCE7',
    textColor: '#166534',
    label: 'Approved',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
    textColor: '#DC2626',
    label: 'Rejected',
  },
  delivered: {
    backgroundColor: '#E0E7FF',
    textColor: '#3730A3',
    label: 'Delivered',
  },
};

// Quick actions
export const QUICK_ACTIONS = [
  {
    id: 'qr_scan',
    title: 'QR Scan',
    icon: 'qr-code-scanner',
    color: '#00BFFF',
    action: 'scan',
  },
  {
    id: 'batch_id',
    title: 'Batch ID',
    icon: 'tag',
    color: '#808080',
    action: 'manual',
  },
];
