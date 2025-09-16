// src/pages/Compliance.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { batches, alerts } from '../data/mockData';
import './Compliance.css';

// A modal component to display metric details and actions
const MetricDetailModal = ({ title, content, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {content}
        </div>
      </div>
    </div>
  );
};

const Compliance = () => {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState(null);

  const complianceMetrics = useMemo(() => {
    const totalBatches = batches.length;
    const compliantBatches = batches.filter(b => b.compliance === '100% Compliant').length;
    const activeViolations = alerts.length;
    
    return {
      complianceRate: {
        value: totalBatches > 0 ? (compliantBatches / totalBatches * 100).toFixed(1) : 0,
        label: 'Compliance Rate',
        details: (
          <div>
            <p><strong>Total Compliant Batches:</strong> {compliantBatches}</p>
            <p><strong>Total Batches:</strong> {totalBatches}</p>
            <p>This metric shows the percentage of all batches that currently meet all compliance standards.</p>
          </div>
        ),
      },
      activeViolations: {
        value: activeViolations,
        label: 'Active Violations',
        details: (
          <div>
            <p><strong>Total Active Alerts:</strong> {alerts.length}</p>
            <p>These are batches flagged for issues like contamination or unauthorized distribution.</p>
            <button className="modal-action-button" onClick={() => {
              setSelectedMetric(null);
              navigate('/alerts');
            }}>View All Alerts</button>
          </div>
        ),
      },
      geoFenceZones: {
        value: 156,
        label: 'Geo-fence Zones',
        details: (
          <div>
            <p><strong>Total Monitored Zones:</strong> 156</p>
            <p>This represents the number of geographical locations under active monitoring for secure distribution.</p>
          </div>
        ),
      },
      autoChecksToday: {
        value: 1248,
        label: 'Auto Checks Today',
        details: (
          <div>
            <p><strong>Total Automated Scans:</strong> 1248</p>
            <p>This number reflects the total automated checks performed on the supply chain today, including data validation and location tracking.</p>
          </div>
        ),
      },
    };
  }, [navigate]);

  const ayushStandards = [
    { name: 'Manufacturing Standards', compliance: 85 },
    { name: 'Quality Control', compliance: 92 },
    { name: 'Documentation', compliance: 78 },
    { name: 'Safety Protocols', compliance: 96 },
    { name: 'Labeling Standards', compliance: 89 },
    { name: 'Storage Requirements', compliance: 81 },
  ];

  const handleAlertAction = (action, batchId) => {
    if (action === 'Initiate Recall') {
      navigate(`/recalls/${batchId}`);
    } else if (action === 'Investigate') {
      alert(`Investigating batch ${batchId}...`);
    }
  };

  return (
    <div className="compliance-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance & Regulation</h1>
          <p className="page-subtitle">Automated monitoring and AYUSH standards compliance</p>
        </div>
        <div className="header-actions">
          <button className="action-button primary-button">
            + New Check
          </button>
          <button className="action-button secondary-button">
            Export
          </button>
        </div>
      </div>

      <div className="card-grid">
        {Object.values(complianceMetrics).map((metric, index) => (
          <div 
            key={index} 
            className="card compliance-metric-card" 
            onClick={() => setSelectedMetric(metric)}
          >
            <span className="metric-value">{metric.value}{metric.label === 'Compliance Rate' ? '%' : ''}</span>
            <span className="metric-label">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="compliance-main-grid">
        <div className="compliance-section card">
          <h2 className="section-title">AYUSH Standards Compliance</h2>
          <div className="standards-list">
            {ayushStandards.map((std, index) => (
              <div key={index} className="standard-item">
                <p className="standard-name">{std.name}</p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${std.compliance}%` }}></div>
                </div>
                <span className="standard-value">{std.compliance}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="critical-alerts-section card">
          <h2 className="section-title">Critical Alerts</h2>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <div className="alert-details">
                  <span className={`alert-icon`}>
                    {alert.severity === 'error' ? '❗' : '⚠️'}
                  </span>
                  <p>
                    <strong className="alert-title">{alert.type || 'Alert'}</strong>
                    <br />
                    <span className="alert-message">Batch {alert.batchId} - {alert.reason}</span>
                  </p>
                </div>
                <button
                  className="alert-button"
                  onClick={() => handleAlertAction(alert.severity === 'error' ? 'Initiate Recall' : 'Investigate', alert.batchId)}
                >
                  {alert.severity === 'error' ? 'Initiate Recall' : 'Investigate'}
                </button>
              </div>
            ))
          ) : (
            <p className="no-alerts-text">No critical alerts at this time.</p>
          )}
        </div>
      </div>

      {selectedMetric && (
        <MetricDetailModal
          title={selectedMetric.label}
          content={selectedMetric.details}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
};

export default Compliance;