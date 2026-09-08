import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AnalyticsAPI } from '../../../services/apiClient';
import { farmersSeed, ecoTargetDefault } from '../constants';

export function useIncentives() {
  const { accessToken } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [farmers] = useState(farmersSeed);
  const [ecoTarget] = useState(ecoTargetDefault);

  useEffect(() => {
    if (!accessToken) return;
    AnalyticsAPI.consumers(accessToken, 'monthly')
      .then((data) => setAnalyticsData(data))
      .catch(() => {});
  }, [accessToken]);

  // Use real data if available, otherwise seed data
  const farmerList = useMemo(() => {
    if (analyticsData?.farmers?.length) {
      return analyticsData.farmers.map((f, i) => ({
        id: f.id || i + 1,
        name: f.name || f.full_name || `Farmer ${i + 1}`,
        tokens: f.tokens || f.token_count || 0,
        ecoBonus: f.eco_bonus || f.ecoBonus || false,
        herbType: f.herb_type || f.herbType || 'Unknown',
      }));
    }
    return farmers;
  }, [analyticsData, farmers]);

  const ecoProgress = farmerList.filter((f) => f.ecoBonus).length;
  const ecoProgressPercentage = Math.round((ecoProgress / ecoTarget) * 100);

  const tokenDistributionData = useMemo(() => {
    const herbTokenCounts = farmerList.reduce((acc, farmer) => {
      acc[farmer.herbType] = (acc[farmer.herbType] || 0) + farmer.tokens;
      return acc;
    }, {});
    return {
      labels: Object.keys(herbTokenCounts),
      datasets: [{
        data: Object.values(herbTokenCounts),
        backgroundColor: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'],
      }],
    };
  }, [farmerList]);

  const incentiveMetrics = {
    totalTokens: {
      key: 'totalTokens',
      label: 'Total Token Rewards',
      value: farmerList.reduce((sum, farmer) => sum + farmer.tokens, 0),
      unit: 'Tokens',
    },
    pendingFunds: {
      key: 'pendingFunds',
      label: 'Pending Disbursement',
      value: analyticsData?.pending_funds || 0,
      unit: 'INR',
    },
    activeFarmers: {
      key: 'activeFarmers',
      label: 'Active Farmers',
      value: farmerList.length,
    },
    ecoBonusEarners: {
      key: 'ecoBonusEarners',
      label: 'Eco Bonus Earners',
      value: ecoProgress,
    },
  };

  return {
    farmers: farmerList,
    ecoTarget,
    ecoProgress,
    ecoProgressPercentage,
    tokenDistributionData,
    incentiveMetrics,
    selectedMetric,
    setSelectedMetric,
    analyticsData,
  };
}
