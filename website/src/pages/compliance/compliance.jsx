import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplianceMetrics } from './hooks/useComplianceMetrics.jsx'
import { ayushStandardsDefault, complianceAlerts } from './constants'
import MetricsGrid from './components/MetricsGrid.jsx'
import StandardsGrid from './components/StandardsGrid.jsx'
import CriticalAlerts from './components/CriticalAlerts.jsx'
import MetricDetailModal from './components/MetricDetailModal.jsx'

export default function CompliancePage() {
  const navigate = useNavigate()
  const { metrics, selectedMetric, setSelectedMetric } = useComplianceMetrics()

  const handleAlertAction = (action, batchId) => {
    if (action === 'Initiate Recall') {
      navigate(`/recalls/${batchId}`)
    } else {
      // Placeholder for investigate flow
      alert(`Investigating batch ${batchId}...`)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Compliance & Regulation</h1>
          <p className="mt-2 text-sm text-gray-500">Automated monitoring and AYUSH standards compliance</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">+ New Check</button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Export</button>
        </div>
      </div>

      <MetricsGrid metrics={metrics} onSelect={setSelectedMetric} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2">
          <StandardsGrid standards={ayushStandardsDefault} />
        </div>
        <div className="lg:col-span-1">
          <CriticalAlerts alerts={complianceAlerts} onAction={handleAlertAction} />
        </div>
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


