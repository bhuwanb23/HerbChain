import { useState, useMemo } from 'react';
import { REPORT_FILTERS, ANALYTICS_SUMMARY, EARNINGS, COMPLIANCE, IMPACT, CHARTS, RECEIPTS } from '../constants';

const useReportsData = () => {
  const [period, setPeriod] = useState(REPORT_FILTERS.activePeriod);

  // In a real app, filter datasets by period. Here we return as-is.
  const analytics = useMemo(() => ANALYTICS_SUMMARY, [period]);
  const earnings = useMemo(() => EARNINGS, [period]);
  const compliance = useMemo(() => COMPLIANCE, [period]);
  const impact = useMemo(() => IMPACT, [period]);
  const charts = useMemo(() => CHARTS, [period]);
  const receipts = useMemo(() => RECEIPTS, [period]);

  return {
    period,
    setPeriod,
    filters: REPORT_FILTERS.periodOptions,
    analytics,
    earnings,
    compliance,
    impact,
    charts,
    receipts,
  };
};

export default useReportsData;


