// Profile Constants
export const PROFILE_DATA = {
  name: 'Dr. Arjun Singh',
  role: 'Lab Technician - HerbChain',
  email: 'arjun.singh@herbchain.com',
  image: 'https://randomuser.me/api/portraits/men/32.jpg',
};

export const ACCOUNT_SETTINGS = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    icon: 'create-outline',
    iconColor: '#4B5563',
    action: 'editProfile',
  },
  {
    id: 'change-password',
    title: 'Change Password',
    icon: 'lock-closed-outline',
    iconColor: '#4B5563',
    action: 'changePassword',
  },
  {
    id: 'language',
    title: 'Language',
    icon: 'language-outline',
    iconColor: '#4B5563',
    action: 'languageChange',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    iconColor: '#4B5563',
    action: 'notificationSettings',
  },
  {
    id: 'certification',
    title: 'Certification Uploads',
    icon: 'cloud-upload-outline',
    iconColor: '#4B5563',
    action: 'certificationUploads',
  },
];

export const SUPPORT_LEGAL_SETTINGS = [
  {
    id: 'support',
    title: 'Support & Disputes',
    icon: 'help-circle-outline',
    iconColor: '#4B5563',
    action: 'support',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'shield-checkmark-outline',
    iconColor: '#4B5563',
    action: 'privacyPolicy',
  },
];

export const SUPPORT_CATEGORIES = [
  {
    id: 'technical',
    title: 'Technical Issues',
    description: 'App crashes, login problems, sync issues',
    icon: 'settings-outline',
    color: '#3B82F6',
  },
  {
    id: 'testing',
    title: 'Testing Process',
    description: 'Questions about lab procedures and protocols',
    icon: 'flask-outline',
    color: '#10B981',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Payment issues, invoice questions',
    icon: 'card-outline',
    color: '#F59E0B',
  },
  {
    id: 'dispute',
    title: 'Dispute Resolution',
    description: 'Batch disputes, quality concerns',
    icon: 'alert-circle-outline',
    color: '#EF4444',
  },
];

export const DISPUTE_TYPES = [
  {
    id: 'quality',
    title: 'Quality Dispute',
    description: 'Batch quality issues or test results',
  },
  {
    id: 'delivery',
    title: 'Delivery Dispute',
    description: 'Transportation or delivery problems',
  },
  {
    id: 'payment',
    title: 'Payment Dispute',
    description: 'Payment or pricing disagreements',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Other types of disputes',
  },
];

export const PRIORITY_LEVELS = [
  { id: 'low', title: 'Low', color: '#10B981' },
  { id: 'medium', title: 'Medium', color: '#F59E0B' },
  { id: 'high', title: 'High', color: '#EF4444' },
  { id: 'urgent', title: 'Urgent', color: '#DC2626' },
];

export const COLORS = {
  primary: '#006B38',
  primaryDark: '#004422',
  primaryLight: '#059669',
  secondary: '#00BFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  gray: {
    50: '#F8F9FA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
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
  xxxl: 32,
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
    display: 24,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
