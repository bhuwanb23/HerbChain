import { useState, useCallback, useMemo } from 'react';
import { MOCK_NOTIFICATIONS, NOTIFICATION_TYPES } from '../constants';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState(NOTIFICATION_TYPES.ALL);

  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    if (activeFilter === NOTIFICATION_TYPES.ALL) {
      return notifications;
    }
    return notifications.filter(notification => notification.type === activeFilter);
  }, [notifications, activeFilter]);

  // Group notifications by section
  const groupedNotifications = useMemo(() => {
    const pinned = filteredNotifications.filter(n => n.section === 'pinned');
    const recent = filteredNotifications.filter(n => n.section === 'recent');
    const earlier = filteredNotifications.filter(n => n.section === 'earlier');
    
    return { pinned, recent, earlier };
  }, [filteredNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  // Pin/unpin notification
  const togglePin = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { 
              ...notification, 
              isPinned: !notification.isPinned,
              section: notification.isPinned ? 'recent' : 'pinned'
            }
          : notification
      )
    );
  }, []);

  // Change filter
  const changeFilter = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);

  return {
    notifications: filteredNotifications,
    groupedNotifications,
    activeFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    togglePin,
    changeFilter,
  };
};
