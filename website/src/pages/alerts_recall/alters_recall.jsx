import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAlertsRecalls } from './hooks/useAlertsRecalls'
import AlertsList from './components/AlertsList.jsx'
import RecallsList from './components/RecallsList.jsx'
import { AdminAPI } from '../../services/apiClient'

export default function AlertsAndRecallsPage() {
  const { accessToken } = useAuth()
  const { criticalAlerts, initiatedRecalls, loading, initiateRecall, resolveAlert } = useAlertsRecalls()
  const [showRecallForm, setShowRecallForm] = useState(false)
  const [recallForm, setRecallForm] = useState({ batch_id: '', reason: '', severity: 'high' })
  const [submitting, setSubmitting] = useState(false)

  const handleInitiateRecall = async (e) => {
    e.preventDefault()
    if (!recallForm.batch_id.trim() || !recallForm.reason.trim()) return
    setSubmitting(true)
    try {
      await initiateRecall(recallForm.batch_id.trim(), recallForm.reason.trim())
      setRecallForm({ batch_id: '', reason: '', severity: 'high' })
      setShowRecallForm(false)
    } catch (_) {}
    setSubmitting(false)
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Alerts & Recall Management</h1>
          <p className="mt-2 text-sm text-gray-500">Safety-critical alerts, recall initiation, and impact tracking.</p>
        </div>
        <button onClick={() => setShowRecallForm(!showRecallForm)}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          {showRecallForm ? 'Cancel' : '+ Initiate Recall'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Active Alerts</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{criticalAlerts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Active Recalls</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{initiatedRecalls.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Critical</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{criticalAlerts.filter(a => a.severity === 'critical' || a.severity === 'error').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{criticalAlerts.filter(a => a.severity === 'warning').length}</p>
        </div>
      </div>

      {/* Recall initiation form */}
      {showRecallForm && (
        <form onSubmit={handleInitiateRecall} className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Initiate Product Recall</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch / Product ID</label>
              <input type="text" value={recallForm.batch_id} onChange={(e) => setRecallForm({ ...recallForm, batch_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="HERB-2026-XXXXX or PROD-2026-XXXXX" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={recallForm.severity} onChange={(e) => setRecallForm({ ...recallForm, severity: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea value={recallForm.reason} onChange={(e) => setRecallForm({ ...recallForm, reason: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3}
                placeholder="Describe the reason for this recall (contamination, mislabeling, failed test, etc.)" required />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {submitting ? 'Activating...' : 'Activate Recall'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AlertsList alerts={criticalAlerts} onInitiateRecall={(id) => { setRecallForm({ ...recallForm, batch_id: id }); setShowRecallForm(true); }} />
        </div>
        <div className="lg:col-span-1">
          <RecallsList recalls={initiatedRecalls} />
        </div>
      </div>
    </div>
  )
}
