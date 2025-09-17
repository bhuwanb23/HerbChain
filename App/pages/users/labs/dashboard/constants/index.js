// Dashboard Constants
export const STATS_DATA = [
  {
    id: 'pending',
    title: 'Pending Batches',
    subtitle: 'Need testing',
    value: '12',
    icon: 'time-outline',
    iconColor: '#00BFFF',
    valueColor: '#004422',
    titleColor: '#374151',
    subtitleColor: '#808080',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  {
    id: 'urgent',
    title: 'Urgent Requests',
    subtitle: 'Fast-track testing',
    value: '3',
    icon: 'warning-outline',
    iconColor: '#EF4444',
    valueColor: '#7F1D1D',
    titleColor: '#B91C1C',
    subtitleColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'This week',
    value: '48',
    icon: 'checkmark-circle-outline',
    iconColor: '#22C55E',
    valueColor: '#14532D',
    titleColor: '#15803D',
    subtitleColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  {
    id: 'failed',
    title: 'Failed Compliance',
    subtitle: 'Needs retest',
    value: '2',
    icon: 'shield-half-outline',
    iconColor: '#EAB308',
    valueColor: '#78350F',
    titleColor: '#A16207',
    subtitleColor: '#EAB308',
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
];

export const QUICK_ACTIONS = [
  {
    id: 'batch-verification',
    title: 'Batch Verification',
    icon: 'flask-outline',
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
    backgroundColor: '#00BFFF',
    borderColor: '#E5E7EB',
    navigateTo: 'Batches',
  },
  {
    id: 'testing-results',
    title: 'Testing & Results',
    icon: 'clipboard-outline',
    iconColor: '#374151',
    textColor: '#374151',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    navigateTo: 'Testing',
  },
];

export const NOTIFICATIONS_DATA = [
  {
    id: '1',
    type: 'error',
    title: 'Batch #B2024-0156 failed compliance',
    subtitle: 'Contaminant levels exceeded threshold',
    time: '2 hours ago',
    icon: 'alert-circle-outline',
    iconColor: '#EF4444',
    actionText: 'View Details',
    navigateTo: 'ComplianceApproval',
  },
  {
    id: '2',
    type: 'info',
    title: 'Urgent request: Batch #B2024-0158',
    subtitle: 'Priority testing required by EOD',
    time: '4 hours ago',
    icon: 'information-circle-outline',
    iconColor: '#00BFFF',
    actionText: 'Start Testing',
    navigateTo: 'TestingResultsEntry',
  },
  {
    id: '3',
    type: 'success',
    title: 'Batch #B2024-0154 completed',
    subtitle: 'All tests passed, report generated',
    time: '6 hours ago',
    icon: 'checkmark-circle-outline',
    iconColor: '#22C55E',
    actionText: 'View Report',
    navigateTo: 'ReportsAnalytics',
  },
];

export const ACTIVITY_DATA = [
  {
    id: '1',
    text: 'Batch #B2024-0153 analysis completed',
    time: '30 minutes ago',
    indicatorColor: '#22C55E',
  },
  {
    id: '2',
    text: 'Started testing Batch #B2024-0157',
    time: '1 hour ago',
    indicatorColor: '#00BFFF',
  },
  {
    id: '3',
    text: 'Retest scheduled for Batch #B2024-0155',
    time: '2 hours ago',
    indicatorColor: '#EAB308',
  },
];

export const COLORS = {
  primary: '#006B38',
  primaryDark: '#004422',
  primaryLight: '#059669',
  secondary: '#00BFFF',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#00BFFF',
  white: '#FFFFFF',
  gray: {
    50: '#F8F9FA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 22,
    display: 28,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
