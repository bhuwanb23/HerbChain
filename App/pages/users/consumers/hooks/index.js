import { useState, useEffect } from 'react';

// Custom hook for managing herb traceability data
export const useHerbTraceability = (batchId) => {
  const [herbData, setHerbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHerbData = async () => {
      try {
        setLoading(true);
        // Simulate API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API response
        const mockData = {
          batchId,
          name: 'Ashwagandha',
          status: 'Verified Authentic',
          farmer: {
            name: 'Rajesh Kumar',
            title: '3rd Generation Farmer',
            description: 'Organic farming specialist with 20+ years experience growing premium Ashwagandha in Rajasthan\'s fertile soil.',
            avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg'
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
        
        setHerbData(mockData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchHerbData();
    }
  }, [batchId]);

  return { herbData, loading, error };
};

// Custom hook for managing consumer actions
export const useConsumerActions = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [isViewingReport, setIsViewingReport] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      // Implement sharing functionality
      console.log('Sharing herb traceability data...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleViewReport = () => {
    setIsViewingReport(true);
    // Navigate to full report screen
    console.log('Viewing full report...');
  };

  const handleBack = (navigation) => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  return {
    isSharing,
    isViewingReport,
    handleShare,
    handleViewReport,
    handleBack
  };
};
