// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PROCESSING: 'processing',
};

// Transaction types
export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  BONUS: 'bonus',
  WITHDRAWAL: 'withdrawal',
};

// Payout method types
export const PAYOUT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  DIGITAL_WALLET: 'digital_wallet',
  CASH: 'cash',
};

// Mock payment data
export const MOCK_PAYMENT_DATA = {
  totalEarnings: 24580,
  growthPercentage: 12.5,
  monthlyTarget: 30000,
  earnedAmount: 24580,
  targetPercentage: 82,
  pendingAmount: 3240,
  availableAmount: 21340,
  co2Saved: 24.5,
  greenBonus: 245,
};

// Mock incentives data
export const MOCK_INCENTIVES = [
  {
    id: 'eco-compliance',
    icon: '🌱',
    title: 'Eco-Compliance Bonus',
    description: '15 deliveries',
    amount: 750,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    id: 'timely-delivery',
    icon: '⏰',
    title: 'Timely Delivery',
    description: '28 on-time deliveries',
    amount: 1400,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    id: 'verified-handovers',
    icon: '🤝',
    title: 'Verified Handovers',
    description: '32 verified',
    amount: 960,
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
];

// Mock payout methods
export const MOCK_PAYOUT_METHODS = [
  {
    id: 'bank-transfer',
    icon: '🏦',
    title: 'Bank Transfer',
    description: 'SBI •••• 4567',
    isActive: true,
    action: null,
  },
  {
    id: 'upi',
    icon: '📱',
    title: 'UPI',
    description: 'driver@paytm',
    isActive: false,
    action: 'Setup',
  },
  {
    id: 'digital-wallet',
    icon: '💳',
    title: 'Digital Wallet',
    description: 'Link your wallet',
    isActive: false,
    action: 'Add',
  },
];

// Mock transactions data
export const MOCK_TRANSACTIONS = [
  {
    id: 'weekly-payout',
    icon: '📥',
    title: 'Weekly Payout',
    date: 'Jan 15, 2024',
    amount: 5240,
    type: TRANSACTION_TYPES.CREDIT,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    id: 'bonus-payment',
    icon: '🎁',
    title: 'Bonus Payment',
    date: 'Jan 12, 2024',
    amount: 750,
    type: TRANSACTION_TYPES.BONUS,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    id: 'eco-bonus',
    icon: '🌱',
    title: 'Eco Bonus',
    date: 'Jan 10, 2024',
    amount: 245,
    type: TRANSACTION_TYPES.BONUS,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    id: 'timely-bonus',
    icon: '⏰',
    title: 'Timely Delivery Bonus',
    date: 'Jan 8, 2024',
    amount: 500,
    type: TRANSACTION_TYPES.BONUS,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 'weekly-payout-2',
    icon: '📥',
    title: 'Weekly Payout',
    date: 'Jan 1, 2024',
    amount: 4800,
    type: TRANSACTION_TYPES.CREDIT,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
];

// Color scheme for different transaction types
export const TRANSACTION_COLORS = {
  [TRANSACTION_TYPES.CREDIT]: {
    background: '#DCFCE7',
    text: '#16A34A',
  },
  [TRANSACTION_TYPES.DEBIT]: {
    background: '#FEE2E2',
    text: '#DC2626',
  },
  [TRANSACTION_TYPES.BONUS]: {
    background: '#DBEAFE',
    text: '#2563EB',
  },
  [TRANSACTION_TYPES.WITHDRAWAL]: {
    background: '#FEF3C7',
    text: '#D97706',
  },
};

// Payment processing states
export const PAYMENT_STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};
