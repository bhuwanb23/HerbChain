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
