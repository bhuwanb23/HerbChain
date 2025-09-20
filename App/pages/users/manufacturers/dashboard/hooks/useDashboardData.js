import { useState, useEffect } from 'react';
import { DASHBOARD_CARDS, NOTIFICATIONS_DATA } from '../constants/dashboardConstants';

// This is a placeholder hook for fetching dashboard data
// In a real application, this would involve API calls
const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardCards, setDashboardCards] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, make actual API calls here
        // const response = await fetch('/api/manufacturer/dashboard');
        // const data = await response.json();

        // Using mock data for now
        setDashboardCards(DASHBOARD_CARDS);
        setNotifications(NOTIFICATIONS_DATA);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { loading, error, dashboardCards, notifications };
};

export default useDashboardData;