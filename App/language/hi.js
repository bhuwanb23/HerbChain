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
};
