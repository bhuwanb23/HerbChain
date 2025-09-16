import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlertsRecalls } from './hooks/useAlertsRecalls'
import AlertsList from './components/AlertsList.jsx'
import RecallsList from './components/RecallsList.jsx'

export default function AlertsAndRecallsPage() {
  const navigate = useNavigate()
  const { criticalAlerts, initiatedRecalls } = useAlertsRecalls()

  const handleInitiateRecall = (batchId) => {
    navigate(`/recalls/${batchId}`)
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Alerts & Recall Management</h1>
        <p className="mt-2 text-sm text-gray-500">Warnings for critical violations and tools to initiate recalls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AlertsList alerts={criticalAlerts} onInitiateRecall={handleInitiateRecall} />
        </div>
        <div className="lg:col-span-1">
          <RecallsList recalls={initiatedRecalls} />
        </div>
      </div>
    </div>
  )
}


