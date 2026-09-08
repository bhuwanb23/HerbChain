import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SupportAPI } from '../../../services/apiClient';

export function useSupport() {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    SupportAPI.list(accessToken)
      .then((res) => setTickets(res?.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const getStatusClass = useCallback((status) => {
    if (status === 'open') return 'status-open';
    if (status === 'in_progress') return 'status-in-progress';
    if (status === 'resolved' || status === 'closed') return 'status-closed';
    return '';
  }, []);

  const submitTicket = useCallback(async (subject, priority, description, category = 'general') => {
    if (!accessToken) return;
    try {
      const res = await SupportAPI.create(accessToken, { subject, description, category });
      if (res?.ticket) setTickets((prev) => [res.ticket, ...prev]);
    } catch (_) {}
  }, [accessToken]);

  const closeTicket = useCallback(async (ticketId) => {
    if (!accessToken) return;
    try {
      await SupportAPI.update(accessToken, ticketId, { status: 'closed' });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: 'closed' } : t)));
    } catch (_) {}
  }, [accessToken]);

  return { tickets, loading, getStatusClass, submitTicket, closeTicket };
}
