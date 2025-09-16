import React, { useState } from 'react'

export default function TicketForm({ onSubmit }) {
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState('Low')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(subject, priority, description)
    setSubject('')
    setPriority('Low')
    setDescription('')
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Submit a New Ticket</h2>
      <form className="mt-4 flex flex-col" onSubmit={handleSubmit}>
        <label className="mb-1 text-sm font-semibold text-gray-800">Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Data discrepancy, system error, etc." required className="mb-3 rounded-lg border border-gray-200 p-2" />
        <label className="mb-1 text-sm font-semibold text-gray-800">Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required className="mb-3 rounded-lg border border-gray-200 p-2">
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <label className="mb-1 text-sm font-semibold text-gray-800">Description</label>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." required className="mb-4 rounded-lg border border-gray-200 p-2" />
        <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Submit Ticket</button>
      </form>
    </div>
  )
}


