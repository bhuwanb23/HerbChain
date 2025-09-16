import React from 'react'
import { useSupport } from './hooks/useSupport.jsx'
import TicketList from './components/TicketList.jsx'
import TicketForm from './components/TicketForm.jsx'

export default function SupportPage() {
  const { tickets, getStatusClass, submitTicket, closeTicket } = useSupport()
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Support & Dispute Resolution</h1>
        <p className="mt-2 text-sm text-gray-500">Handle escalations and resolve conflicts across the chain.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TicketList tickets={tickets} getStatusClass={getStatusClass} onClose={closeTicket} />
        </div>
        <div className="lg:col-span-1">
          <TicketForm onSubmit={submitTicket} />
        </div>
      </div>
    </div>
  )
}


