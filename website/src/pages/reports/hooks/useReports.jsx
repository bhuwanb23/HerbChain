import React, { useMemo } from 'react'
import { reportBatches } from '../constants'

export function useReports() {
  const herbTypeData = useMemo(() => {
    const counts = reportBatches.reduce((acc, batch) => {
      acc[batch.herbType] = (acc[batch.herbType] || 0) + 1
      return acc
    }, {})
    const allHerbTypes = {
      Ashwagandha: 4,
      Brahmi: 3,
      Tulsi: 5,
      Amla: 2,
      Neem: 3,
      Guduchi: 1,
      Haritaki: 2,
      ...counts,
    }
    return {
      labels: Object.keys(allHerbTypes),
      datasets: [{
        data: Object.values(allHerbTypes),
        backgroundColor: [
          '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800',
          '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5', '#673AB7',
          '#E91E63', '#9C27B0',
        ],
      }],
    }
  }, [])

  const complianceHistoryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{ label: 'Average Compliance %', data: [85, 88, 92, 90, 94, 96, 91, 93, 95, 94], backgroundColor: '#4CAF50' }],
  }

  const supplyChainHealthData = {
    labels: ['High Health', 'Medium Health', 'Low Health'],
    datasets: [{
      label: 'Supply Chain Health',
      data: [
        reportBatches.filter(b => b.supplyChainHealth >= 90).length,
        reportBatches.filter(b => b.supplyChainHealth >= 75 && b.supplyChainHealth < 90).length,
        reportBatches.filter(b => b.supplyChainHealth < 75).length,
      ],
      backgroundColor: ['#4CAF50', '#FFC107', '#D32F2F'],
    }],
  }

  const kpis = {
    highHealthPct: Math.round((reportBatches.filter(b => b.supplyChainHealth >= 90).length / reportBatches.length) * 100),
    atRisk: reportBatches.filter(b => b.supplyChainHealth < 75).length,
    scans: 1250,
    trust: '4.8/5',
  }

  return { herbTypeData, complianceHistoryData, supplyChainHealthData, kpis }
}


