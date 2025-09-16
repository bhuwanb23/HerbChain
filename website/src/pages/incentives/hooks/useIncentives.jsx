import React, { useMemo, useState } from 'react'
import { farmersSeed, ecoTargetDefault } from '../constants'

export function useIncentives() {
  const [selectedMetric, setSelectedMetric] = useState(null)
  const [farmers] = useState(farmersSeed)
  const [ecoTarget] = useState(ecoTargetDefault)

  const ecoProgress = farmers.filter(f => f.ecoBonus).length
  const ecoProgressPercentage = Math.round((ecoProgress / ecoTarget) * 100)

  const tokenDistributionData = useMemo(() => {
    const herbTokenCounts = farmers.reduce((acc, farmer) => {
      acc[farmer.herbType] = (acc[farmer.herbType] || 0) + farmer.tokens
      return acc
    }, {})
    return {
      labels: Object.keys(herbTokenCounts),
      datasets: [{
        data: Object.values(herbTokenCounts),
        backgroundColor: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'],
      }],
    }
  }, [farmers])

  const incentiveMetrics = useMemo(() => ({
    totalTokens: {
      key: 'totalTokens',
      label: 'Total Token Rewards',
      value: farmers.reduce((sum, farmer) => sum + farmer.tokens, 0),
      unit: 'Tokens',
      details: (
        <div>
          <p><strong>Overview:</strong> Total number of tokens distributed to farmers for their contributions.</p>
          <p><strong>Action:</strong> <button className="modal-action-button" onClick={() => setSelectedMetric(null)}>Generate Token Report</button></p>
        </div>
      ),
    },
    pendingFunds: {
      key: 'pendingFunds',
      label: 'Pending Funds',
      value: '₹50K',
      unit: 'Estimated',
      details: (
        <div>
          <p><strong>Overview:</strong> Estimated value of funds pending disbursement to stakeholders.</p>
          <p><strong>Action:</strong> <button className="modal-action-button" onClick={() => setSelectedMetric(null)}>Disburse All Pending Funds</button></p>
        </div>
      ),
    },
    ecoBonuses: {
      key: 'ecoBonuses',
      label: 'Eco-Bonuses Disbursed',
      value: ecoProgress,
      unit: 'Farmers',
      details: (
        <div>
          <p><strong>Overview:</strong> Number of farmers who received an eco-bonus for sustainable practices.</p>
          <p><strong>Progress:</strong> We are {ecoProgressPercentage}% of the way to our quarterly goal of {ecoTarget} eco-bonuses.</p>
        </div>
      ),
    },
  }), [farmers, ecoProgress, ecoProgressPercentage, ecoTarget])

  return { farmers, ecoTarget, ecoProgress, ecoProgressPercentage, tokenDistributionData, incentiveMetrics, selectedMetric, setSelectedMetric }
}


