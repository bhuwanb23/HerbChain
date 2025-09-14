# Herb Registration Screen

This module provides a complete herb registration system for farmers, featuring AI-powered herb recognition and manual entry capabilities.

## Structure

```
herb_register/
├── components/           # UI Components
│   ├── Header.js        # Screen header with navigation
│   ├── ProgressBar.js   # Step progress indicator
│   ├── AIRecognition.js # AI camera and detection UI
│   ├── ManualEntry.js   # Form fields for manual entry
│   ├── BottomActions.js # Generate batch ID button
│   └── index.js         # Component exports
├── hooks/               # Custom React hooks
│   ├── useHerbRegistration.js # Main registration logic
│   └── index.js         # Hook exports
├── constants/           # Static data and configurations
│   ├── herbSpecies.js   # Herb species and cultivation methods
│   └── index.js         # Constant exports
├── HerbRegisterScreen.js # Main screen component
├── index.js             # Main export
└── README.md           # This file
```

## Features

### 1. AI Recognition
- Camera integration for herb photo capture
- Simulated AI processing with loading states
- Auto-detection of herb species with confidence scores
- Automatic location and timestamp detection

### 2. Manual Entry
- Species selection dropdown
- Weight input with unit display
- Harvest date picker
- Cultivation method selection
- Optional notes field

### 3. Progress Tracking
- Visual progress bar showing current step
- Step labels (AI Recognition → Manual Entry → Complete)
- Dynamic progress updates

### 4. Batch Generation
- Unique batch ID generation
- Form validation
- Success confirmation with batch ID display

## Usage

```javascript
import HerbRegisterScreen from './pages/users/farmers/herb_register';

// In your navigation stack
<Stack.Screen 
  name="HerbRegister" 
  component={HerbRegisterScreen} 
/>
```

## Dependencies

- `react-native-vector-icons` - For icons
- `@react-native-picker/picker` - For dropdown selections
- `react-native-linear-gradient` - For gradient backgrounds
- `react-native-safe-area-context` - For safe area handling

## Customization

### Adding New Herb Species
Edit `constants/herbSpecies.js`:
```javascript
export const HERB_SPECIES = [
  { value: 'new-herb', label: 'New Herb (Scientific Name)' },
  // ... existing herbs
];
```

### Adding New Cultivation Methods
Edit `constants/herbSpecies.js`:
```javascript
export const CULTIVATION_METHODS = [
  { value: 'new-method', label: 'New Method' },
  // ... existing methods
];
```

### Modifying AI Detection Logic
Edit `hooks/useHerbRegistration.js` in the `handleCameraPress` function to integrate with real AI services.

## State Management

The `useHerbRegistration` hook manages:
- Current step in the registration process
- AI detection results
- Form data state
- Processing states
- Batch ID generation

## Styling

The components use a consistent design system with:
- Green color scheme (#16a34a primary)
- Rounded corners (12px radius)
- Shadow effects for depth
- Responsive layout
- Safe area handling
