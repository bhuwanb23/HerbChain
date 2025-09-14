// Training data constants
export const TRAINING_STATS = {
  totalVideos: 250,
  languages: 15,
  support: '24/7',
};

export const FEATURED_VIDEO = {
  id: 1,
  title: 'How to Harvest Sustainably',
  description: 'Learn the best practices for sustainable harvesting',
  thumbnail: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b3f4881a41-55b41f2737bc6f3b0f1b.png',
  duration: '12:45',
  views: '2.4k',
  language: 'Hindi',
  rating: 4.8,
  category: 'Sustainability',
};

export const TRAINING_VIDEOS = [
  {
    id: 2,
    title: 'Organic Farming',
    thumbnail: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/ef11568cf7-aca24191053c554f255a.png',
    duration: '8:30',
    language: 'Tamil',
    category: 'Organic',
  },
  {
    id: 3,
    title: 'Pest Control',
    thumbnail: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/dc5ac34314-db5453cd063385a760ef.png',
    duration: '15:20',
    language: 'Telugu',
    category: 'Pest Management',
  },
];

export const SUPPORTED_LANGUAGES = [
  { id: 'hindi', name: 'Hindi', isActive: true },
  { id: 'english', name: 'English', isActive: false },
  { id: 'tamil', name: 'Tamil', isActive: false },
  { id: 'telugu', name: 'Telugu', isActive: false },
  { id: 'more', name: '+More', isActive: false },
];

export const QUICK_ACTIONS = [
  {
    id: 1,
    title: 'Live Chat',
    subtitle: 'AYUSH Helpline',
    icon: 'chat',
    gradient: ['#3b82f6', '#2563eb'],
  },
  {
    id: 2,
    title: 'Call Now',
    subtitle: '1800-XXX-XXXX',
    icon: 'phone',
    gradient: ['#22c55e', '#16a34a'],
  },
];

export const FAQ_DATA = [
  {
    id: 1,
    question: 'How do I get certified for organic farming?',
    answer: 'To get certified for organic farming, you need to follow NPOP guidelines and get certified by accredited agencies. Contact your local agriculture officer for detailed steps.',
  },
  {
    id: 2,
    question: 'What subsidies are available for herb farming?',
    answer: 'Various subsidies are available under AYUSH ministry schemes including 50% subsidy on equipment and 30% on infrastructure development.',
  },
  {
    id: 3,
    question: 'How to connect with buyers directly?',
    answer: 'Use our marketplace feature to connect directly with verified buyers. You can also join farmer producer organizations (FPOs) for better market access.',
  },
];
