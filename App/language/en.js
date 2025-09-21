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

  // Lab Dashboard Section
  labDashboard: {
    // Stats Grid
    pendingBatches: 'Pending Batches',
    needTesting: 'Need testing',
    urgentRequests: 'Urgent Requests',
    fastTrackTesting: 'Fast-track testing',
    completed: 'Completed',
    thisWeek: 'This week',
    failedCompliance: 'Failed Compliance',
    needsRetest: 'Needs retest',
    
    // Quick Actions
    quickActions: 'Quick Actions',
    batchVerification: 'Batch Verification',
    testingResults: 'Testing & Results',
    
    // Notifications Panel
    recentNotifications: 'Recent Notifications',
    viewAll: 'View All',
    batchFailedCompliance: 'Batch #B2024-0156 failed compliance',
    contaminantLevelsExceeded: 'Contaminant levels exceeded threshold',
    urgentRequestBatch: 'Urgent request: Batch #B2024-0158',
    priorityTestingRequired: 'Priority testing required by EOD',
    batchCompleted: 'Batch #B2024-0154 completed',
    allTestsPassed: 'All tests passed, report generated',
    viewDetails: 'View Details',
    startTesting: 'Start Testing',
    viewReport: 'View Report',
    hoursAgo: 'hours ago',
    
    // Recent Activity
    recentActivity: 'Recent Activity',
    batchAnalysisCompleted: 'Batch #B2024-0153 analysis completed',
    startedTestingBatch: 'Started testing Batch #B2024-0157',
    retestScheduled: 'Retest scheduled for Batch #B2024-0155',
    minutesAgo: 'minutes ago',
    hourAgo: 'hour ago',
  },

  // Lab Batches Section
  labBatches: {
    // Page Header
    labBatches: 'Lab Batches',
    browseAcceptArchive: 'Browse, accept, and archive incoming herbs',
    
    // Tabs
    batchList: 'Batch List',
    accepted: 'Accepted',
    archived: 'Archived',
    
    // Modal
    herbDetails: 'Herb Details',
    close: 'Close',
    labQR: 'Lab QR',
    
    // Batch Item Fields
    batchId: 'Batch ID',
    farmer: 'Farmer',
    species: 'Species',
    weight: 'Weight',
    harvest: 'Harvest',
    status: 'Status',
    location: 'Location',
    
    // Status Values
    acceptedStatus: 'Accepted',
    pending: 'Pending',
    
    // Action Buttons
    acceptForTesting: 'Accept for Testing',
    accepting: 'Accepting...',
    scanTransporterQR: 'Scan Transporter QR',
    
    // Alerts
    success: 'Success',
    herbAcceptedSuccess: 'Herb accepted for testing successfully!',
    error: 'Error',
    failedToAcceptHerb: 'Failed to accept herb',
    deliveryFailed: 'Delivery Failed',
    unableToValidateQR: 'Unable to validate QR',
    deliverySuccess: 'Delivery Success',
    ownershipTransferred: 'Ownership transferred to lab.',
    failedToCompleteDelivery: 'Failed to complete delivery',
  },

  // Lab Testing Section
  labTesting: {
    // Page Header
    labTestingDashboard: 'Lab Testing Dashboard',
    
    // Herb Lists
    herbsWithNoTestUploaded: 'Herbs with No Test Uploaded',
    testedUploadedHerbs: 'Tested/Uploaded Herbs',
    
    // Offline Banner
    workingOffline: 'Working offline - Changes will sync when connected',
    
    // Batch Header
    batch: 'Batch',
    received: 'Received',
    
    // Test Results Section
    enterTestResults: 'Enter Test Results',
    moistureContent: 'Moisture Content',
    percentage: 'Percentage (%)',
    enterPercentage: 'Enter percentage',
    pesticideResidues: 'Pesticide Residues',
    enterValue: 'Enter value',
    phytochemicalLevels: 'Phytochemical Levels',
    quantitativeMarkers: 'Quantitative markers',
    purityPercentage: 'Purity Percentage',
    heavyMetalsPresent: 'Heavy Metals Present',
    yesNo: 'Yes/No',
    microbialContamination: 'Microbial Contamination',
    
    // Detailed Observations
    detailedObservations: 'Detailed Observations',
    addTestResultsSummary: 'Add a summary of the test results...',
    addAdditionalNotes: 'Add any additional notes...',
    enterRecommendations: 'Enter recommendations for the herb batch...',
    
    // Upload Evidence
    uploadEvidence: 'Upload Evidence',
    fileUploadedSuccessfully: 'File uploaded successfully',
    dragDropOrTapToUpload: 'Drag & drop or tap to upload',
    chooseFile: 'Choose File',
    
    // Action Buttons
    saveOffline: 'Save Offline',
    submitResults: 'Submit Results',
    
    // Upload Types
    testReports: 'Test Reports',
    uploadPDFReports: 'Upload PDF reports from equipment',
    labPhotos: 'Lab Photos',
    uploadPhotosOfSamples: 'Upload photos of samples and equipment',
    certificates: 'Certificates',
    uploadComplianceCertificates: 'Upload compliance certificates',
  },

  // Manufacturer Dashboard Section
  manufacturerDashboard: {
    // Loading & Error States
    loadingDashboardData: 'Loading dashboard data...',
    errorLoadingDashboard: 'Error loading dashboard',
    
    // Welcome Banner
    hello: 'Hello',
    heresTodaysOverview: "here's today's overview.",
    
    // Dashboard Cards
    activeBatches: 'Active Batches',
    pendingDeliveries: 'Pending Deliveries',
    recentCertifications: 'Recent Certifications',
    productsCreated: 'Products Created',
    
    // Notifications Section
    notifications: 'Notifications',
    newLabCertifiedHerbs: 'New lab-certified herbs ready for pickup.',
    urgentBatchQualityAlert: 'Urgent: Batch HERB-XYZ has a quality alert.',
    newProductionGuidelines: 'New production guidelines released.',
    
    // Quick Actions
    quickActions: 'Quick Actions',
    herbInventory: 'Herb Inventory',
    createProduct: 'Create Product',
    
    // Recent Certifications
    recentCertificationsTitle: 'Recent Certifications',
    viewAll: 'View All',
    certified: 'Certified',
    pending: 'Pending',
    rejected: 'Rejected',
    hoursAgo: 'hours ago',
    
    // Monthly Production Chart
    monthlyProduction: 'Monthly Production',
    productionTrends: 'Production trends over the last 6 months',
  },

  // Raw Herb Management Section
  rawHerbManagement: {
    // Tab Labels
    availableHerbs: 'Available Herbs',
    orderedHerbs: 'Ordered Herbs',
    scannedDetails: 'Scanned Details',
    
    // QR Scanner
    requestingCameraPermission: 'Requesting for camera permission',
    noAccessToCamera: 'No access to camera',
    scanTheQRCode: 'Scan the QR Code',
    qrCodeScanned: 'QR Code Scanned',
    data: 'Data',
    ok: 'OK',
    tapToScanAgain: 'Tap to Scan Again',
    close: 'Close',
    
    // Available Herbs List
    noAvailableHerbs: 'No available herbs to display.',
    batchId: 'Batch ID',
    farmer: 'Farmer',
    harvest: 'Harvest',
    latestLabReport: 'Latest Lab Report:',
    certified: 'Certified',
    notCertified: 'Not Certified',
    standard: 'Standard',
    purity: 'Purity',
    orderHerb: 'Order Herb',
    
    // Ordered Herbs List
    noHerbsOrdered: 'No herbs have been ordered yet.',
    orderNow: 'Order Now',
    ordered: 'Ordered',
    receiveHerbScanQR: 'Receive Herb (Scan Transporter QR)',
    
    // Herb Details Modal
    herbDetails: 'Herb Details',
    speciesName: 'Species Name',
    weight: 'Weight',
    harvestDate: 'Harvest Date',
    location: 'Location',
    qualityStatus: 'Quality Status',
    labReports: 'Lab Reports',
    certification: 'Certification',
    certificationLevel: 'Certification Level',
    purityPercentage: 'Purity Percentage',
    pesticideResidues: 'Pesticide Residues',
    moistureContent: 'Moisture Content',
    phytochemicalLevels: 'Phytochemical Levels',
    heavyMetals: 'Heavy Metals',
    microbialContamination: 'Microbial Contamination',
    reportDate: 'Report Date',
    
    // Scanned Herb Details
    scannedHerbInformation: 'Scanned Herb Information',
    clearScannedDetails: 'Clear Scanned Details',
    
    // Status Values
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    
    // Alert Messages
    error: 'Error',
    noHerbSelectedForReceiving: 'No herb selected for receiving.',
    herbReceivedSuccessfully: 'Herb received successfully!',
    failedToReceiveHerb: 'Failed to receive herb',
  },

  // Production Section
  production: {
    // Main Navigation
    backToProducts: 'Back to Products',
    productCreated: 'Product Created',
    productCreatedSuccess: 'Your new product has been successfully created!',
    
    // Product List
    noProductsCreated: 'No products created yet.',
    tapToCreateProduct: "Tap the '+' button to create a new product.",
    
    // Step 1 - Select Herbs
    selectCertifiedHerbs: 'Select Certified Herbs',
    chooseHerbsForFormulation: 'Choose the herbs for your product formulation',
    selectionRequired: 'Selection Required',
    selectAtLeastOneHerb: 'Please select at least one herb to continue.',
    continueToFormulation: 'Continue to Formulation',
    
    // Step 2 - Formulation
    productFormulation: 'Product Formulation',
    defineProportionsAndProcessing: 'Define proportions and processing details',
    herbProportions: 'Herb Proportions',
    processingMethod: 'Processing Method',
    processingNotes: 'Processing Notes',
    addProcessingNotes: 'Add any specific processing notes or instructions...',
    previous: 'Previous',
    continueToLinkBatches: 'Continue to Link Batches',
    
    // Step 3 - Link Batches
    linkBatches: 'Link Batches',
    linkHerbBatches: 'Link herb batches to your product for traceability',
    linkedBatches: 'Linked Batches',
    noLinkedBatches: 'No batches linked yet.',
    continueToQRGeneration: 'Continue to QR Generation',
    
    // Step 4 - Generate QR
    generateProductQR: 'Generate Product QR',
    qrCodeGenerated: 'QR code generated for product traceability',
    productQRCode: 'Product QR Code',
    traceabilitySummary: 'Traceability Summary',
    productId: 'Product ID',
    totalHerbs: 'Total Herbs',
    processingMethodUsed: 'Processing Method',
    batchesLinked: 'Batches Linked',
    createNewProduct: 'Create New Product',
    
    // Herb Selection Card
    certified: 'Certified',
    origin: 'Origin',
    purity: 'Purity',
    
    // Product Details
    productDetails: 'Product Details',
    ingredients: 'Ingredients',
    processing: 'Processing',
    traceability: 'Traceability',
    qrCode: 'QR Code',
    
    // Progress Steps
    step: 'Step',
    selectHerbs: 'Select Herbs',
    formulation: 'Formulation',
    linkBatchesStep: 'Link Batches',
    generateQR: 'Generate QR',
    
    // Processing Methods
    extraction: 'Extraction',
    drying: 'Drying',
    grinding: 'Grinding',
    fermentation: 'Fermentation',
    distillation: 'Distillation',
    
    // General
    proportion: 'Proportion',
    percentage: 'Percentage',
    weight: 'Weight',
    batch: 'Batch',
    date: 'Date',
    status: 'Status',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    notCertified: 'Not Certified',
  },

  // Consumer pages
  consumer: {
    // Home page
    welcomeBack: 'Welcome back!',
    verifyAuthenticity: 'Verify the authenticity of your herbs',
    herbsScanned: 'Herbs Scanned',
    verifiedProducts: 'Verified Products',
    thisMonth: 'This Month',
    quickActions: 'Quick Actions',
    scanQRCode: 'Scan QR Code',
    verifyHerbAuthenticity: 'Verify herb authenticity',
    traceProduct: 'Trace Product',
    trackHerbJourney: 'Track herb journey',
    viewHistory: 'View History',
    seePastScans: 'See past scans',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    verified: 'Verified',
    tipsForHerbVerification: 'Tips for Herb Verification',
    alwaysScanBeforeUse: 'Always scan before use',
    verifyAuthenticityTip: 'Verify the authenticity and quality of your herbs by scanning the QR code on the packaging.',

    // History page
    scanHistory: 'Scan History',
    trackAllVerifications: 'Track all your herb verifications',
    searchPlaceholder: 'Search herbs, batches, or farmers...',
    all: 'All',
    pending: 'Pending',
    recent: 'Recent',
    batch: 'Batch',
    farmer: 'Farmer',
    viewDetails: 'View Details',
    share: 'Share',
    noScanHistoryFound: 'No scan history found',
    adjustSearchTerms: 'Try adjusting your search terms',
    startScanningHerbs: 'Start scanning herbs to see your history here',
    scanYourFirstHerb: 'Scan Your First Herb',

    // Profile page
    personalInformation: 'Personal Information',
    updateProfileDetails: 'Update your profile details',
    preferences: 'Preferences',
    customizeExperience: 'Customize your experience',
    privacySettings: 'Privacy Settings',
    controlDataPrivacy: 'Control your data privacy',
    security: 'Security',
    passwordAuthentication: 'Password and authentication',
    helpSupport: 'Help & Support',
    getHelpContactSupport: 'Get help and contact support',
    sendFeedback: 'Send Feedback',
    helpImproveApp: 'Help us improve the app',
    aboutHerbChain: 'About HerbChain',
    learnMoreMission: 'Learn more about our mission',
    totalScans: 'Total Scans',
    favorites: 'Favorites',
    scanQR: 'Scan QR',
    appSettings: 'App Settings',
    pushNotifications: 'Push Notifications',
    getNotifiedScanResults: 'Get notified about scan results',
    autoScanMode: 'Auto-Scan Mode',
    automaticallyScan: 'Automatically scan when camera opens',
    biometricLogin: 'Biometric Login',
    useFingerprintFaceID: 'Use fingerprint or face ID',
    account: 'Account',
    support: 'Support',
    logout: 'Logout',
    memberSince: 'Member since',
    comingSoon: 'Coming Soon',
    personalInfoEditingSoon: 'Personal information editing will be available soon.',
    preferencesSoon: 'Preferences will be available soon.',
    privacySettingsSoon: 'Privacy settings will be available soon.',
    securitySettingsSoon: 'Security settings will be available soon.',
    contactSupport: 'Contact us at support@herbchain.com',
    feedbackThankYou: 'Thank you for your interest in providing feedback!',
    aboutHerbChainDescription: 'HerbChain ensures authenticity and traceability of herbal products through blockchain technology.',
    logoutConfirm: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    loggedOut: 'You have been successfully logged out.',
    appVersion: 'HerbChain v1.0.0',
    copyright: '© 2024 HerbChain. All rights reserved.',

    // QR Scan page
    scanHerbQRCode: 'Scan Herb QR Code',
    pointCameraAtQR: 'Point your camera at the QR code on your herb product to view detailed information about its origin, quality, and journey.',
    scanQRCode: 'Scan QR Code',
    loading: 'Loading...',
    or: 'OR',
    enterBatchIDManually: 'Enter Batch ID Manually',
    enterBatchIDPlaceholder: 'Enter batch ID (e.g., HERB-ASH-001)',
    search: 'Search',
    qrCodesFoundOnPackaging: 'QR codes are found on herb product packaging and contain unique batch identification information.',
    invalidQRFormat: 'Invalid QR code format. Please scan a valid herb batch QR code.',
    errorProcessingQR: 'Error processing QR code. Please try again.',
    pleaseEnterBatchID: 'Please enter a batch ID',
    invalidBatchIDFormat: 'Invalid batch ID format. Please enter a valid batch ID.',
    failedToFetchHerbDetails: 'Failed to fetch herb details. Please try again.',

    // Traceability page
    verifiedAuthentic: 'Verified Authentic',
    farmToYou: 'Farm to You',
    farmerSpotlight: 'Farmer Spotlight',
    generationFarmer: '3rd Generation Farmer',
    organicFarmingSpecialist: 'Organic farming specialist with 20+ years experience growing premium Ashwagandha in Rajasthan\'s fertile soil.',
    journeyTimeline: 'Journey Timeline',
    harvested: 'Harvested',
    handPickedOptimalMaturity: 'Hand-picked at optimal maturity during early morning hours to preserve potency.',
    testedForPurity: 'Tested for Purity',
    labTestedHeavyMetals: 'Laboratory tested for heavy metals, pesticides, and withanolide content. 99.8% purity confirmed.',
    packaged: 'Packaged',
    sealedAirtightUV: 'Sealed in airtight, UV-protected packaging to maintain freshness and potency.',
    organicCertified: 'Organic Certified',
    gmpCompliant: 'GMP Compliant',
    loadingTraceabilityData: 'Loading herb traceability data...',
    errorLoadingData: 'Error loading data',
    noDataFoundForBatch: 'No data found for batch',
  },

  // Farmers Payments Section
  farmerPayments: {
    // Header
    transactions: 'Transactions',
    
    // Wallet Summary
    totalBalance: 'Total Balance',
    incentivesEarned: 'Incentives Earned',
    thisMonth: 'This Month',
    withdrawToBank: 'Withdraw to Bank',
    
    // Tabs
    pendingPayments: 'Pending Payments',
    completed: 'Completed',
    
    // Transaction Card
    pending: 'Pending',
    completed: 'Completed',
    amount: 'Amount',
    expected: 'Expected',
    paidOn: 'Paid on',
    batchNumber: 'Batch #',
    
    // Transaction Types
    buyer: 'Buyer',
    manufacturer: 'Manufacturer',
    processor: 'Processor',
    distributor: 'Distributor',
    
    // Status Messages
    paymentProcessing: 'Payment is being processed',
    paymentCompleted: 'Payment has been completed',
    expectedPaymentDate: 'Expected payment date',
    actualPaymentDate: 'Actual payment date',
    
    // Actions
    viewDetails: 'View Details',
    downloadReceipt: 'Download Receipt',
    contactSupport: 'Contact Support',
    
    // Error Messages
    noTransactionsFound: 'No transactions found',
    loadingTransactions: 'Loading transactions...',
    errorLoadingTransactions: 'Error loading transactions',
    
    // Success Messages
    withdrawalRequested: 'Withdrawal request submitted successfully',
    paymentReceived: 'Payment received successfully',
    
    // Additional UI Text
    successTitle: 'Success',
    transactionDetails: 'Transaction Details',
    continue: 'Continue',
    ok: 'OK',
    withdrawFunds: 'Withdraw Funds',
    withdrawDescription: 'This feature will redirect you to your bank account for withdrawal.',
  },
};
