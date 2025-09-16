import React from 'react'
import IntegrationCard from './IntegrationCard.jsx'

export default function IntegrationsGrid({ integrations, onAction }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {integrations.map((integration, idx) => (
        <IntegrationCard key={idx} integration={integration} onAction={onAction} />
      ))}
    </div>
  )
}


