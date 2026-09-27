import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminAPI } from '../../../services/apiClient';

const RECALLABLE = ['batch', 'product', 'product_lot'];

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
          type: a.title || a.alert_type,
          reason: a.description || a.alert_type,
          severity: String(a.severity || 'medium').toLowerCase(),
          batchId: RECALLABLE.includes(a.entity_type) && a.entity_id ? a.entity_id : null,
        }));
        setCriticalAlerts(alerts);
        setInitiatedRecalls(recallRes?.recalls || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  /**
   * Issue a recall. `target` may be a batch/product code (HERB-…/PROD-…) or a
   * raw DB id (e.g. an alert's entity_id); resolve it to {ref_type, ref_id}
   * via the portal search, then POST the server's zod shape. Throws ApiError
   * / Error so the caller can surface the failure.
   */
  const initiateRecall = useCallback(
    async (target, reason, severity = 'high') => {
      if (!accessToken) throw new Error('Not signed in');
      const needle = String(target || '').trim();
      if (!needle) throw new Error('Batch or product is required');
      const found = await AdminAPI.search(accessToken, needle, { limit: 10 });
      const hit = (found?.results || []).find(
        (r) =>
          (r.category === 'batch' || r.category === 'geo_batch' || r.category === 'product') &&
          (r.id === needle || String(r.code || '').toUpperCase() === needle.toUpperCase())
      );
      if (!hit) throw new Error(`No batch or product matched "${needle}"`);
      const res = await AdminAPI.createRecall(accessToken, {
        ref_type: hit.category === 'product' ? 'product' : 'batch',
        ref_id: hit.id,
        reason,
        severity,
      });
      if (res?.recall) setInitiatedRecalls((prev) => [res.recall, ...prev]);
      return res?.recall;
    },
    [accessToken]
  );

  const resolveAlert = useCallback(
    async (alertId) => {
      if (!accessToken) return;
      try {
        await AdminAPI.updateComplianceAlert(accessToken, alertId, { status: 'resolved' });
        setCriticalAlerts((prev) => prev.filter((a) => a.id !== alertId));
      } catch (_) {}
    },
    [accessToken]
  );

  return { criticalAlerts, initiatedRecalls, loading, initiateRecall, resolveAlert };
}
