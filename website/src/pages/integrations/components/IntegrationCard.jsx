import React from 'react'

export default function IntegrationCard({ integration, onAction }) {
  const statusKey = integration.status.toLowerCase().replace(/\s/g, '-')
  const isConnected = integration.status === 'Connected'

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 status-${statusKey}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl leading-none">{integration.icon}</span>
        <h3 className="m-0 text-lg font-semibold text-gray-900">{integration.name}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-6">{integration.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
          Status: {integration.status}
        </span>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${isConnected ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          onClick={() => onAction(integration)}
        >
          {integration.action}
        </button>
      </div>
    </div>
  )
}


