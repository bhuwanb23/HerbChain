// Lab status constants
export const LAB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  URGENT: 'urgent',
};

// Test result types
export const TEST_TYPES = {
  MOISTURE_CONTENT: 'moisture_content',
  PESTICIDE_RESIDUE: 'pesticide_residue',
  PHYTOCHEMICAL_LEVEL: 'phytochemical_level',
  HEAVY_METALS: 'heavy_metals',
  MICROBIAL_COUNT: 'microbial_count',
};

// AYUSH standards
export const AYUSH_STANDARDS = {
  MOISTURE_CONTENT: { min: 5, max: 12 },
  PESTICIDE_RESIDUE: { max: 0.05 },
  PHYTOCHEMICAL_LEVEL: { min: 80 },
  HEAVY_METALS: { max: 0.01 },
  MICROBIAL_COUNT: { max: 1000 },
};

// Notification types
export const NOTIFICATION_TYPES = {
  SYSTEM_ALERT: 'system_alert',
  COMPLIANCE_FAILED: 'compliance_failed',
  RETEST_REQUEST: 'retest_request',
  URGENT_REQUEST: 'urgent_request',
  BATCH_APPROVED: 'batch_approved',
  BATCH_REJECTED: 'batch_rejected',
};

// Issue types
export const ISSUE_TYPES = {
  FARMER: 'farmer',
  TRANSPORTER: 'transporter',
  COMPLIANCE: 'compliance',
  TECHNICAL: 'technical',
  DISPUTE: 'dispute',
};

// Mock lab data
export const MOCK_LAB_DATA = {
  totalBatches: 156,
  pendingBatches: 8,
  urgentRequests: 3,
  completedAnalyses: 145,
  averageQualityScore: 89.5,
  labName: 'Green Herbs Testing Lab',
  labTechnician: 'Dr. Priya Sharma',
};

// Mock pending batches
export const MOCK_PENDING_BATCHES = [
  {
    id: 'BATCH-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    region: 'Madhya Pradesh',
    priority: 'high',
    receivedDate: '2024-01-15',
    status: 'pending',
  },
  {
    id: 'BATCH-002',
    herbType: 'Tulsi',
    farmer: 'Priya Sharma',
    region: 'Uttar Pradesh',
    priority: 'medium',
    receivedDate: '2024-01-14',
    status: 'pending',
  },
  {
    id: 'BATCH-003',
    herbType: 'Neem',
    farmer: 'Amit Singh',
    region: 'Rajasthan',
    priority: 'low',
    receivedDate: '2024-01-13',
    status: 'pending',
  },
];

// Mock urgent requests
export const MOCK_URGENT_REQUESTS = [
  {
    id: 'URGENT-001',
    type: 'Fast-track Testing',
    herbType: 'Turmeric',
    farmer: 'Suresh Patel',
    deadline: '2024-01-16',
    reason: 'Export deadline',
    priority: 'urgent',
  },
  {
    id: 'URGENT-002',
    type: 'Retest Request',
    herbType: 'Ginger',
    farmer: 'Meera Devi',
    deadline: '2024-01-17',
    reason: 'Previous test failed',
    priority: 'urgent',
  },
];

// Mock completed analyses
export const MOCK_COMPLETED_ANALYSES = [
  {
    id: 'ANALYSIS-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    status: 'approved',
    completedDate: '2024-01-15',
    qualityScore: 95,
  },
  {
    id: 'ANALYSIS-002',
    herbType: 'Tulsi',
    farmer: 'Priya Sharma',
    status: 'approved',
    completedDate: '2024-01-14',
    qualityScore: 88,
  },
  {
    id: 'ANALYSIS-003',
    herbType: 'Neem',
    farmer: 'Amit Singh',
    status: 'rejected',
    completedDate: '2024-01-13',
    qualityScore: 65,
  },
];

// Mock notifications
export const MOCK_NOTIFICATIONS = [
  {
    id: 'NOTIF-001',
    type: 'system_alert',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Jan 20, 2024 from 2:00 AM to 4:00 AM',
    timestamp: '2024-01-15 10:30',
    isRead: false,
  },
  {
    id: 'NOTIF-002',
    type: 'compliance_failed',
    title: 'Compliance Alert',
    message: 'Batch BATCH-003 failed AYUSH standards - Pesticide residue detected',
    timestamp: '2024-01-15 09:15',
    isRead: false,
  },
  {
    id: 'NOTIF-003',
    type: 'retest_request',
    title: 'Retest Request',
    message: 'Farmer Priya Sharma requested retest for Batch BATCH-002',
    timestamp: '2024-01-15 08:45',
    isRead: true,
  },
];

// Mock test results
export const MOCK_TEST_RESULTS = {
  moistureContent: 8.5,
  pesticideResidue: 0.02,
  phytochemicalLevel: 95.2,
  heavyMetals: 0.001,
  microbialCount: 100,
};

// Mock analytics data
export const MOCK_ANALYTICS = {
  contaminantTrends: [
    { month: 'Jan', pesticide: 2.1, heavyMetals: 0.8, microbial: 1.2 },
    { month: 'Feb', pesticide: 1.8, heavyMetals: 0.6, microbial: 0.9 },
    { month: 'Mar', pesticide: 1.5, heavyMetals: 0.5, microbial: 0.7 },
  ],
  regionQuality: [
    { region: 'Madhya Pradesh', quality: 92, batches: 45 },
    { region: 'Uttar Pradesh', quality: 88, batches: 38 },
    { region: 'Rajasthan', quality: 85, batches: 32 },
    { region: 'Gujarat', quality: 90, batches: 41 },
  ],
  herbPurity: [
    { herb: 'Ashwagandha', purity: 94, batches: 52 },
    { herb: 'Tulsi', purity: 91, batches: 38 },
    { herb: 'Neem', purity: 87, batches: 28 },
    { herb: 'Turmeric', purity: 89, batches: 38 },
  ],
};

// Mock history records
export const MOCK_HISTORY_RECORDS = [
  {
    id: 'REC-001',
    batchId: 'BATCH-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    region: 'Madhya Pradesh',
    testDate: '2024-01-15',
    status: 'approved',
    qualityScore: 95,
  },
  {
    id: 'REC-002',
    batchId: 'BATCH-002',
    herbType: 'Tulsi',
    farmer: 'Priya Sharma',
    region: 'Uttar Pradesh',
    testDate: '2024-01-14',
    status: 'approved',
    qualityScore: 88,
  },
  {
    id: 'REC-003',
    batchId: 'BATCH-003',
    herbType: 'Neem',
    farmer: 'Amit Singh',
    region: 'Rajasthan',
    testDate: '2024-01-13',
    status: 'rejected',
    qualityScore: 65,
  },
  {
    id: 'REC-004',
    batchId: 'BATCH-004',
    herbType: 'Turmeric',
    farmer: 'Suresh Patel',
    region: 'Gujarat',
    testDate: '2024-01-12',
    status: 'approved',
    qualityScore: 92,
  },
  {
    id: 'REC-005',
    batchId: 'BATCH-005',
    herbType: 'Ginger',
    farmer: 'Meera Devi',
    region: 'Karnataka',
    testDate: '2024-01-11',
    status: 'approved',
    qualityScore: 89,
  },
];

// Mock offline results
export const MOCK_OFFLINE_RESULTS = [
  {
    id: 'OFFLINE-001',
    batchId: 'BATCH-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    testResults: {
      moistureContent: 8.5,
      pesticideResidue: 0.02,
      phytochemicalLevel: 95.2,
    },
    timestamp: '2024-01-15 14:30',
    status: 'pending',
  },
  {
    id: 'OFFLINE-002',
    batchId: 'BATCH-002',
    herbType: 'Tulsi',
    farmer: 'Priya Sharma',
    testResults: {
      moistureContent: 7.2,
      pesticideResidue: 0.01,
      phytochemicalLevel: 88.5,
    },
    timestamp: '2024-01-15 16:45',
    status: 'pending',
  },
];

// Mock profile data
export const MOCK_PROFILE_DATA = {
  name: 'Dr. Priya Sharma',
  email: 'priya.sharma@lab.com',
  phone: '+91 98765 43210',
  labName: 'Green Herbs Testing Lab',
  certification: 'AYUSH Certified Lab #12345',
  experience: '8 years',
  specialization: 'Herbal Medicine Testing',
};
