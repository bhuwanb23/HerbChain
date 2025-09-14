# Training Screen Module

This module provides a comprehensive training and support system for farmers, converted from the HTML prototype into React Native components.

## Structure

```
trainings/
├── components/
│   ├── HeroSection.js          # Main hero section with stats
│   ├── FeaturedVideo.js        # Featured video card
│   ├── VideoGrid.js           # Grid of training videos
│   ├── LanguageFilter.js      # Language selection filter
│   ├── QuickActions.js        # Quick support actions
│   ├── FAQSection.js          # FAQ accordion section
│   ├── FloatingChatButton.js  # Floating help button
│   └── index.js               # Component exports
├── hooks/
│   ├── useTraining.js         # Training state management
│   └── index.js               # Hook exports
├── constants/
│   ├── trainingData.js        # Training data and content
│   └── index.js               # Constant exports
├── training.js                # Main training screen
└── README.md                  # This file
```

## Components

### HeroSection
- Displays the main "Learn & Earn" section
- Shows training statistics (videos, languages, support)
- Features farmer illustration and gradient background

### FeaturedVideo
- Large featured video card with thumbnail
- Shows video metadata (duration, views, language, rating)
- Play button overlay for video interaction

### VideoGrid
- Grid layout for additional training videos
- Compact video cards with thumbnails
- Language indicators for each video

### LanguageFilter
- Language selection buttons
- Active state management
- Supports multiple languages (Hindi, English, Tamil, Telugu)

### QuickActions
- Support action buttons (Live Chat, Call Now)
- Gradient backgrounds for visual appeal
- Direct contact options

### FAQSection
- Expandable FAQ items
- Smooth accordion animation
- Comprehensive farming-related questions

### FloatingChatButton
- Fixed position help button
- Tooltip with "Need Help?" text
- Always accessible support option

## Hooks

### useTraining
Manages training screen state including:
- Selected language filter
- Expanded FAQ state
- Event handlers for all interactions

## Constants

### Training Data
- `TRAINING_STATS`: Statistics for hero section
- `FEATURED_VIDEO`: Main featured video data
- `TRAINING_VIDEOS`: Additional video content
- `SUPPORTED_LANGUAGES`: Available language options
- `QUICK_ACTIONS`: Support action configurations
- `FAQ_DATA`: Frequently asked questions

## Features

- **Responsive Design**: Adapts to different screen sizes
- **Interactive Elements**: Touch-friendly buttons and cards
- **Language Support**: Multi-language content filtering
- **Video Integration**: Ready for video player integration
- **Support System**: Multiple ways to get help
- **FAQ System**: Expandable question/answer interface
- **Floating Help**: Always-accessible support button

## Usage

The training screen integrates seamlessly with the farmer navigation system and provides a comprehensive learning and support experience.

## Dependencies

- `expo-linear-gradient`: For gradient backgrounds
- `react-native-vector-icons`: For icons
- `react-native-safe-area-context`: For safe area handling
