// src/pages/Incentives.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './Incentives.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// Modal component for displaying detailed metric information
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

const Incentives = () => {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState(null);

  const [farmers] = useState([
    { id: 1, name: 'Ram Singh', tokens: 150, ecoBonus: true, herbType: 'Chamomile' },
    { id: 2, name: 'Priya Sharma', tokens: 230, ecoBonus: false, herbType: 'Lavender' },
    { id: 3, name: 'Anil Kumar', tokens: 85, ecoBonus: true, herbType: 'Peppermint' },
    { id: 4, name: 'Sita Devi', tokens: 190, ecoBonus: false, herbType: 'Chamomile' },
    { id: 5, name: 'Gopal Reddy', tokens: 250, ecoBonus: true, herbType: 'Peppermint' },
  ]);

  const [ecoTarget] = useState(10);
  const ecoProgress = farmers.filter(f => f.ecoBonus).length;
  const ecoProgressPercentage = (ecoProgress / ecoTarget) * 100;

  const tokenDistributionData = useMemo(() => {
    const herbTokenCounts = farmers.reduce((acc, farmer) => {
      acc[farmer.herbType] = (acc[farmer.herbType] || 0) + farmer.tokens;
      return acc;
    }, {});
    
    return {
      labels: Object.keys(herbTokenCounts),
      datasets: [{
        data: Object.values(herbTokenCounts),
        backgroundColor: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'],
      }],
    };
  }, [farmers]);

  const incentiveMetrics = useMemo(() => {
    return {
      totalTokens: {
        label: 'Total Token Rewards',
        value: farmers.reduce((sum, farmer) => sum + farmer.tokens, 0),
        unit: 'Tokens',
        details: (
          <div>
            <p><strong>Overview:</strong> This is the total number of tokens distributed to farmers for their contributions. Tokens can be redeemed for various benefits, including future training or farm equipment.</p>
            <p><strong>Action:</strong> <button className="modal-action-button" onClick={() => { setSelectedMetric(null); alert('Generating token distribution report...'); }}>Generate Token Report</button></p>
          </div>
        )
      },
      pendingFunds: {
        label: 'Pending Funds',
        value: '₹50K',
        unit: 'Estimated',
        details: (
          <div>
            <p><strong>Overview:</strong> This metric represents the estimated value of funds that are pending disbursement to farmers and other stakeholders.</p>
            <p><strong>Action:</strong> <button onClick={() => setSelectedMetric(null)} className="modal-action-button">Disburse All Pending Funds</button></p>
          </div>
        )
      },
      ecoBonuses: {
        label: 'Eco-Bonuses Disbursed',
        value: ecoProgress,
        unit: 'Farmers',
        details: (
          <div>
            <p><strong>Overview:</strong> This shows the number of farmers who have received an eco-bonus for adopting sustainable farming practices. These bonuses are part of our commitment to promoting eco-friendly methods.</p>
            <p><strong>Progress:</strong> We are {ecoProgressPercentage}% of the way to our quarterly goal of {ecoTarget} eco-bonuses.</p>
            <button onClick={() => { setSelectedMetric(null); navigate('/reports'); }} className="modal-action-button">View Sustainability Report</button>
          </div>
        )
      }
    };
  }, [farmers, ecoProgress, ecoProgressPercentage, ecoTarget, navigate]);

  const handleDisburseFunds = (farmerName) => {
    alert(`Disbursing funds to ${farmerName}...`);
  };

  const handleApplyForScheme = () => {
    alert("Redirecting to subsidy portal...");
  };

  return (
    <div className="incentives-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incentives & Funding</h1>
          <p className="page-subtitle">Oversee tokenized farmer rewards and link to subsidy schemes.</p>
        </div>
      </div>

      <div className="card-grid">
        {Object.values(incentiveMetrics).map((metric, index) => (
          <div 
            key={index} 
            className="card incentive-card" 
            onClick={() => setSelectedMetric(metric)}
          >
            <span className="incentive-label">{metric.label}</span>
            <span className="incentive-value">{metric.value}</span>
            <span className="unit">{metric.unit}</span>
          </div>
        ))}
      </div>

      <div className="main-content-grid">
        <div className="incentives-section card chart-section">
          <h2 className="section-title">Reward Distribution by Herb</h2>
          <div className="chart-container">
            <Doughnut data={tokenDistributionData} />
          </div>
        </div>
        
        <div className="incentives-section card">
          <h2 className="section-title">Eco-Incentive Progress</h2>
          <p className="eco-text">
            We've rewarded {ecoProgress} out of our {ecoTarget} farmers who adopted sustainable practices this quarter.
          </p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${ecoProgressPercentage}%` }}></div>
          </div>
          <span className="progress-value">{ecoProgressPercentage}% Complete</span>
          <button className="subsidy-link" onClick={handleApplyForScheme}>
            Apply for Eco-Bonus Scheme
          </button>
        </div>
      </div>

      <div className="incentives-section card">
        <h2 className="section-title">Farmer List & Rewards</h2>
        <ul className="farmer-list">
          {farmers.map((farmer) => (
            <li key={farmer.id} className="farmer-item">
              <div className="farmer-info">
                <span className="farmer-name">{farmer.name}</span>
                <span className="farmer-tokens">{farmer.tokens} Tokens</span>
              </div>
              {farmer.ecoBonus && <span className="eco-badge">🌿 Eco-Bonus</span>}
              <button onClick={() => handleDisburseFunds(farmer.name)} className="action-button">
                Disburse
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="incentives-section card">
        <h2 className="section-title">Government Subsidy Schemes</h2>
        <p>
          Connect with government portals to manage and apply for agricultural subsidy schemes. Our system helps streamline documentation and compliance for faster approvals.
        </p>
        <a href="https://ayush.gov.in/" target="_blank" rel="noopener noreferrer" className="action-button primary-button">
          Go to AYUSH Grid
        </a>
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

export default Incentives;