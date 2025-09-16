import React from 'react'

export default function MetricsGrid({ metrics, onSelect }) {
  const items = Object.values(metrics)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      {items.map((metric) => (
        <button
          key={metric.key}
          className="rounded-xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md border border-gray-200"
          onClick={() => onSelect(metric)}
        >
          <span className="block text-xs uppercase tracking-wide text-gray-500">{metric.label}</span>
          <span className="mt-2 block text-3xl font-bold text-emerald-700">{metric.value}</span>
          <span className="block text-sm text-gray-500">{metric.unit}</span>
        </button>
      ))}
    </div>
  )
}


