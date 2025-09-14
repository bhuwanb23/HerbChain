import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useTransporterDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const handleCardPress = useCallback((cardId) => {
    switch (cardId) {
      case 'pending-pickups':
        Alert.alert('Pending Pickups', 'Show pending pickup details');
        break;
      case 'active-trips':
        Alert.alert('Active Trips', 'Show active trip details');
        break;
      case 'deliveries':
        Alert.alert('Deliveries', 'Show delivery history');
        break;
      default:
        break;
    }
  }, []);

  const handleNotificationPress = useCallback((notification) => {
    Alert.alert(
      notification.title,
      notification.message,
      [
        { text: 'Mark as Read', onPress: () => markNotificationAsRead(notification.id) },
        { text: 'OK', style: 'default' },
      ]
    );
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  const handleQuickAction = useCallback((actionId) => {
    switch (actionId) {
      case 'start-trip':
        Alert.alert('Start Trip', 'Starting new trip...');
        break;
      case 'scan-qr':
        Alert.alert('Scan QR', 'Opening QR scanner...');
        break;
      case 'emergency':
        Alert.alert('Emergency', 'Emergency contact activated');
        break;
      case 'fuel-log':
        Alert.alert('Fuel Log', 'Opening fuel log form...');
        break;
      default:
        break;
    }
  }, []);

  const toggleMapExpanded = useCallback(() => {
    setIsMapExpanded(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    notifications,
    isMapExpanded,
    handleCardPress,
    handleNotificationPress,
    markNotificationAsRead,
    handleQuickAction,
    toggleMapExpanded,
    handleTabChange,
  };
};
