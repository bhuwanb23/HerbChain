export const en = {
  // Login Section
  login: {
    appName: 'HerbChain',
    tagline: 'From Roots to Remedies,\nTraced with Trust',
    mobileEmailLabel: 'Mobile/Email',
    mobileEmailPlaceholder: 'Enter mobile or email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Login',
    selectRole: 'Select your role',
    roles: {
      farmer: 'Farmer',
      transporter: 'Transporter',
      lab: 'Lab',
      ayushAdmin: 'AYUSH/Admin',
      consumer: 'Consumer',
      manufacturer: 'Manufacturer',
    },
    noAccount: "Don't have an account? ",
    signUp: 'Sign Up',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    quickLoginTitle: 'Quick Login',
    quickLoginText: 'Simply select a role and click Login to navigate to the respective dashboard.\nNo email/password required for testing!',
    selectLanguage: 'Select Language',
    errorTitle: 'Error',
    selectRoleFirst: 'Please select a role first',
    successTitle: 'Success',
    loginSuccessful: 'Login successful as',
    signUpAlert: 'Navigate to sign up screen',
    forgotPasswordAlert: 'Navigate to forgot password screen',
    privacyPolicyAlert: 'Navigate to privacy policy',
    termsOfServiceAlert: 'Navigate to terms of service',
  },

  // Farmer Dashboard Section
  farmerDashboard: {
    greeting: 'Hello Ramesh!',
    subtitle: "Here's your progress today",
    todayHarvestSummary: "Today's Harvest Summary",
    kgHarvested: 'kg Harvested',
    revenue: 'Revenue',
    
    // Stats Cards
    activeBatches: 'Active Batches',
    pendingPayments: 'Pending Payments',
    notifications: 'Notifications',
    trainingTips: 'Training Tips',
    
    // Action Buttons
    myHerbBatches: 'My Herb Batches',
    salesRevenue: 'Sales & Revenue',
    harvestSchedule: 'Harvest Schedule',
    trainingAndTips: 'Training & Tips',
    
    // Activity Feed
    recentActivity: 'Recent Activity',
    activities: {
      basilReady: 'Basil batch #B-2024-03 ready for harvest',
      paymentReceived: 'Payment received: ₹4,200',
      mintWatering: 'Mint batch needs watering',
    },
    timeAgo: {
      hoursAgo: 'hours ago',
      dayAgo: 'day ago',
    },
    
    // Navigation Alerts
    navigationAlerts: {
      herbBatches: 'Navigate to Herb Batches',
      salesRevenue: 'Navigate to Sales & Revenue',
      harvestSchedule: 'Navigate to Harvest Schedule',
      trainingTips: 'Navigate to Training & Tips',
      navigation: 'Navigation',
    },
  },

  // Herb Register Section
  herbRegister: {
    // Screen Titles
    herbRegistration: 'Herb Registration',
    herbDetails: 'Herb Details',
    herbList: 'Herb List',
    
    // Help and Alerts
    help: 'Help',
    helpMessage: 'This screen helps you register new herb batches using AI recognition and manual entry. Take a photo of your herb and the AI will automatically identify it, then fill in the remaining details.',
    ok: 'OK',
    
    // Herb Details Labels
    herbPhoto: 'Herb Photo',
    qrCode: 'QR Code',
    qrCodeText: 'Scan this QR code to verify batch authenticity',
    batchId: 'Batch ID',
    species: 'Species',
    weight: 'Weight',
    harvestDate: 'Harvest Date',
    cultivation: 'Cultivation',
    status: 'Status',
    created: 'Created',
    updated: 'Updated',
    location: 'Location',
    notes: 'Notes',
    
    // Herb List
    pendingPickup: 'Pending Pickup',
    pendingPickupSubtitle: 'Ready for transporter pickup',
    accepted: 'Accepted',
    acceptedSubtitle: 'Other batches in your list',
    
    // AI Recognition
    aiRecognition: 'AI Recognition',
    takePhoto: 'Take Photo',
    processing: 'Processing...',
    analyzing: 'Analyzing herb image...',
    detected: 'Detected',
    confidence: 'Confidence',
    
    // Manual Entry
    manualEntry: 'Manual Entry',
    enterDetails: 'Enter herb details manually',
    speciesName: 'Species Name',
    weightKg: 'Weight (kg)',
    cultivationMethod: 'Cultivation Method',
    harvestDateLabel: 'Harvest Date',
    remarks: 'Remarks',
    
    // Bottom Actions
    generateBatch: 'Generate Batch',
    saveBatch: 'Save Batch',
    viewQR: 'View QR Code',
    complete: 'Complete',
    
    // Progress Steps
    step1: 'Photo',
    step2: 'Details',
    step3: 'Complete',
    
    // Status Values
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    testing: 'Testing',
    
    // Cultivation Methods
    organic: 'Organic',
    conventional: 'Conventional',
    hydroponic: 'Hydroponic',
    greenhouse: 'Greenhouse',
    
    // Additional UI Text
    uploadFromGallery: 'Upload from Gallery',
    useExistingPhoto: 'Use existing photo',
    aiSuccess: 'AI Success',
    aiWillIdentify: 'AI will identify the herb automatically',
    
    // Manual Entry Form
    fillDetailsManually: 'Fill in the details manually',
    selectHerbSpecies: 'Select herb species...',
    selectCultivationMethod: 'Select cultivation method...',
    additionalNotesOptional: 'Additional Notes (Optional)',
    additionalNotesPlaceholder: 'Any additional information about the harvest...',
    
    // Bottom Actions
    batchIdGenerated: 'Batch ID Generated!',
    generating: 'Generating...',
    generateBatchId: 'Generate Batch ID',
    batchReadyForTracking: 'Your batch is ready for tracking',
    createUniqueIdentifier: 'create a unique identifier for tracking',
    
    // Progress Bar - using simple concatenation instead
  },

  // Transporter Dashboard Section
  transporterDashboard: {
    // Welcome Banner
    welcomeBack: 'Welcome back, Mike!',
    vehicleId: 'Vehicle ID: TR-2847 • Today\'s Status',
    completed: 'Completed',
    active: 'Active',
    pending: 'Pending',
    
    // Quick Actions
    startTrip: 'Start Trip',
    scanBatch: 'Scan Batch',
    confirm: 'Confirm',
    
    // Notifications Panel
    alerts: 'Alerts',
    routeDelayAlert: 'Route Delay Alert',
    routeDelayMessage: 'Traffic on Route A-102, +15 min delay expected',
    handoverReady: 'Handover Ready',
    handoverMessage: 'Package #TR-8847 ready for customer pickup',
    fuelLowWarning: 'Fuel Low Warning',
    fuelLowMessage: 'Consider refueling at next stop',
    minAgo: 'min ago',
    
    // Trip Cards
    activeTrips: 'Active Trips',
    eta: 'ETA',
    kmRemaining: 'km remaining',
    scheduled: 'Scheduled',
    delivered: 'Delivered',
    customer: 'Customer',
    progress: 'Progress',
    preparation: 'Preparation',
    status: 'Status',
    ready: 'Ready',
    
    // Trip Status
    tripActive: 'ACTIVE',
    tripPending: 'PENDING',
    tripCompleted: 'COMPLETED',
  },

  // Transporter Trips Section
  transporterTrips: {
    // Tab Labels
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    
    // Section Headers
    pendingPickup: 'Pending Pickup',
    pendingPickupSubtitle: 'Scan farmer QR to start trip',
    activeTrips: 'Active Trips',
    inTransit: 'In Transit',
    completedTrips: 'Completed Trips',
    deliveredBatchesHistory: 'Delivered batches history',
    
    // Loading and Placeholders
    loading: 'Loading...',
    noCompletedTrips: 'No completed trips yet.',
    deliverBatchesToSee: 'Deliver batches to see them here.',
    
    // Trip Card Content
    batch: 'Batch',
    farmer: 'Farmer',
    owner: 'Owner',
    pendingStatus: 'Pending',
    inTransitStatus: 'In Transit',
    transporterQR: 'Transporter QR',
    
    // Action Buttons
    scanQR: 'Scan QR',
    deliverToManufacturer: 'Deliver to Manufacturer',
    
    // Scanner
    close: 'Close',
  },
};
