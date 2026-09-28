import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { NotificationsAPI } from '../../../../../services/apiClient';
import { useAuth } from '../../../../../contexts/AuthContext';
import { NOTIFICATION_TYPES } from '../constants';

const POLL_INTERVAL = 30000; // 30 seconds (matches shared NotificationsScreen)
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h → 'recent' vs 'earlier'

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

// Server row → UI notification shape (NotificationCard fields).
function mapRow(row, pinnedIds) {
  const id = String(row.id);
  const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();
  const isPinned = pinnedIds.has(id);
  return {
    id,
    type: row.category || NOTIFICATION_TYPES.BATCH,
    title: row.title || row.type || 'Notification',
    message: row.body || '',
    timestamp: formatTimestamp(row.created_at),
    isRead: !!row.is_read,
    isPinned,
    section: isPinned ? 'pinned' : (Date.now() - createdAt < RECENT_WINDOW_MS ? 'recent' : 'earlier'),
  };
}

export const useNotifications = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [pinnedIds, setPinnedIds] = useState(() => new Set());
  const [activeFilter, setActiveFilter] = useState(NOTIFICATION_TYPES.ALL);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await NotificationsAPI.inbox(accessToken, { limit: 100 });
      setRows(Array.isArray(data) ? data : data?.notifications || []);
    } catch (_) {
      // keep whatever we already have
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return undefined;
    fetchInbox();
    pollRef.current = setInterval(fetchInbox, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [accessToken, fetchInbox]);

  const notifications = useMemo(
    () => rows.map((row) => mapRow(row, pinnedIds)),
    [rows, pinnedIds],
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === NOTIFICATION_TYPES.ALL) return notifications;
    return notifications.filter((notification) => notification.type === activeFilter);
  }, [notifications, activeFilter]);

  const groupedNotifications = useMemo(() => ({
    pinned: filteredNotifications.filter((n) => n.section === 'pinned'),
    recent: filteredNotifications.filter((n) => n.section === 'recent'),
    earlier: filteredNotifications.filter((n) => n.section === 'earlier'),
  }), [filteredNotifications]);

  const markAsRead = useCallback((notificationId) => {
    setRows((prev) => prev.map((row) => (
      String(row.id) === notificationId
        ? { ...row, is_read: true, read_at: new Date().toISOString() }
        : row
    )));
    if (accessToken) {
      NotificationsAPI.markRead(accessToken, [notificationId]).catch(() => {});
    }
  }, [accessToken]);

  const markAllAsRead = useCallback(() => {
    setRows((prev) => prev.map((row) => (
      row.is_read ? row : { ...row, is_read: true, read_at: new Date().toISOString() }
    )));
    if (accessToken) {
      NotificationsAPI.markRead(accessToken, [], true).catch(() => {});
    }
  }, [accessToken]);

  // Pinning is client-side only (the backend inbox has no pin field).
  const togglePin = useCallback((notificationId) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) next.delete(notificationId);
      else next.add(notificationId);
      return next;
    });
  }, []);

  const changeFilter = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  return {
    notifications: filteredNotifications,
    groupedNotifications,
    activeFilter,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    togglePin,
    changeFilter,
  };
};
