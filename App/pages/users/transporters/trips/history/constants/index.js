// Mock trip data based on HTML structure
export const MOCK_TRIPS = [
  {
    id: '#TH-2024-001',
    route: 'Mumbai → Delhi',
    herbType: 'Ginseng',
    date: '2024-01-15',
    status: 'completed',
    duration: '4.5h',
    driver: 'John Smith',
    rating: 5,
  },
  {
    id: '#TH-2024-002',
    route: 'Chennai → Bangalore',
    herbType: 'Turmeric',
    date: '2024-01-14',
    status: 'in_transit',
    duration: '2.1h',
    driver: 'Mike Johnson',
    rating: 4,
  },
  {
    id: '#TH-2024-003',
    route: 'Pune → Hyderabad',
    herbType: 'Ashwagandha',
    date: '2024-01-13',
    status: 'rejected',
    duration: '-',
    driver: 'Sarah Wilson',
    rating: 2,
  },
  {
    id: '#TH-2024-004',
    route: 'Kolkata → Bhubaneswar',
    herbType: 'Ginkgo',
    date: '2024-01-12',
    status: 'completed',
    duration: '3.8h',
    driver: 'David Brown',
    rating: 5,
  },
  {
    id: '#TH-2024-005',
    route: 'Ahmedabad → Surat',
    herbType: 'Ginseng',
    date: '2024-01-11',
    status: 'completed',
    duration: '2.5h',
    driver: 'Lisa Davis',
    rating: 4,
  },
  {
    id: '#TH-2024-006',
    route: 'Jaipur → Udaipur',
    herbType: 'Turmeric',
    date: '2024-01-10',
    status: 'in_transit',
    duration: '1.8h',
    driver: 'Robert Taylor',
    rating: 3,
  },
];

// Performance statistics
export const PERFORMANCE_STATS = {
  totalTrips: 147,
  completed: 134,
  avgDuration: '4.2h',
  rejected: 8,
};

// Weekly performance data for chart
export const WEEKLY_DATA = [12, 15, 18, 14, 20, 8, 6];

// Success rate percentage
export const SUCCESS_RATE = 91.2;

// Filter options
export const FILTER_OPTIONS = {
  dateRange: [
    { label: 'Date Range', value: 'all' },
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' },
  ],
  status: [
    { label: 'All Status', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Rejected', value: 'rejected' },
  ],
  herbType: [
    { label: 'All Herb Types', value: 'all' },
    { label: 'Ginseng', value: 'ginseng' },
    { label: 'Turmeric', value: 'turmeric' },
    { label: 'Ashwagandha', value: 'ashwagandha' },
    { label: 'Ginkgo', value: 'ginkgo' },
  ],
};

// Default filter values
export const DEFAULT_FILTERS = {
  dateRange: 'all',
  status: 'all',
  herbType: 'all',
};

// Chart colors and gradients
export const CHART_COLORS = {
  primary: '#059669',
  secondary: '#10b981',
  blue: '#3b82f6',
  orange: '#f59e0b',
  red: '#ef4444',
  gradients: {
    primary: ['#059669', '#10b981'],
    blue: ['#3b82f6', '#2563eb'],
    orange: ['#f59e0b', '#f97316'],
    red: ['#ef4444', '#dc2626'],
  },
};

// Status configurations
export const STATUS_CONFIG = {
  completed: {
    bg: '#DCFCE7',
    text: '#166534',
    icon: 'check-circle',
  },
  in_transit: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    icon: 'schedule',
  },
  rejected: {
    bg: '#FEE2E2',
    text: '#991B1B',
    icon: 'error',
  },
};
