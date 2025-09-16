import React from 'react'

export default function TicketList({ tickets, getStatusClass, onClose }) {
  const priorityClass = (p) => p ? `priority-${p.toLowerCase()}` : ''
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Ticket History</h2>
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.id} className="flex items-center justify-between border-b py-4 last:border-b-0">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-gray-900">{ticket.subject}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass(ticket.priority)} bg-emerald-50 text-emerald-700`}>{ticket.priority}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(ticket.status)} bg-gray-100 text-gray-700`}>{ticket.status}</span>
              </div>
            </div>
            {ticket.status !== 'Closed' && (
              <button className="rounded-full bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800" onClick={() => onClose(ticket.id)}>
                Close Ticket
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}


