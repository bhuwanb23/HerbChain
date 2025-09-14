export const NOTIFICATION_TYPES = {
  PAYMENT: 'payment',
  LAB: 'lab',
  LOGISTICS: 'logistics',
  POLICY: 'policy',
  ALL: 'all',
};

export const NOTIFICATION_SECTIONS = {
  PINNED: 'Pinned',
  RECENT: 'Recent',
  EARLIER: 'Earlier',
};

export const MOCK_NOTIFICATIONS = [
  // Pinned notifications
  {
    id: '1',
    type: 'payment',
    title: 'Payment Credited',
    message: '₹2,500 has been credited to your account for Order #ORD-2024-001',
    timestamp: '2 hours ago',
    isRead: false,
    isPinned: true,
    section: 'pinned',
  },
  
  // Recent notifications
  {
    id: '2',
    type: 'lab',
    title: 'Lab Test Results Ready',
    message: 'Your blood test results are now available. Tap to view detailed report.',
    timestamp: '4 hours ago',
    isRead: false,
    isPinned: false,
    section: 'recent',
  },
  {
    id: '3',
    type: 'logistics',
    title: 'QR Code Scanned',
    message: 'Your package QR was scanned by transporter. Expected delivery: Tomorrow',
    timestamp: '6 hours ago',
    isRead: false,
    isPinned: false,
    section: 'recent',
  },
  {
    id: '4',
    type: 'policy',
    title: 'AYUSH Scheme Update',
    message: 'New benefits available under AYUSH wellness program. Check eligibility now.',
    timestamp: '1 day ago',
    isRead: false,
    isPinned: false,
    section: 'recent',
  },
  
  // Earlier notifications
  {
    id: '5',
    type: 'payment',
    title: 'Payment Received',
    message: '₹1,200 payment confirmed for consultation booking',
    timestamp: '2 days ago',
    isRead: true,
    isPinned: false,
    section: 'earlier',
  },
  {
    id: '6',
    type: 'lab',
    title: 'Lab Appointment Confirmed',
    message: 'Your lab test appointment is scheduled for tomorrow at 10:00 AM',
    timestamp: '3 days ago',
    isRead: true,
    isPinned: false,
    section: 'earlier',
  },
];

export const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'payment', label: 'Payments', icon: '💰' },
  { id: 'lab', label: 'Lab Tests', icon: '🧪' },
  { id: 'logistics', label: 'Logistics', icon: '🚚' },
  { id: 'policy', label: 'AYUSH', icon: '📢' },
];
