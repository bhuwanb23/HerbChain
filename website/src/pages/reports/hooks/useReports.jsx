import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ReportsAPI, AnalyticsAPI } from '../../../services/apiClient';

export function useReports() {
  const { accessToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      ReportsAPI.list(accessToken).catch(() => ({ reports: [] })),
      ReportsAPI.schedules(accessToken).catch(() => ({ schedules: [] })),
      AnalyticsAPI.dashboard(accessToken).catch(() => ({})),
    ])
      .then(([reportRes, schedRes, dashRes]) => {
        setReports(reportRes?.reports || []);
        setSchedules(schedRes?.schedules || []);
        setAnalytics(dashRes || {});
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const generateReport = useCallback(async (payload) => {
    if (!accessToken) return;
    setGenerating(true);
    try {
      const res = await ReportsAPI.generate(accessToken, payload);
      if (res?.report) setReports((prev) => [res.report, ...prev]);
      return res?.report;
    } catch (_) {
      return null;
    } finally {
      setGenerating(false);
    }
  }, [accessToken]);

  const downloadReport = useCallback(async (reportId) => {
    if (!accessToken) return;
    try {
      const res = await ReportsAPI.download(accessToken, reportId);
      return res;
    } catch (_) {
      return null;
    }
  }, [accessToken]);

  const createSchedule = useCallback(async (payload) => {
    if (!accessToken) return;
    try {
      const res = await ReportsAPI.createSchedule(accessToken, payload);
      if (res?.schedule) setSchedules((prev) => [res.schedule, ...prev]);
    } catch (_) {}
  }, [accessToken]);

  // Derived chart data from analytics
  const herbTypeData = analytics.herbs || analytics.herb_types || { labels: [], datasets: [] };
  const complianceHistoryData = analytics.compliance || { labels: [], datasets: [] };
  const supplyChainHealthData = analytics.logistics || { labels: [], datasets: [] };
  const kpis = analytics.kpis || analytics.dashboard || {};

  return {
    reports,
    schedules,
    analytics,
    loading,
    generating,
    kpis,
    herbTypeData,
    complianceHistoryData,
    supplyChainHealthData,
    generateReport,
    downloadReport,
    createSchedule,
  };
}
