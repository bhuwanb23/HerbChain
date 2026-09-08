import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminAPI } from '../../../services/apiClient';

export function useAlertsRecalls() {
  const { accessToken } = useAuth();
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [initiatedRecalls, setInitiatedRecalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      AdminAPI.complianceAlerts(accessToken, { status: 'open' }),
      AdminAPI.recalls(accessToken),
    ])
      .then(([alertRes, recallRes]) => {
        const alerts = (alertRes?.alerts || []).map((a) => ({
          ...a,
          severity: a.severity || (a.priority === 'critical' || a.priority === 'high' ? 'error' : 'warning'),
        }));
        setCriticalAlerts(alerts);
        setInitiatedRecalls(recallRes?.recalls || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const initiateRecall = useCallback(async (batchId, reason) => {
    if (!accessToken) return;
    try {
      const res = await AdminAPI.createRecall(accessToken, { batch_id: batchId, reason });
      if (res?.recall) setInitiatedRecalls((prev) => [res.recall, ...prev]);
    } catch (_) {}
  }, [accessToken]);

  const resolveAlert = useCallback(async (alertId) => {
    if (!accessToken) return;
    try {
      await AdminAPI.updateComplianceAlert(accessToken, alertId, { status: 'resolved' });
      setCriticalAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (_) {}
  }, [accessToken]);

  return { criticalAlerts, initiatedRecalls, loading, initiateRecall, resolveAlert };
}
