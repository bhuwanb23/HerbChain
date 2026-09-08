import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminAPI, AnalyticsAPI } from '../../../services/apiClient';

export function useComplianceMetrics() {
  const { accessToken } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      AdminAPI.complianceAlerts(accessToken, { status: 'open' }),
      AnalyticsAPI.compliance(accessToken, 'monthly'),
    ])
      .then(([alertRes, compRes]) => {
        setAlerts(alertRes?.alerts || []);
        setComplianceData(compRes);
      })
      .catch(() => setError('Failed to load compliance data'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const runRules = useCallback(async () => {
    if (!accessToken) return;
    try {
      await AdminAPI.runComplianceRules(accessToken);
      // Re-fetch alerts after running rules
      const res = await AdminAPI.complianceAlerts(accessToken, { status: 'open' });
      setAlerts(res?.alerts || []);
    } catch (_) {}
  }, [accessToken]);

  const resolveAlert = useCallback(async (alertId, status) => {
    if (!accessToken) return;
    try {
      await AdminAPI.updateComplianceAlert(accessToken, alertId, { status });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (_) {}
  }, [accessToken]);

  const stats = complianceData || {};
  const metrics = {
    complianceRate: {
      key: 'complianceRate',
      value: stats.compliance_rate || stats.complianceRate || 0,
      label: 'Compliance Rate',
      suffix: '%',
    },
    activeViolations: {
      key: 'activeViolations',
      value: alerts.length,
      label: 'Active Violations',
    },
    totalBatches: {
      key: 'totalBatches',
      value: stats.total_batches || stats.totalBatches || 0,
      label: 'Total Batches',
    },
    certifiedBatches: {
      key: 'certifiedBatches',
      value: stats.certified_batches || stats.certifiedBatches || 0,
      label: 'Certified Batches',
    },
  };

  return {
    metrics,
    alerts,
    selectedMetric,
    setSelectedMetric,
    loading,
    error,
    runRules,
    resolveAlert,
  };
}
