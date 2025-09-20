# Consumer QR Scan Feature

## Overview
This module provides QR code scanning functionality for consumers to view detailed herb traceability information. Consumers can scan QR codes on herb products to access comprehensive information about the herb's journey from farm to consumer.

## Features
- **QR Code Scanning**: Camera-based QR code scanning with permission handling
- **Manual Batch ID Entry**: Fallback option to enter batch ID manually
- **Comprehensive Herb Details**: Display complete herb information including:
  - Basic herb information (species, weight, harvest date, location)
  - Current owner information
  - Complete ownership history timeline
  - Quality status and certifications
  - Verification badges
- **Share Functionality**: Share herb traceability information
- **Error Handling**: Comprehensive error handling for various scenarios

## File Structure
```
consumers/
├── components/
│   ├── QRScanner.js              # Reusable QR scanner component
│   └── HerbDetailsDisplay.js     # Herb details display component
├── hooks/
│   └── useConsumerAPI.js         # API hook for consumer functionality
├── scan/
│   └── QRScanScreen.js           # Main QR scanning screen
├── details/
│   └── HerbDetailsScreen.js      # Herb details display screen
├── services/
│   └── consumerAPI.js            # API service for consumer operations
├── ConsumerMainPage.js           # Main consumer page with navigation
└── index.js                      # Module exports
```

## Components

### QRScanner
- **Purpose**: Reusable QR code scanner component
- **Features**: 
  - Camera permission handling
  - QR code detection with visual overlay
  - Error handling and retry functionality
  - Customizable scan area

### HerbDetailsDisplay
- **Purpose**: Display comprehensive herb information
- **Features**:
  - Herb batch information
  - Ownership history timeline
  - Quality certifications
  - Current owner details
  - Verification badges

### QRScanScreen
- **Purpose**: Main screen for QR code scanning
- **Features**:
  - QR scanner integration
  - Manual batch ID entry
  - Scan instructions and help text
  - Navigation to results

### HerbDetailsScreen
- **Purpose**: Display scanned herb information
- **Features**:
  - Complete herb traceability
  - Share functionality
  - Navigation back to scanner

## API Integration

### useConsumerAPI Hook
- **fetchHerbDetails(batchId)**: Fetch herb details by batch ID
- **validateBatchId(batchId)**: Validate batch ID format
- **parseQRData(qrData)**: Parse QR code data
- **showError(message)**: Display error alerts
- **showSuccess(message)**: Display success alerts

### consumerAPI Service
- **fetchHerbDetails(batchId)**: Fetch herb details from server
- **getOwnershipHistory(batchId)**: Get ownership transfer history
- **getCurrentQR(batchId)**: Get current QR code information
- **checkBatchExists(batchId)**: Check if batch exists
- **formatHerbData(herbData)**: Format herb data for display

## Navigation Flow
```
ConsumerMainPage → Scan Tab → QRScanScreen → HerbDetailsScreen
```

## Usage

### Basic QR Scanning
1. User navigates to Consumer Dashboard
2. Taps "Scan" tab in bottom navigation
3. Camera opens with QR scanner
4. User scans QR code on herb product
5. System fetches herb details from server
6. User views comprehensive herb information

### Manual Batch ID Entry
1. User taps "Enter Batch ID Manually" option
2. User enters batch ID in text field
3. User taps "Search" button
4. System fetches herb details from server
5. User views comprehensive herb information

## API Endpoints Used
- `GET /api/v1/herbs/{batch_id}` - Fetch herb details
- `GET /api/v1/herbs/{batch_id}/ownership` - Get ownership history
- `GET /api/v1/herbs/{batch_id}/qr` - Get current QR code

## Error Handling
- **Invalid QR Code**: Shows error message for invalid QR codes
- **Network Errors**: Handles server connectivity issues
- **Camera Permissions**: Requests and handles camera permissions
- **Batch Not Found**: Shows appropriate error for non-existent batches
- **Data Parsing**: Handles malformed QR code data

## Dependencies
- `expo-camera` - Camera functionality
- `expo-barcode-scanner` - QR code scanning
- `@expo/vector-icons` - Icons
- `react-native` - Core React Native components

## Testing
- Test with valid herb QR codes
- Test with invalid QR codes
- Test camera permission scenarios
- Test network error scenarios
- Test manual batch ID entry
- Test data display accuracy

## Future Enhancements
- Offline QR code caching
- Batch history for consumers
- Push notifications for herb updates
- Social sharing with custom messages
- QR code generation for sharing
- Advanced filtering and search