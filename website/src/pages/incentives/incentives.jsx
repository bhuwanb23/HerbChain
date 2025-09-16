import React from 'react'
import { useIncentives } from './hooks/useIncentives.jsx'
import MetricsGrid from './components/MetricsGrid.jsx'
import ChartSection from './components/ChartSection.jsx'
import EcoProgress from './components/EcoProgress.jsx'
import FarmerList from './components/FarmerList.jsx'
import MetricDetailModal from './components/MetricDetailModal.jsx'

export default function IncentivesPage() {
  const { farmers, ecoTarget, ecoProgress, ecoProgressPercentage, tokenDistributionData, incentiveMetrics, selectedMetric, setSelectedMetric } = useIncentives()

  const handleDisburseFunds = (farmerName) => {
    alert(`Disbursing funds to ${farmerName}...`)
  }
  const handleApplyForScheme = () => {
    alert('Redirecting to subsidy portal...')
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Incentives & Funding</h1>
        <p className="mt-2 text-sm text-gray-500">Oversee tokenized farmer rewards and link to subsidy schemes.</p>
      </div>

      <MetricsGrid metrics={incentiveMetrics} onSelect={setSelectedMetric} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ChartSection data={tokenDistributionData} />
        </div>
        <div className="lg:col-span-1">
          <EcoProgress ecoProgress={ecoProgress} ecoTarget={ecoTarget} ecoProgressPercentage={ecoProgressPercentage} onApply={handleApplyForScheme} />
        </div>
      </div>

      <div className="mt-6">
        <FarmerList farmers={farmers} onDisburse={handleDisburseFunds} />
      </div>

      {selectedMetric && (
        <MetricDetailModal
          title={selectedMetric.label}
          content={selectedMetric.details}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  )
}


