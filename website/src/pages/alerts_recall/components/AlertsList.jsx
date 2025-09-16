import React from 'react'

export default function AlertsList({ alerts, onInitiateRecall }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Critical Alerts</h2>
      {alerts.length > 0 ? (
        <ul className="divide-y">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{alert.type?.includes('Contamination') ? '☣️' : '⚠️'}</span>
                <div>
                  <p className="font-medium text-gray-900">{alert.type}</p>
                  <p className="text-sm text-gray-600">{alert.reason}</p>
                  <p className="text-xs text-gray-500">Batch ID: {alert.batchId}</p>
                </div>
              </div>
              <button
                className="rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => onInitiateRecall(alert.batchId)}
              >
                Initiate Recall
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm italic text-gray-500">No new critical alerts. All systems are go!</p>
      )}
    </div>
  )
}


