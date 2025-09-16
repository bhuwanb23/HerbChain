// src/pages/Recalls.js
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batches } from '../data/mockData';
import './Recalls.css';

const Recalls = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [recallReason, setRecallReason] = useState('');
  const [recallInitiated, setRecallInitiated] = useState(false);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === batchId);
  }, [batchId]);

  const handleInitiateRecall = () => {
    if (recallReason.trim() === '') {
      alert('Please provide a reason for the recall.');
      return;
    }
    // Simulate a successful recall action
    console.log(`Initiating recall for batch ${selectedBatch.name} due to: ${recallReason}`);
    setRecallInitiated(true);
  };

  if (!selectedBatch) {
    return (
      <div className="recalls-container">
        <h2 className="page-title">Batch not found</h2>
        <button onClick={() => navigate('/alerts')} className="action-button">
          Go back to Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="recalls-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Initiate Recall</h1>
          <p className="page-subtitle">For Batch: {selectedBatch.id} - {selectedBatch.name}</p>
        </div>
        <button onClick={() => navigate('/alerts')} className="action-button secondary-button">
          ← Back to Alerts
        </button>
      </div>
      <div className="recall-panel card">
        <div className="recall-details">
          <h3>Violation Details</h3>
          <p>
            <strong>Violation:</strong>{' '}
            {selectedBatch.compliance !== '100% Compliant'
              ? `Compliance is at ${selectedBatch.compliance}.`
              : `Supply chain health is low (${selectedBatch.supplyChainHealth}%).`}
          </p>
          <p className="warning-text">
            ⚠️ This batch may not meet quality standards and must be recalled.
          </p>
        </div>
        {!recallInitiated ? (
          <div className="recall-form">
            <label htmlFor="recall-reason">Reason for Recall:</label>
            <textarea
              id="recall-reason"
              value={recallReason}
              onChange={(e) => setRecallReason(e.target.value)}
              placeholder="e.g., Contamination risk, failed lab test, non-compliance with AYUSH standards..."
              rows="4"
            ></textarea>
            <button onClick={handleInitiateRecall} className="primary-button action-button">
              Initiate Recall
            </button>
          </div>
        ) : (
          <div className="recall-success card">
            <h3>✅ Recall Initiated Successfully!</h3>
            <p>A recall notice has been sent for batch <strong>{selectedBatch.name}</strong>.</p>
            <p>Reason: {recallReason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recalls;