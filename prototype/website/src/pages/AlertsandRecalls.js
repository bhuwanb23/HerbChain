// src/pages/AlertsAndRecalls.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { batches, alerts } from '../data/mockData';
import './AlertsandRecalls.css';

const AlertsAndRecalls = () => {
  const navigate = useNavigate();

  const criticalAlerts = alerts.filter(alert => alert.severity === 'warning' || alert.severity === 'error');
  const initiatedRecalls = batches.filter(batch => batch.status === 'Recalled');

  const handleInitiateRecall = (batchId) => {
    navigate(`/recalls/${batchId}`);
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header-section">
        <h1 className="alerts-header-title">Alerts & Recall Management</h1>
        <p className="alerts-header-subtitle">Warnings for critical violations and tools to initiate recalls.</p>
      </div>

      <div className="alerts-main-grid">
        <div className="alerts-section card">
          <h2 className="section-title">Critical Alerts</h2>
          {criticalAlerts.length > 0 ? (
            <ul className="alert-list">
              {criticalAlerts.map((alert) => (
                <li key={alert.id} className="alert-item">
                  <div className="alert-details">
                    <span className="alert-icon">
                      {alert.type.includes('Contamination') ? '☣️' : '⚠️'}
                    </span>
                    <div>
                      <p className="alert-type">{alert.type}</p>
                      <p className="alert-reason">{alert.reason}</p>
                      <p className="alert-batch-id">Batch ID: {alert.batchId}</p>
                    </div>
                  </div>
                  <button 
                    className="action-button primary-button"
                    onClick={() => handleInitiateRecall(alert.batchId)}
                  >
                    Initiate Recall
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-alerts">No new critical alerts. All systems are go!</p>
          )}
        </div>

        <div className="recalls-section card">
          <h2 className="section-title">Initiated Recalls</h2>
          {initiatedRecalls.length > 0 ? (
            <ul className="recall-list">
              {initiatedRecalls.map((recall) => (
                <li key={recall.id} className="recall-item">
                  <div className="recall-details">
                    <span className="recall-icon">📦</span>
                    <div>
                      <p className="recall-type">Batch {recall.id} has been recalled</p>
                      <p className="recall-reason">Reason: {recall.reason}</p>
                    </div>
                  </div>
                  <span className="recall-status">Recalled</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-recalls">No recalls have been initiated.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsAndRecalls;