import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useReports } from './hooks/useReports.jsx'
import KpiGrid from './components/KpiGrid.jsx'
import Charts from './components/Charts.jsx'
import Insights from './components/Insights.jsx'

export default function ReportsPage() {
  const navigate = useNavigate()
  const { herbTypeData, complianceHistoryData, supplyChainHealthData, kpis } = useReports()

  const handleExport = () => alert('Exporting report...')
  const handleRequest = () => alert('Requesting custom report...')

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-gray-500">State/national-level insights, sustainability reports, and consumer trust analytics.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={handleExport}>Export Report</button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={handleRequest}>Request Custom Report</button>
        </div>
      </div>

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Charts herbTypeData={herbTypeData} complianceHistoryData={complianceHistoryData} supplyChainHealthData={supplyChainHealthData} />
        <Insights onInvestigate={() => navigate('/recall')} onDisburse={() => navigate('/incentives')} />
      </div>
    </div>
  )
}


