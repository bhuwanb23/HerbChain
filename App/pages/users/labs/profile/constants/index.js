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
    navigateTo: 'EditProfile',
  },
  {
    id: 'change-password',
    title: 'Change Password',
    icon: 'lock-closed-outline',
    iconColor: '#4B5563',
    navigateTo: 'ChangePassword',
  },
  {
    id: 'language',
    title: 'Language',
    icon: 'language-outline',
    iconColor: '#4B5563',
    navigateTo: 'LanguageSettings',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    iconColor: '#4B5563',
    navigateTo: 'NotificationSettings',
  },
  {
    id: 'certification-uploads',
    title: 'Certification Uploads',
    icon: 'cloud-upload-outline',
    iconColor: '#4B5563',
    navigateTo: 'CertificationUploads',
  },
];

export const SUPPORT_LEGAL = [
  {
    id: 'support-disputes',
    title: 'Support & Disputes',
    icon: 'help-circle-outline',
    iconColor: '#4B5563',
    navigateTo: 'SupportDisputeScreen',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    icon: 'shield-checkmark-outline',
    iconColor: '#4B5563',
    navigateTo: 'PrivacyPolicy',
  },
];

export const SUPPORT_CATEGORIES = [
  {
    id: 'technical',
    title: 'Technical Issues',
    description: 'App crashes, login problems, or technical bugs',
    icon: 'bug-outline',
    iconColor: '#EF4444',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Payment issues, subscription problems',
    icon: 'card-outline',
    iconColor: '#3B82F6',
  },
  {
    id: 'account',
    title: 'Account Issues',
    description: 'Profile updates, password reset, account access',
    icon: 'person-outline',
    iconColor: '#10B981',
  },
  {
    id: 'testing',
    title: 'Testing Process',
    description: 'Questions about lab testing procedures',
    icon: 'flask-outline',
    iconColor: '#8B5CF6',
  },
  {
    id: 'compliance',
    title: 'Compliance & Regulations',
    description: 'Regulatory questions, compliance issues',
    icon: 'shield-outline',
    iconColor: '#F59E0B',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'General questions or other concerns',
    icon: 'help-circle-outline',
    iconColor: '#6B7280',
  },
];

export const DISPUTE_TYPES = [
  {
    id: 'batch-dispute',
    title: 'Batch Testing Dispute',
    description: 'Dispute test results or batch processing',
    icon: 'flask-outline',
    iconColor: '#EF4444',
  },
  {
    id: 'payment-dispute',
    title: 'Payment Dispute',
    description: 'Dispute payment or billing issues',
    icon: 'card-outline',
    iconColor: '#3B82F6',
  },
  {
    id: 'compliance-dispute',
    title: 'Compliance Dispute',
    description: 'Dispute compliance or regulatory issues',
    icon: 'shield-outline',
    iconColor: '#F59E0B',
  },
  {
    id: 'service-dispute',
    title: 'Service Dispute',
    description: 'Dispute service quality or delivery',
    icon: 'star-outline',
    iconColor: '#10B981',
  },
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
