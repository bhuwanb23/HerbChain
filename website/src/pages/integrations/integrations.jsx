import React from 'react'
import { integrationsList } from './constants'
import { useIntegrations } from './hooks/useIntegrations'
import IntegrationsGrid from './components/IntegrationsGrid.jsx'

export default function IntegrationsPage() {
  const { handleAction } = useIntegrations()
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Integration & API Management</h1>
        <p className="mt-2 text-sm text-gray-500">Connect with AYUSH Grid, A-HMIS, ERP, and more.</p>
      </div>
      <IntegrationsGrid integrations={integrationsList} onAction={handleAction} />
    </div>
  )
}


