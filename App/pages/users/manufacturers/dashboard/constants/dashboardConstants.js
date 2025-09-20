export const DASHBOARD_CARDS = [
  {
    id: 'active_batches',
    title: 'Active Batches',
    value: '12',
    iconName: 'grass',
    color: '#7C9885', // herb-green
    iconBgColor: '#E8F5E8', // mint
  },
  {
    id: 'pending_deliveries',
    title: 'Pending Deliveries',
    value: '8',
    iconName: 'local_shipping',
    color: '#f59e0b', // amber
    iconBgColor: '#FFFBEB', // yellow-100 equivalent
  },
  {
    id: 'recent_certifications',
    title: 'Recent Certifications',
    value: '5',
    iconName: 'verified',
    color: '#16a34a', // green-600
    iconBgColor: '#dcfce7', // green-100
  },
  {
    id: 'production_stats',
    title: 'Products Created',
    value: '12',
    iconName: 'factory',
    color: '#a855f7', // Purple
    iconBgColor: '#ede9fe', // purple-100 equivalent
  },
];

export const MANUFACTURER_NAME = "Ramesh";
export const COMPANY_NAME = "Herbal Essence Pvt Ltd";
export const CURRENT_DATE = "Today, March 15, 2024";
export const CURRENT_WEATHER = "24°C";
export const WEATHER_STATUS = "Perfect for drying";
export const AVATAR_URL = "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg";

export const CERTIFICATION_DATA = [
  {
    id: '1',
    herbName: 'Turmeric Powder',
    batchId: 'TUR-2024-03',
    status: 'Certified',
    statusColor: '#16a34a',
    timeAgo: '2 hours ago',
    icon: 'check-circle',
    iconBgColor: '#dcfce7',
  },
  {
    id: '2',
    herbName: 'Ashwagandha Root',
    batchId: 'ASH-2024-02',
    status: 'Pending',
    statusColor: '#f59e0b',
    timeAgo: '1 day ago',
    icon: 'hourglass-empty',
    iconBgColor: '#fef3c7',
  },
];

export const MONTHLY_PRODUCTION_DATA = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      data: [850, 920, 1150],
      color: (opacity = 1) => `rgba(124, 152, 133, ${opacity})`, // herb-green
      strokeWidth: 2
    }
  ]
};

export const QUICK_ACTIONS_DATA = [
  {
    id: 'herb_inventory',
    label: 'Herb Inventory',
    icon: 'inventory_2',
    bgColor: '#7C9885',
  },
  {
    id: 'create_product',
    label: 'Create Product',
    icon: 'add',
    bgColor: '#9CAF88',
  },
];