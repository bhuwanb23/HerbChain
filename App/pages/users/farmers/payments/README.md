# Payments Screen

This module provides a complete payments and transactions management system for farmers, featuring wallet summary, transaction history, and withdrawal functionality.

## Structure

```
payments/
├── components/           # UI Components
│   ├── Header.js        # Screen header with navigation and notifications
│   ├── WalletSummary.js # Gradient wallet card with balance and stats
│   ├── Tabs.js          # Tab switcher for Pending/Completed
│   ├── TransactionCard.js # Individual transaction card component
│   ├── TransactionList.js # Scrollable list of transactions
│   └── index.js         # Component exports
├── hooks/               # Custom React hooks
│   ├── usePayments.js   # Main payments logic and state management
│   └── index.js         # Hook exports
├── constants/           # Static data and configurations
│   ├── transactionData.js # Transaction data and wallet information
│   └── index.js         # Constant exports
├── payements.js         # Main PaymentsScreen component
└── README.md           # This documentation
```

## Features

### 🏦 Wallet Summary
- **Total Balance**: Displays current wallet balance
- **Incentives Earned**: Shows earned incentives
- **Monthly Earnings**: Current month's earnings
- **Withdraw Button**: Bank withdrawal functionality

### 📊 Transaction Management
- **Tab System**: Switch between Pending and Completed transactions
- **Transaction Cards**: Detailed transaction information
- **Status Indicators**: Visual status badges (Pending/Completed)
- **Interactive Cards**: Tap for detailed transaction info

### 🎨 Design Features
- **Gradient Background**: Beautiful gradient wallet card
- **Material Icons**: Consistent iconography
- **Responsive Layout**: Optimized for mobile devices
- **Smooth Animations**: Touch feedback and transitions

## Components

### Header
- Back navigation button
- Screen title
- Notification bell icon

### WalletSummary
- Gradient background (green theme)
- Balance display
- Statistics section
- Withdraw to bank button

### Tabs
- Pending Payments tab
- Completed tab
- Active state styling

### TransactionCard
- Buyer information with icon
- Transaction amount
- Status badge
- Date information
- Batch ID display

### TransactionList
- Scrollable container
- Dynamic content based on active tab
- Proper spacing and layout

## Usage

```jsx
import PaymentsScreen from './payments/payements';

// In your navigation
<PaymentsScreen navigation={navigation} />
```

## Data Structure

### Transaction Object
```javascript
{
  id: 'GV-2024-001',
  buyer: 'Green Valley Co-op',
  amount: '$485.20',
  expectedDate: 'Dec 15, 2024', // for pending
  paidDate: 'Dec 10, 2024',     // for completed
  icon: 'user',
  iconColor: '#F59E0B',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
}
```

### Wallet Data
```javascript
{
  totalBalance: '$2,847.50',
  incentivesEarned: '$127.30',
  monthlyEarnings: '+$342.80',
}
```

## Customization

### Colors
- Primary: `#10B981` (Green)
- Secondary: `#F59E0B` (Amber)
- Background: `#F8FAFC` (Light Gray)

### Icons
- Uses Material Icons from `react-native-vector-icons`
- Consistent icon mapping for different transaction types

### Styling
- Follows React Native StyleSheet patterns
- Responsive design principles
- Consistent spacing and typography

## Dependencies

- `react-native-vector-icons/MaterialIcons`
- `react-native-linear-gradient`
- `react-native-safe-area-context`

## Future Enhancements

- [ ] Real-time transaction updates
- [ ] Advanced filtering options
- [ ] Export transaction history
- [ ] Multiple wallet support
- [ ] Payment reminders
- [ ] Analytics dashboard
