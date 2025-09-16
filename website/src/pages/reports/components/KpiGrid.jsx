import React from 'react'

export default function KpiGrid({ kpis }) {
  const items = [
    { value: `${kpis.highHealthPct}%`, label: 'High Health Batches' },
    { value: kpis.atRisk, label: 'At-Risk Batches' },
    { value: '1,250', label: 'Consumer Scans This Month' },
    { value: '4.8/5', label: 'Average Trust Score' },
  ]
  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((it, idx) => (
        <div key={idx} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <span className="block text-3xl font-bold text-gray-900">{it.value}</span>
          <span className="mt-1 block text-xs uppercase tracking-wide text-gray-500">{it.label}</span>
        </div>
      ))}
    </div>
  )
}


