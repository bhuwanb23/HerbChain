// Consumer constants and data
export const HERB_DATA = {
  name: 'Ashwagandha',
  batchId: 'HERB-ASH-001',
  status: 'Verified Authentic',
  farmer: {
    name: 'Rajesh Kumar',
    title: '3rd Generation Farmer',
    description: 'Organic farming specialist with 20+ years experience growing premium Ashwagandha in Rajasthan\'s fertile soil.',
    avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg'
  },
  journey: {
    from: 'Rajasthan, India',
    to: 'Your Location',
    title: 'Farm to You'
  },
  timeline: [
    {
      id: 1,
      title: 'Harvested',
      date: 'October 15, 2024',
      description: 'Hand-picked at optimal maturity during early morning hours to preserve potency.',
      icon: 'seedling'
    },
    {
      id: 2,
      title: 'Tested for Purity',
      date: 'October 16, 2024',
      description: 'Laboratory tested for heavy metals, pesticides, and withanolide content. 99.8% purity confirmed.',
      icon: 'microscope'
    },
    {
      id: 3,
      title: 'Packaged',
      date: 'October 18, 2024',
      description: 'Sealed in airtight, UV-protected packaging to maintain freshness and potency.',
      icon: 'box'
    }
  ],
  certifications: [
    {
      id: 1,
      title: 'Organic Certified',
      icon: 'leaf'
    },
    {
      id: 2,
      title: 'GMP Compliant',
      icon: 'shield-check'
    }
  ]
};

export const COLORS = {
  sage: '#87A96B',
  sageLight: '#A8C686',
  sageDark: '#6B8E3A',
  warmBeige: '#F5F1E8',
  earthBrown: '#8B7355',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    600: '#4B5563',
    900: '#111827'
  }
};

export const STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  }
};
