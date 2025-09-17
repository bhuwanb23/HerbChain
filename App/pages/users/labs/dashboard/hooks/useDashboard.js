import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export const useDashboard = () => {
  const navigation = useNavigation();
  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const toggleNotificationsModal = useCallback(() => {
    setNotificationsModalVisible(prev => !prev);
  }, []);

  const handleNavigation = useCallback((screenName) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName);
    }
  }, [navigation]);

  const handleNotificationPress = useCallback((notificationId) => {
    console.log('Notification pressed:', notificationId);
    // Handle notification press logic here
  }, []);

  const handleBatchPress = useCallback((batchId) => {
    console.log('Batch pressed:', batchId);
    // Handle batch press logic here
  }, []);

  const handleRequestPress = useCallback((requestId) => {
    console.log('Request pressed:', requestId);
    // Handle request press logic here
  }, []);

  return {
    isNotificationsModalVisible,
    toggleNotificationsModal,
    handleNavigation,
    handleNotificationPress,
    handleBatchPress,
    handleRequestPress,
  };
};
