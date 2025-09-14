export const PENDING_TRANSACTIONS = [
  {
    id: 'GV-2024-001',
    buyer: 'Green Valley Co-op',
    amount: '$485.20',
    expectedDate: 'Dec 15, 2024',
    icon: 'user',
    iconColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'FFM-2024-089',
    buyer: 'Farm Fresh Markets',
    amount: '$324.75',
    expectedDate: 'Dec 18, 2024',
    icon: 'building',
    iconColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'OP-2024-156',
    buyer: 'Organic Plus Ltd',
    amount: '$672.40',
    expectedDate: 'Dec 20, 2024',
    icon: 'store',
    iconColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
];

export const COMPLETED_TRANSACTIONS = [
  {
    id: 'EH-2024-234',
    buyer: 'Eco Harvest Inc',
    amount: '$756.90',
    paidDate: 'Dec 10, 2024',
    icon: 'check',
    iconColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'NF-2024-187',
    buyer: 'Natural Foods Corp',
    amount: '$423.65',
    paidDate: 'Dec 8, 2024',
    icon: 'check',
    iconColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'FD-2024-098',
    buyer: 'Fresh Direct Ltd',
    amount: '$591.25',
    paidDate: 'Dec 5, 2024',
    icon: 'check',
    iconColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
];

export const WALLET_DATA = {
  totalBalance: '$2,847.50',
  incentivesEarned: '$127.30',
  monthlyEarnings: '+$342.80',
};

export const TAB_TYPES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};
