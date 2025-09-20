# Consumer Module

This module provides the consumer interface for the HerbChain application, allowing consumers to track and verify the authenticity of herbal products.

## Features

- **Product Traceability**: Complete journey tracking from farm to consumer
- **Farmer Spotlight**: Information about the farmer who grew the herbs
- **Quality Certifications**: Display of organic and GMP certifications
- **Interactive Timeline**: Visual representation of the herb's journey
- **Share Functionality**: Ability to share traceability information

## File Structure

```
consumers/
├── components/           # Reusable UI components
│   ├── Header.js        # Page header with navigation
│   ├── JourneyMap.js    # Visual journey representation
│   ├── FarmerSpotlight.js # Farmer information display
│   ├── Timeline.js      # Journey timeline component
│   ├── Certifications.js # Certification badges
│   ├── BottomNavbar.js  # Bottom navigation
│   └── index.js         # Component exports
├── constants/           # Constants and configuration
│   └── index.js         # Data constants and styles
├── hooks/              # Custom React hooks
│   └── index.js        # useHerbTraceability, useConsumerActions
├── traceability/       # Traceability screen
│   ├── TraceabilityScreen.js # Main traceability interface
│   └── index.js        # Screen exports
├── dashboard/          # Consumer dashboard
│   └── dashboard.js    # Main dashboard screen
├── ConsumerMainPage.js # Main consumer page component
├── index.js           # Module exports
└── README.md          # This documentation
```

## Components

### Header
- Displays product name, batch ID, and verification status
- Includes back and share buttons
- Shows verification badge

### JourneyMap
- Visual representation of the farm-to-consumer journey
- Interactive map with start/end points
- Route visualization

### FarmerSpotlight
- Farmer profile information
- Avatar, name, and description
- Farming experience details

### Timeline
- Step-by-step journey visualization
- Icons for each stage (harvest, testing, packaging)
- Detailed descriptions and dates

### Certifications
- Display of quality certifications
- Organic and GMP compliance badges
- Visual certification indicators

## Hooks

### useHerbTraceability
- Fetches herb traceability data
- Manages loading and error states
- Handles API calls for batch information

### useConsumerActions
- Manages sharing functionality
- Handles report viewing
- Navigation actions

## Usage

```javascript
import { ConsumerMainPage, TraceabilityScreen } from './pages/users/consumers';

// In your navigation
<Stack.Screen 
  name="ConsumerDashboard" 
  component={ConsumerMainPage}
  options={{ title: 'Consumer Dashboard' }}
/>

// Direct traceability screen
<Stack.Screen 
  name="Traceability" 
  component={TraceabilityScreen}
  options={{ title: 'Product Traceability' }}
/>
```

## Data Flow

1. **Batch ID Input**: User scans QR code or enters batch ID
2. **Data Fetching**: `useHerbTraceability` hook fetches data
3. **Component Rendering**: Components display the traceability information
4. **User Interactions**: Share, view report, or navigate actions

## Styling

The module uses a consistent color scheme:
- **Sage Green**: Primary brand color (#87A96B)
- **Warm Beige**: Background accents (#F5F1E8)
- **Earth Brown**: Text accents (#8B7355)

## Future Enhancements

- QR code scanning integration
- Offline data caching
- Push notifications for updates
- Social sharing features
- Review and rating system
