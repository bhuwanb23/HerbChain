export const hi = {
  // Login Section
  login: {
    appName: 'हर्बचेन',
    tagline: 'जड़ों से उपचार तक,\nविश्वास के साथ ट्रेस किया गया',
    mobileEmailLabel: 'मोबाइल/ईमेल',
    mobileEmailPlaceholder: 'मोबाइल या ईमेल दर्ज करें',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'पासवर्ड दर्ज करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    loginButton: 'लॉगिन',
    selectRole: 'अपनी भूमिका चुनें',
    roles: {
      farmer: 'किसान',
      transporter: 'परिवहनकर्ता',
      lab: 'प्रयोगशाला',
      ayushAdmin: 'आयुष/व्यवस्थापक',
      consumer: 'उपभोक्ता',
      manufacturer: 'निर्माता',
    },
    noAccount: 'खाता नहीं है? ',
    signUp: 'साइन अप',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    quickLoginTitle: 'त्वरित लॉगिन',
    quickLoginText: 'बस एक भूमिका चुनें और संबंधित डैशबोर्ड पर जाने के लिए लॉगिन पर क्लिक करें।\nपरीक्षण के लिए ईमेल/पासवर्ड की आवश्यकता नहीं!',
    selectLanguage: 'भाषा चुनें',
    errorTitle: 'त्रुटि',
    selectRoleFirst: 'कृपया पहले एक भूमिका चुनें',
    successTitle: 'सफलता',
    loginSuccessful: 'लॉगिन सफल रहा',
    signUpAlert: 'साइन अप स्क्रीन पर जाएं',
    forgotPasswordAlert: 'पासवर्ड भूल गए स्क्रीन पर जाएं',
    privacyPolicyAlert: 'गोपनीयता नीति पर जाएं',
    termsOfServiceAlert: 'सेवा की शर्तों पर जाएं',
  },

  // Farmer Dashboard Section
  farmerDashboard: {
    greeting: 'नमस्ते रमेश!',
    subtitle: 'यहाँ आज की आपकी प्रगति है',
    todayHarvestSummary: 'आज की फसल का सारांश',
    kgHarvested: 'किलो कटाई',
    revenue: 'आय',
    
    // Stats Cards
    activeBatches: 'सक्रिय बैच',
    pendingPayments: 'लंबित भुगतान',
    notifications: 'सूचनाएं',
    trainingTips: 'प्रशिक्षण सुझाव',
    
    // Action Buttons
    myHerbBatches: 'मेरे जड़ी-बूटी बैच',
    salesRevenue: 'बिक्री और आय',
    harvestSchedule: 'फसल कार्यक्रम',
    trainingAndTips: 'प्रशिक्षण और सुझाव',
    
    // Activity Feed
    recentActivity: 'हाल की गतिविधि',
    activities: {
      basilReady: 'तुलसी बैच #B-2024-03 कटाई के लिए तैयार',
      paymentReceived: 'भुगतान प्राप्त: ₹4,200',
      mintWatering: 'पुदीना बैच को पानी की जरूरत',
    },
    timeAgo: {
      hoursAgo: 'घंटे पहले',
      dayAgo: 'दिन पहले',
    },
    
    // Navigation Alerts
    navigationAlerts: {
      herbBatches: 'जड़ी-बूटी बैच पर जाएं',
      salesRevenue: 'बिक्री और आय पर जाएं',
      harvestSchedule: 'फसल कार्यक्रम पर जाएं',
      trainingTips: 'प्रशिक्षण सुझाव पर जाएं',
      navigation: 'नेवीगेशन',
    },
  },

  // Herb Register Section
  herbRegister: {
    // Screen Titles
    herbRegistration: 'जड़ी-बूटी पंजीकरण',
    herbDetails: 'जड़ी-बूटी विवरण',
    herbList: 'जड़ी-बूटी सूची',
    
    // Help and Alerts
    help: 'सहायता',
    helpMessage: 'यह स्क्रीन आपको AI पहचान और मैन्युअल एंट्री का उपयोग करके नए जड़ी-बूटी बैच पंजीकृत करने में मदद करती है। अपनी जड़ी-बूटी की फोटो लें और AI स्वचालित रूप से इसे पहचान लेगा, फिर शेष विवरण भरें।',
    ok: 'ठीक है',
    
    // Herb Details Labels
    herbPhoto: 'जड़ी-बूटी फोटो',
    qrCode: 'QR कोड',
    qrCodeText: 'बैच प्रामाणिकता सत्यापित करने के लिए इस QR कोड को स्कैन करें',
    batchId: 'बैच ID',
    species: 'प्रजाति',
    weight: 'वजन',
    harvestDate: 'फसल की तारीख',
    cultivation: 'खेती',
    status: 'स्थिति',
    created: 'बनाया गया',
    updated: 'अपडेट किया गया',
    location: 'स्थान',
    notes: 'नोट्स',
    
    // Herb List
    pendingPickup: 'पिकअप लंबित',
    pendingPickupSubtitle: 'परिवहनकर्ता पिकअप के लिए तैयार',
    accepted: 'स्वीकृत',
    acceptedSubtitle: 'आपकी सूची में अन्य बैच',
    
    // AI Recognition
    aiRecognition: 'AI पहचान',
    takePhoto: 'फोटो लें',
    processing: 'प्रसंस्करण...',
    analyzing: 'जड़ी-बूटी छवि का विश्लेषण...',
    detected: 'पहचाना गया',
    confidence: 'विश्वास',
    
    // Manual Entry
    manualEntry: 'मैन्युअल एंट्री',
    enterDetails: 'जड़ी-बूटी विवरण मैन्युअल रूप से दर्ज करें',
    speciesName: 'प्रजाति का नाम',
    weightKg: 'वजन (किलो)',
    cultivationMethod: 'खेती की विधि',
    harvestDateLabel: 'फसल की तारीख',
    remarks: 'टिप्पणी',
    
    // Bottom Actions
    generateBatch: 'बैच जेनरेट करें',
    saveBatch: 'बैच सेव करें',
    viewQR: 'QR कोड देखें',
    complete: 'पूर्ण',
    
    // Progress Steps
    step1: 'फोटो',
    step2: 'विवरण',
    step3: 'पूर्ण',
    
    // Status Values
    pending: 'लंबित',
    approved: 'अनुमोदित',
    rejected: 'अस्वीकृत',
    testing: 'परीक्षण',
    
    // Cultivation Methods
    organic: 'जैविक',
    conventional: 'पारंपरिक',
    hydroponic: 'हाइड्रोपोनिक',
    greenhouse: 'ग्रीनहाउस',
    
    // Additional UI Text
    uploadFromGallery: 'गैलरी से अपलोड करें',
    useExistingPhoto: 'मौजूदा फोटो का उपयोग करें',
    aiSuccess: 'AI सफलता',
    aiWillIdentify: 'AI स्वचालित रूप से जड़ी-बूटी की पहचान करेगा',
    
    // Manual Entry Form
    fillDetailsManually: 'विवरण मैन्युअल रूप से भरें',
    selectHerbSpecies: 'जड़ी-बूटी प्रजाति चुनें...',
    selectCultivationMethod: 'खेती की विधि चुनें...',
    additionalNotesOptional: 'अतिरिक्त नोट्स (वैकल्पिक)',
    additionalNotesPlaceholder: 'फसल के बारे में कोई अतिरिक्त जानकारी...',
    
    // Bottom Actions
    batchIdGenerated: 'बैच ID जेनरेट हो गया!',
    generating: 'जेनरेट कर रहे हैं...',
    generateBatchId: 'बैच ID जेनरेट करें',
    batchReadyForTracking: 'आपका बैच ट्रैकिंग के लिए तैयार है',
    createUniqueIdentifier: 'ट्रैकिंग के लिए एक अनूठा पहचानकर्ता बनाएं',
    
    // Progress Bar - using simple concatenation instead
  },

  // Transporter Dashboard Section
  transporterDashboard: {
    // Welcome Banner
    welcomeBack: 'वापसी पर स्वागत है, माइक!',
    vehicleId: 'वाहन ID: TR-2847 • आज की स्थिति',
    completed: 'पूर्ण',
    active: 'सक्रिय',
    pending: 'लंबित',
    
    // Quick Actions
    startTrip: 'यात्रा शुरू करें',
    scanBatch: 'बैच स्कैन करें',
    confirm: 'पुष्टि करें',
    
    // Notifications Panel
    alerts: 'अलर्ट',
    routeDelayAlert: 'मार्ग देरी अलर्ट',
    routeDelayMessage: 'मार्ग A-102 पर ट्रैफिक, +15 मिनट देरी अपेक्षित',
    handoverReady: 'हैंडओवर तैयार',
    handoverMessage: 'पैकेज #TR-8847 ग्राहक पिकअप के लिए तैयार',
    fuelLowWarning: 'ईंधन कम चेतावनी',
    fuelLowMessage: 'अगले स्टॉप पर ईंधन भरने पर विचार करें',
    minAgo: 'मिनट पहले',
    
    // Trip Cards
    activeTrips: 'सक्रिय यात्राएं',
    eta: 'ETA',
    kmRemaining: 'किमी शेष',
    scheduled: 'निर्धारित',
    delivered: 'वितरित',
    customer: 'ग्राहक',
    progress: 'प्रगति',
    preparation: 'तैयारी',
    status: 'स्थिति',
    ready: 'तैयार',
    
    // Trip Status
    tripActive: 'सक्रिय',
    tripPending: 'लंबित',
    tripCompleted: 'पूर्ण',
  },

  // Transporter Trips Section
  transporterTrips: {
    // Tab Labels
    pending: 'लंबित',
    active: 'सक्रिय',
    completed: 'पूर्ण',
    
    // Section Headers
    pendingPickup: 'पिकअप लंबित',
    pendingPickupSubtitle: 'यात्रा शुरू करने के लिए किसान QR स्कैन करें',
    activeTrips: 'सक्रिय यात्राएं',
    inTransit: 'परिवहन में',
    completedTrips: 'पूर्ण यात्राएं',
    deliveredBatchesHistory: 'वितरित बैच इतिहास',
    
    // Loading and Placeholders
    loading: 'लोड हो रहा है...',
    noCompletedTrips: 'अभी तक कोई पूर्ण यात्रा नहीं।',
    deliverBatchesToSee: 'उन्हें यहां देखने के लिए बैच वितरित करें।',
    
    // Trip Card Content
    batch: 'बैच',
    farmer: 'किसान',
    owner: 'मालिक',
    pendingStatus: 'लंबित',
    inTransitStatus: 'परिवहन में',
    transporterQR: 'परिवहनकर्ता QR',
    
    // Action Buttons
    scanQR: 'QR स्कैन करें',
    deliverToManufacturer: 'निर्माता को वितरित करें',
    
    // Scanner
    close: 'बंद करें',
  },

  // Lab Dashboard Section
  labDashboard: {
    // Stats Grid
    pendingBatches: 'लंबित बैच',
    needTesting: 'परीक्षण की आवश्यकता',
    urgentRequests: 'तत्काल अनुरोध',
    fastTrackTesting: 'फास्ट-ट्रैक परीक्षण',
    completed: 'पूर्ण',
    thisWeek: 'इस सप्ताह',
    failedCompliance: 'अनुपालन विफल',
    needsRetest: 'पुनः परीक्षण की आवश्यकता',
    
    // Quick Actions
    quickActions: 'त्वरित कार्य',
    batchVerification: 'बैच सत्यापन',
    testingResults: 'परीक्षण और परिणाम',
    
    // Notifications Panel
    recentNotifications: 'हाल की सूचनाएं',
    viewAll: 'सभी देखें',
    batchFailedCompliance: 'बैच #B2024-0156 अनुपालन विफल',
    contaminantLevelsExceeded: 'दूषित स्तर सीमा से अधिक',
    urgentRequestBatch: 'तत्काल अनुरोध: बैच #B2024-0158',
    priorityTestingRequired: 'EOD तक प्राथमिकता परीक्षण आवश्यक',
    batchCompleted: 'बैच #B2024-0154 पूर्ण',
    allTestsPassed: 'सभी परीक्षण पास, रिपोर्ट जेनरेट',
    viewDetails: 'विवरण देखें',
    startTesting: 'परीक्षण शुरू करें',
    viewReport: 'रिपोर्ट देखें',
    hoursAgo: 'घंटे पहले',
    
    // Recent Activity
    recentActivity: 'हाल की गतिविधि',
    batchAnalysisCompleted: 'बैच #B2024-0153 विश्लेषण पूर्ण',
    startedTestingBatch: 'बैच #B2024-0157 परीक्षण शुरू',
    retestScheduled: 'बैच #B2024-0155 के लिए पुनः परीक्षण निर्धारित',
    minutesAgo: 'मिनट पहले',
    hourAgo: 'घंटा पहले',
  },

  // Lab Batches Section
  labBatches: {
    // Page Header
    labBatches: 'लैब बैच',
    browseAcceptArchive: 'आने वाली जड़ी-बूटियों को ब्राउज़, स्वीकार और संग्रहीत करें',
    
    // Tabs
    batchList: 'बैच सूची',
    accepted: 'स्वीकृत',
    archived: 'संग्रहीत',
    
    // Modal
    herbDetails: 'जड़ी-बूटी विवरण',
    close: 'बंद करें',
    labQR: 'लैब QR',
    
    // Batch Item Fields
    batchId: 'बैच ID',
    farmer: 'किसान',
    species: 'प्रजाति',
    weight: 'वजन',
    harvest: 'फसल',
    status: 'स्थिति',
    location: 'स्थान',
    
    // Status Values
    acceptedStatus: 'स्वीकृत',
    pending: 'लंबित',
    
    // Action Buttons
    acceptForTesting: 'परीक्षण के लिए स्वीकार करें',
    accepting: 'स्वीकार कर रहे हैं...',
    scanTransporterQR: 'परिवहनकर्ता QR स्कैन करें',
    
    // Alerts
    success: 'सफलता',
    herbAcceptedSuccess: 'जड़ी-बूटी परीक्षण के लिए सफलतापूर्वक स्वीकार की गई!',
    error: 'त्रुटि',
    failedToAcceptHerb: 'जड़ी-बूटी स्वीकार करने में विफल',
    deliveryFailed: 'डिलीवरी विफल',
    unableToValidateQR: 'QR सत्यापित करने में असमर्थ',
    deliverySuccess: 'डिलीवरी सफल',
    ownershipTransferred: 'स्वामित्व लैब को स्थानांतरित।',
    failedToCompleteDelivery: 'डिलीवरी पूरी करने में विफल',
  },

  // Lab Testing Section
  labTesting: {
    // Page Header
    labTestingDashboard: 'लैब परीक्षण डैशबोर्ड',
    
    // Herb Lists
    herbsWithNoTestUploaded: 'बिना परीक्षण अपलोड की जड़ी-बूटियां',
    testedUploadedHerbs: 'परीक्षित/अपलोड की गई जड़ी-बूटियां',
    
    // Offline Banner
    workingOffline: 'ऑफ़लाइन काम कर रहे हैं - कनेक्ट होने पर परिवर्तन सिंक होंगे',
    
    // Batch Header
    batch: 'बैच',
    received: 'प्राप्त',
    
    // Test Results Section
    enterTestResults: 'परीक्षण परिणाम दर्ज करें',
    moistureContent: 'नमी सामग्री',
    percentage: 'प्रतिशत (%)',
    enterPercentage: 'प्रतिशत दर्ज करें',
    pesticideResidues: 'कीटनाशक अवशेष',
    enterValue: 'मान दर्ज करें',
    phytochemicalLevels: 'फाइटोकेमिकल स्तर',
    quantitativeMarkers: 'मात्रात्मक मार्करों',
    purityPercentage: 'शुद्धता प्रतिशत',
    heavyMetalsPresent: 'भारी धातुएं मौजूद',
    yesNo: 'हां/नहीं',
    microbialContamination: 'माइक्रोबियल संदूषण',
    
    // Detailed Observations
    detailedObservations: 'विस्तृत अवलोकन',
    addTestResultsSummary: 'परीक्षण परिणामों का सारांश जोड़ें...',
    addAdditionalNotes: 'कोई अतिरिक्त नोट्स जोड़ें...',
    enterRecommendations: 'जड़ी-बूटी बैच के लिए सिफारिशें दर्ज करें...',
    
    // Upload Evidence
    uploadEvidence: 'साक्ष्य अपलोड करें',
    fileUploadedSuccessfully: 'फ़ाइल सफलतापूर्वक अपलोड की गई',
    dragDropOrTapToUpload: 'अपलोड करने के लिए खींचें और छोड़ें या टैप करें',
    chooseFile: 'फ़ाइल चुनें',
    
    // Action Buttons
    saveOffline: 'ऑफ़लाइन सेव करें',
    submitResults: 'परिणाम सबमिट करें',
    
    // Upload Types
    testReports: 'परीक्षण रिपोर्ट',
    uploadPDFReports: 'उपकरण से PDF रिपोर्ट अपलोड करें',
    labPhotos: 'लैब फोटो',
    uploadPhotosOfSamples: 'नमूने और उपकरण की फोटो अपलोड करें',
    certificates: 'प्रमाणपत्र',
    uploadComplianceCertificates: 'अनुपालन प्रमाणपत्र अपलोड करें',
  },

  // Manufacturer Dashboard Section
  manufacturerDashboard: {
    // Loading & Error States
    loadingDashboardData: 'डैशबोर्ड डेटा लोड हो रहा है...',
    errorLoadingDashboard: 'डैशबोर्ड लोड करने में त्रुटि',
    
    // Welcome Banner
    hello: 'नमस्ते',
    heresTodaysOverview: 'यहाँ आज का अवलोकन है।',
    
    // Dashboard Cards
    activeBatches: 'सक्रिय बैच',
    pendingDeliveries: 'लंबित डिलीवरी',
    recentCertifications: 'हाल के प्रमाणन',
    productsCreated: 'उत्पाद बनाए गए',
    
    // Notifications Section
    notifications: 'सूचनाएं',
    newLabCertifiedHerbs: 'नई लैब-प्रमाणित जड़ी-बूटियां पिकअप के लिए तैयार।',
    urgentBatchQualityAlert: 'तत्काल: बैच HERB-XYZ में गुणवत्ता अलर्ट है।',
    newProductionGuidelines: 'नई उत्पादन दिशानिर्देश जारी किए गए।',
    
    // Quick Actions
    quickActions: 'त्वरित कार्य',
    herbInventory: 'जड़ी-बूटी इन्वेंटरी',
    createProduct: 'उत्पाद बनाएं',
    
    // Recent Certifications
    recentCertificationsTitle: 'हाल के प्रमाणन',
    viewAll: 'सभी देखें',
    certified: 'प्रमाणित',
    pending: 'लंबित',
    rejected: 'अस्वीकृत',
    hoursAgo: 'घंटे पहले',
    
    // Monthly Production Chart
    monthlyProduction: 'मासिक उत्पादन',
    productionTrends: 'पिछले 6 महीनों में उत्पादन रुझान',
  },

  // Raw Herb Management Section
  rawHerbManagement: {
    // Tab Labels
    availableHerbs: 'उपलब्ध जड़ी-बूटियां',
    orderedHerbs: 'ऑर्डर की गई जड़ी-बूटियां',
    scannedDetails: 'स्कैन किए गए विवरण',
    
    // QR Scanner
    requestingCameraPermission: 'कैमरा अनुमति का अनुरोध कर रहे हैं',
    noAccessToCamera: 'कैमरा तक पहुंच नहीं',
    scanTheQRCode: 'QR कोड स्कैन करें',
    qrCodeScanned: 'QR कोड स्कैन किया गया',
    data: 'डेटा',
    ok: 'ठीक है',
    tapToScanAgain: 'फिर से स्कैन करने के लिए टैप करें',
    close: 'बंद करें',
    
    // Available Herbs List
    noAvailableHerbs: 'प्रदर्शित करने के लिए कोई उपलब्ध जड़ी-बूटियां नहीं।',
    batchId: 'बैच ID',
    farmer: 'किसान',
    harvest: 'फसल',
    latestLabReport: 'नवीनतम लैब रिपोर्ट:',
    certified: 'प्रमाणित',
    notCertified: 'प्रमाणित नहीं',
    standard: 'मानक',
    purity: 'शुद्धता',
    orderHerb: 'जड़ी-बूटी ऑर्डर करें',
    
    // Ordered Herbs List
    noHerbsOrdered: 'अभी तक कोई जड़ी-बूटियां ऑर्डर नहीं की गई हैं।',
    orderNow: 'अभी ऑर्डर करें',
    ordered: 'ऑर्डर किया गया',
    receiveHerbScanQR: 'जड़ी-बूटी प्राप्त करें (परिवहनकर्ता QR स्कैन करें)',
    
    // Herb Details Modal
    herbDetails: 'जड़ी-बूटी विवरण',
    speciesName: 'प्रजाति का नाम',
    weight: 'वजन',
    harvestDate: 'फसल की तारीख',
    location: 'स्थान',
    qualityStatus: 'गुणवत्ता स्थिति',
    labReports: 'लैब रिपोर्ट',
    certification: 'प्रमाणन',
    certificationLevel: 'प्रमाणन स्तर',
    purityPercentage: 'शुद्धता प्रतिशत',
    pesticideResidues: 'कीटनाशक अवशेष',
    moistureContent: 'नमी सामग्री',
    phytochemicalLevels: 'फाइटोकेमिकल स्तर',
    heavyMetals: 'भारी धातुएं',
    microbialContamination: 'माइक्रोबियल संदूषण',
    reportDate: 'रिपोर्ट की तारीख',
    
    // Scanned Herb Details
    scannedHerbInformation: 'स्कैन की गई जड़ी-बूटी की जानकारी',
    clearScannedDetails: 'स्कैन किए गए विवरण साफ़ करें',
    
    // Status Values
    approved: 'अनुमोदित',
    pending: 'लंबित',
    rejected: 'अस्वीकृत',
    inTransit: 'परिवहन में',
    delivered: 'वितरित',
    
    // Alert Messages
    error: 'त्रुटि',
    noHerbSelectedForReceiving: 'प्राप्त करने के लिए कोई जड़ी-बूटी चयनित नहीं।',
    herbReceivedSuccessfully: 'जड़ी-बूटी सफलतापूर्वक प्राप्त हुई!',
    failedToReceiveHerb: 'जड़ी-बूटी प्राप्त करने में विफल',
  },

  // Production Section
  production: {
    // Main Navigation
    backToProducts: 'उत्पादों पर वापस जाएं',
    productCreated: 'उत्पाद बनाया गया',
    productCreatedSuccess: 'आपका नया उत्पाद सफलतापूर्वक बनाया गया है!',
    
    // Product List
    noProductsCreated: 'अभी तक कोई उत्पाद नहीं बनाया गया।',
    tapToCreateProduct: "नया उत्पाद बनाने के लिए '+' बटन पर टैप करें।",
    
    // Step 1 - Select Herbs
    selectCertifiedHerbs: 'प्रमाणित जड़ी-बूटियों का चयन करें',
    chooseHerbsForFormulation: 'अपने उत्पाद निर्माण के लिए जड़ी-बूटियों का चयन करें',
    selectionRequired: 'चयन आवश्यक',
    selectAtLeastOneHerb: 'जारी रखने के लिए कम से कम एक जड़ी-बूटी का चयन करें।',
    continueToFormulation: 'निर्माण पर जारी रखें',
    
    // Step 2 - Formulation
    productFormulation: 'उत्पाद निर्माण',
    defineProportionsAndProcessing: 'अनुपात और प्रसंस्करण विवरण परिभाषित करें',
    herbProportions: 'जड़ी-बूटी अनुपात',
    processingMethod: 'प्रसंस्करण विधि',
    processingNotes: 'प्रसंस्करण नोट्स',
    addProcessingNotes: 'कोई विशिष्ट प्रसंस्करण नोट्स या निर्देश जोड़ें...',
    previous: 'पिछला',
    continueToLinkBatches: 'बैच लिंक करने पर जारी रखें',
    
    // Step 3 - Link Batches
    linkBatches: 'बैच लिंक करें',
    linkHerbBatches: 'ट्रेसेबिलिटी के लिए अपने उत्पाद से जड़ी-बूटी बैच लिंक करें',
    linkedBatches: 'लिंक किए गए बैच',
    noLinkedBatches: 'अभी तक कोई बैच लिंक नहीं किया गया।',
    continueToQRGeneration: 'QR जेनरेशन पर जारी रखें',
    
    // Step 4 - Generate QR
    generateProductQR: 'उत्पाद QR जेनरेट करें',
    qrCodeGenerated: 'उत्पाद ट्रेसेबिलिटी के लिए QR कोड जेनरेट किया गया',
    productQRCode: 'उत्पाद QR कोड',
    traceabilitySummary: 'ट्रेसेबिलिटी सारांश',
    productId: 'उत्पाद ID',
    totalHerbs: 'कुल जड़ी-बूटियां',
    processingMethodUsed: 'प्रसंस्करण विधि',
    batchesLinked: 'लिंक किए गए बैच',
    createNewProduct: 'नया उत्पाद बनाएं',
    
    // Herb Selection Card
    certified: 'प्रमाणित',
    origin: 'मूल',
    purity: 'शुद्धता',
    
    // Product Details
    productDetails: 'उत्पाद विवरण',
    ingredients: 'सामग्री',
    processing: 'प्रसंस्करण',
    traceability: 'ट्रेसेबिलिटी',
    qrCode: 'QR कोड',
    
    // Progress Steps
    step: 'चरण',
    selectHerbs: 'जड़ी-बूटी चुनें',
    formulation: 'निर्माण',
    linkBatchesStep: 'बैच लिंक करें',
    generateQR: 'QR जेनरेट करें',
    
    // Processing Methods
    extraction: 'निष्कर्षण',
    drying: 'सुखाना',
    grinding: 'पीसना',
    fermentation: 'किण्वन',
    distillation: 'आसवन',
    
    // General
    proportion: 'अनुपात',
    percentage: 'प्रतिशत',
    weight: 'वजन',
    batch: 'बैच',
    date: 'तारीख',
    status: 'स्थिति',
    view: 'देखें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    notCertified: 'प्रमाणित नहीं',
  },
};
