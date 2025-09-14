import { useState, useEffect } from 'react';

export const useTransporterDashboard = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    completed: 8,
    active: 3,
    pending: 2,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setActiveTrips([
          {
            id: 'TR-8847',
            status: 'ACTIVE',
            route: 'Downtown Warehouse → Mall Center',
            progress: 75,
            eta: '14:30',
            distance: '8.2 km',
          },
          {
            id: 'TR-8848',
            status: 'PENDING',
            route: 'Central Hub → Riverside District',
            progress: 100,
            scheduled: '15:00',
            distance: '12.5 km',
          },
        ]);

        setNotifications([
          {
            id: 1,
            title: 'Route Delay Alert',
            message: 'Traffic on Route A-102, +15 min delay expected',
            time: '2 min ago',
            type: 'warning',
          },
          {
            id: 2,
            title: 'Handover Ready',
            message: 'Package #TR-8847 ready for customer pickup',
            time: '5 min ago',
            type: 'info',
          },
        ]);

        setIsLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  const handleQuickAction = (actionId) => {
    console.log('Quick action pressed:', actionId);
    
    switch (actionId) {
      case 'start-trip':
        // Handle start trip logic
        break;
      case 'scan-batch':
        // Handle scan batch logic
        break;
      case 'confirm':
        // Handle confirm logic
        break;
      default:
        break;
    }
  };

  const handleTripPress = (tripId) => {
    console.log('Trip pressed:', tripId);
    // Navigate to trip details or handle trip action
  };

  const refreshDashboard = () => {
    // Refresh dashboard data
    console.log('Refreshing dashboard...');
  };

  return {
    activeTrips,
    notifications,
    stats,
    isLoading,
    handleQuickAction,
    handleTripPress,
    refreshDashboard,
  };
};