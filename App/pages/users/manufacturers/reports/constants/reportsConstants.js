export const DATE_FILTER_OPTIONS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' },
];

export const REPORT_SUMMARY_CARDS = [
  {
    id: 'products_created',
    title: 'Products Created',
    value: '247',
    change: '+12% vs last week',
    changeType: 'increase',
    icon: 'inventory_2',
    bgColor: '#dbeafe', // blue-100
    iconColor: '#2563eb', // blue-600
  },
  {
    id: 'herbs_consumed',
    title: 'Herbs Consumed',
    value: '1,892 kg',
    change: '-3% vs last week',
    changeType: 'decrease',
    icon: 'grass',
    bgColor: '#f0fdf4', // green-50
    iconColor: '#16a34a', // green-600
  },
  {
    id: 'compliance_certificates',
    title: 'Compliance Certificates',
    value: '18',
    change: '+2 this week',
    changeType: 'increase',
    icon: 'verified',
    bgColor: '#f3e8ff', // purple-100
    iconColor: '#a855f7', // purple-600
  },
];

export const PRODUCTION_TRENDS_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  data: [45, 52, 38, 63, 58, 42, 67],
  color: '#3B82F6',
};

export const PRODUCT_LINEAGE_DATA = [
  {
    id: '1',
    productName: 'Hemp Oil Extract',
    source: 'Organic Hemp - Farm A (Batch #H2024-001)',
    location: 'Colorado, USA - Harvested: Nov 15, 2024',
    sourceIcon: 'grass',
    locationIcon: 'location_on',
    borderColor: '#3b82f6', // blue-500
  },
  {
    id: '2',
    productName: 'CBD Capsules',
    source: 'Hemp Flower - Farm B (Batch #H2024-002)',
    location: 'Oregon, USA - Harvested: Nov 20, 2024',
    sourceIcon: 'grass',
    locationIcon: 'location_on',
    borderColor: '#16a34a', // green-500
  },
];

export const COMPLIANCE_DOCUMENTS_DATA = [
  {
    id: 'doc1',
    name: 'Lab Results Q4 2024',
    uploaded: '2 days ago',
    icon: 'picture_as_pdf',
    fileType: 'pdf',
  },
  {
    id: 'doc2',
    name: 'Inventory Report',
    uploaded: '1 week ago',
    icon: 'description',
    fileType: 'excel',
  },
];

export const GENERATE_REPORT_OPTIONS = [
  {
    id: 'pdf_report',
    label: 'PDF Report',
    icon: 'picture_as_pdf',
    bgColor: '#dc2626', // red-600
  },
  {
    id: 'excel_export',
    label: 'Excel Export',
    icon: 'description',
    bgColor: '#16a34a', // green-600
  },
  {
    id: 'compliance_summary',
    label: 'Compliance Summary',
    icon: 'verified_user',
    bgColor: '#2563eb', // blue-600
  },
];