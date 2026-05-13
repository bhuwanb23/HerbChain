// src/pages/Support.js
import React, { useState } from 'react';
import './Support.css';

const Support = () => {
  const [tickets, setTickets] = useState([
    { id: 1, subject: 'API Sync Error with ERP', status: 'Open', priority: 'High' },
    { id: 2, subject: 'Batch #234 Quality Dispute', status: 'In Progress', priority: 'Medium' },
    { id: 3, subject: 'AYUSH Grid data mismatch', status: 'Closed', priority: 'Low' },
  ]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'In Progress': return 'status-in-progress';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const newTicket = {
      id: tickets.length + 1,
      subject: e.target.subject.value,
      status: 'Open',
      priority: e.target.priority.value,
    };
    setTickets([...tickets, newTicket]);
    e.target.reset();
  };

  const handleCloseTicket = (ticketId) => {
    setTickets(tickets.map(ticket =>
      ticket.id === ticketId ? { ...ticket, status: 'Closed' } : ticket
    ));
    alert(`Ticket #${ticketId} has been closed.`);
  };

  return (
    <div className="support-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support & Dispute Resolution</h1>
          <p className="page-subtitle">Handle escalations and resolve conflicts across the chain.</p>
        </div>
      </div>

      <div className="support-main-grid">
        <div className="support-section card">
          <h2>Ticket History</h2>
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="ticket-item">
                <div className="ticket-details">
                  <span className="ticket-subject">{ticket.subject}</span>
                  <div className="ticket-meta">
                    <span className={`priority-badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                    <span className={`ticket-status ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                  </div>
                </div>
                {ticket.status !== 'Closed' && (
                  <button onClick={() => handleCloseTicket(ticket.id)} className="close-ticket-button">
                    Close Ticket
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="support-section card">
          <h2>Submit a New Ticket</h2>
          <form className="ticket-form" onSubmit={handleSubmit}>
            <label htmlFor="subject">Subject:</label>
            <input type="text" id="subject" placeholder="e.g., Data discrepancy, system error, etc." required />
            <label htmlFor="priority">Priority:</label>
            <select id="priority" required>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <label htmlFor="description">Description:</label>
            <textarea id="description" rows="4" placeholder="Describe the issue in detail..." required></textarea>
            <button type="submit" className="submit-button primary-button">
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Support;