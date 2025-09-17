// Report types and categories
export const REPORT_TYPES = {
  CONTAMINANT_TRENDS: 'Contaminant Trends',
  HERB_PURITY_BREAKDOWN: 'Herb Purity Breakdown',
  QUALITY_HEATMAP: 'Quality Heatmap',
  BATCH_ANALYSIS: 'Batch Analysis',
  COMPLIANCE_REPORT: 'Compliance Report',
};

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  PIE: 'pie',
  BAR: 'bar',
  HEATMAP: 'heatmap',
};

// Export formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
};

// Filter options
export const REGION_FILTERS = [
  'All Regions',
  'Rajasthan',
  'Maharashtra',
  'Gujarat',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
];

export const DATE_RANGE_FILTERS = [
  'Date Range',
  'Last 7 days',
  'Last 30 days',
  'Last 3 months',
  'Last 6 months',
  'Last year',
  'Custom range',
];

// Mock report data
export const MOCK_REPORTS = [
  {
    id: 'TB-2024-156',
    title: 'Tulsi Batch #TB-2024-156',
    subtitle: 'Rajasthan • 2 days ago',
    status: 'passed',
    purity: 98.5,
    herbType: 'Tulsi',
    region: 'Rajasthan',
    testDate: '2024-01-15',
    farmer: 'Rajesh Kumar',
    labTechnician: 'Dr. Priya Sharma',
  },
  {
    id: 'AB-2024-143',
    title: 'Ashwagandha Batch #AB-2024-143',
    subtitle: 'Gujarat • 4 days ago',
    status: 'retest',
    purity: 89.2,
    herbType: 'Ashwagandha',
    region: 'Gujarat',
    testDate: '2024-01-13',
    farmer: 'Amit Patel',
    labTechnician: 'Dr. Suresh Kumar',
  },
  {
    id: 'NE-2024-089',
    title: 'Neem Batch #NE-2024-089',
    subtitle: 'Maharashtra • 1 week ago',
    status: 'passed',
    purity: 95.8,
    herbType: 'Neem',
    region: 'Maharashtra',
    testDate: '2024-01-08',
    farmer: 'Priya Singh',
    labTechnician: 'Dr. Anjali Mehta',
  },
  {
    id: 'BR-2024-201',
    title: 'Brahmi Batch #BR-2024-201',
    subtitle: 'Karnataka • 2 weeks ago',
    status: 'failed',
    purity: 76.3,
    herbType: 'Brahmi',
    region: 'Karnataka',
    testDate: '2024-01-01',
    farmer: 'Kumar Reddy',
    labTechnician: 'Dr. Rajesh Gupta',
  },
];

// Status configurations
export const STATUS_CONFIG = {
  passed: {
    backgroundColor: '#DCFCE7',
    textColor: '#166534',
    label: 'Passed',
  },
  retest: {
    backgroundColor: '#FEF9C3',
    textColor: '#854D0E',
    label: 'Retest',
  },
  failed: {
    backgroundColor: '#FEE2E2',
    textColor: '#DC2626',
    label: 'Failed',
  },
  pending: {
    backgroundColor: '#DBEAFE',
    textColor: '#1E40AF',
    label: 'Pending',
  },
};

// Generate report options
export const GENERATE_REPORT_OPTIONS = [
  {
    id: 'contaminant_trends',
    title: 'Contaminant Trends',
    description: '6-month contamination analysis',
    icon: 'trending-up',
    type: 'chart',
    chartType: CHART_TYPES.LINE,
  },
  {
    id: 'herb_purity_breakdown',
    title: 'Herb Purity Breakdown',
    description: 'Purity percentage by batch',
    icon: 'pie-chart',
    type: 'report',
    chartType: CHART_TYPES.PIE,
  },
  {
    id: 'quality_heatmap',
    title: 'Quality Heatmap',
    description: 'Region-wise quality analysis',
    icon: 'map',
    type: 'heatmap',
    chartType: CHART_TYPES.HEATMAP,
  },
];

// Export options
export const EXPORT_OPTIONS = [
  {
    id: 'pdf',
    title: 'Export PDF',
    icon: 'file-pdf',
    color: '#EF4444',
  },
  {
    id: 'excel',
    title: 'Export Excel',
    icon: 'file-excel',
    color: '#22C55E',
  },
];

// Mock chart data
export const MOCK_CHART_DATA = {
  contaminantTrends: {
    title: 'Contaminant Trends (Last 6 Months)',
    data: [
      { month: 'Jul', value: 2.3 },
      { month: 'Aug', value: 1.8 },
      { month: 'Sep', value: 2.1 },
      { month: 'Oct', value: 1.5 },
      { month: 'Nov', value: 1.2 },
      { month: 'Dec', value: 0.9 },
    ],
  },
  herbPurityBreakdown: {
    title: 'Herb Purity Breakdown',
    data: [
      { herb: 'Tulsi', purity: 95.2 },
      { herb: 'Ashwagandha', purity: 89.7 },
      { herb: 'Neem', purity: 92.1 },
      { herb: 'Brahmi', purity: 87.3 },
    ],
  },
};
