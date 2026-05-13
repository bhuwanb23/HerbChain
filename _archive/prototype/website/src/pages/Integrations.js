// src/pages/Integrations.js
import React from 'react';
import './Integrations.css';

const Integrations = () => {
  const integrations = [
    { 
      name: 'AYUSH Grid', 
      status: 'Connected', 
      icon: '🌐',
      description: 'Synchronize data with the national AYUSH Grid for regulatory compliance and streamlined reporting.',
      action: 'Sync Data',
    },
    { 
      name: 'A-HMIS', 
      status: 'Connected', 
      icon: '🏥',
      description: 'Connect to the Ayur-Health Management Information System for real-time patient and prescription data.',
      action: 'Sync Data',
    },
    { 
      name: 'ERP System', 
      status: 'Not Configured', 
      icon: '💻',
      description: 'Integrate your existing Enterprise Resource Planning system to automate inventory, procurement, and billing.',
      action: 'Configure',
    },
    { 
      name: 'Lab Test API', 
      status: 'Connected', 
      icon: '🔬',
      description: 'Receive automated lab test results for quality control and batch safety verification.',
      action: 'Sync Data',
    },
    { 
      name: 'IoT Sensors', 
      status: 'Connected', 
      icon: '⚙️',
      description: 'Pull data from on-site IoT devices to monitor environmental conditions like temperature and humidity.',
      action: 'View Data',
    },
    { 
      name: 'Payment Gateway', 
      status: 'Not Configured', 
      icon: '💳',
      description: 'Set up a secure payment gateway to process transactions for marketplace sales and disburse funds.',
      action: 'Configure',
    },
  ];

  const handleAction = (integration) => {
    if (integration.status === 'Connected') {
      alert(`Initiating data sync with ${integration.name}...`);
    } else if (integration.status === 'Not Configured') {
      alert(`Redirecting to ${integration.name} configuration page...`);
    }
  };

  return (
    <div className="integrations-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Integration & API Management</h1>
          <p className="page-subtitle">Connect with AYUSH Grid, A-HMIS, ERP, and more.</p>
        </div>
      </div>

      <div className="integrations-grid">
        {integrations.map((integration, index) => (
          <div key={index} className={`integration-card card status-${integration.status.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="integration-header">
              <span className="integration-icon">{integration.icon}</span>
              <h3>{integration.name}</h3>
            </div>
            <p className="integration-description">{integration.description}</p>
            <div className="integration-footer">
              <span className="integration-status-badge">
                Status: {integration.status}
              </span>
              <button 
                className={`action-button ${integration.status === 'Connected' ? 'primary-button' : 'secondary-button'}`}
                onClick={() => handleAction(integration)}
              >
                {integration.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;