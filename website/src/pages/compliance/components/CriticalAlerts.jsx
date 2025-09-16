import React from 'react'

export default function CriticalAlerts({ alerts, onAction }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Critical Alerts</h2>
      {alerts.length > 0 ? (
        <div className="divide-y">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {alert.severity === 'error' ? '❗' : '⚠️'}
                </span>
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">{alert.type || 'Alert'}</strong>
                  <br />
                  <span className="text-gray-500">Batch {alert.batchId} - {alert.reason}</span>
                </p>
              </div>
              <button
                className="whitespace-nowrap rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => onAction(alert.severity === 'error' ? 'Initiate Recall' : 'Investigate', alert.batchId)}
              >
                {alert.severity === 'error' ? 'Initiate Recall' : 'Investigate'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm italic text-gray-500">No critical alerts at this time.</p>
      )}
    </div>
  )
}


