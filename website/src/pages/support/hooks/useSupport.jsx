import { useState, useCallback } from 'react'
import { initialTickets } from '../constants'

export function useSupport() {
  const [tickets, setTickets] = useState(initialTickets)

  const getStatusClass = useCallback((status) => {
    if (status === 'Open') return 'status-open'
    if (status === 'In Progress') return 'status-in-progress'
    if (status === 'Closed') return 'status-closed'
    return ''
  }, [])

  const submitTicket = useCallback((subject, priority, description) => {
    const newTicket = { id: tickets.length + 1, subject, status: 'Open', priority }
    setTickets((prev) => [...prev, newTicket])
  }, [tickets])

  const closeTicket = useCallback((ticketId) => {
    setTickets((prev) => prev.map(t => (t.id === ticketId ? { ...t, status: 'Closed' } : t)))
  }, [])

  return { tickets, getStatusClass, submitTicket, closeTicket }
}


