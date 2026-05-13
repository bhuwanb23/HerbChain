// src/pages/Reports.js
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { batches } from '../data/mockData';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import './Reports.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Reports = () => {
  const navigate = useNavigate();

  // Updated Data for the charts
  const herbTypeData = useMemo(() => {
    const counts = batches.reduce((acc, batch) => {
      acc[batch.herbType] = (acc[batch.herbType] || 0) + 1;
      return acc;
    }, {});
    
    // Add more mock data for the graph
    const allHerbTypes = {
        'Ashwagandha': 4,
        'Brahmi': 3,
        'Tulsi': 5,
        'Amla': 2,
        'Neem': 3,
        'Guduchi': 1,
        'Haritaki': 2,
        ...counts
    };

    return {
      labels: Object.keys(allHerbTypes),
      datasets: [{
        data: Object.values(allHerbTypes),
        backgroundColor: [
          '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800',
          '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5', '#673AB7',
          '#E91E63', '#9C27B0'
        ],
      }],
    };
  }, []);

  const complianceHistoryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      label: 'Average Compliance %',
      data: [85, 88, 92, 90, 94, 96, 91, 93, 95, 94],
      backgroundColor: '#4CAF50',
    }],
  };

  const supplyChainHealthData = {
    labels: ['High Health', 'Medium Health', 'Low Health'],
    datasets: [{
      label: 'Supply Chain Health',
      data: [
        batches.filter(b => b.supplyChainHealth >= 90).length,
        batches.filter(b => b.supplyChainHealth >= 75 && b.supplyChainHealth < 90).length,
        batches.filter(b => b.supplyChainHealth < 75).length
      ],
      backgroundColor: ['#4CAF50', '#FFC107', '#D32F2F'],
    }]
  };
  
  // Handlers for the buttons
  const handleExport = () => alert('Exporting report...');
  const handleRequest = () => alert('Requesting custom report...');
  const handleInvestigate = () => navigate('/alerts');
  const handleDisburse = () => navigate('/incentives');

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">State/national-level insights, sustainability reports, and consumer trust analytics.</p>
        </div>
        <div className="header-actions">
          <button className="action-button primary-button" onClick={handleExport}>Export Report</button>
          <button className="action-button secondary-button" onClick={handleRequest}>Request Custom Report</button>
        </div>
      </div>

      <div className="reports-kpi-grid">
        <div className="card kpi-card">
          <span className="kpi-value">
            {Math.round((batches.filter(b => b.supplyChainHealth >= 90).length / batches.length) * 100)}%
          </span>
          <span className="kpi-label">High Health Batches</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-value">
            {batches.filter(b => b.supplyChainHealth < 75).length}
          </span>
          <span className="kpi-label">At-Risk Batches</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-value">1,250</span>
          <span className="kpi-label">Consumer Scans This Month</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-value">4.8/5</span>
          <span className="kpi-label">Average Trust Score</span>
        </div>
      </div>

      <div className="reports-main-grid">
        <div className="card chart-card">
          <h3 className="section-title">Herb Type Distribution</h3>
          <div className="chart-container">
            <Doughnut data={herbTypeData} />
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="section-title">Compliance Trends</h3>
          <div className="chart-container">
            <Bar data={complianceHistoryData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="section-title">Supply Chain Health Breakdown</h3>
          <div className="chart-container">
            <Doughnut data={supplyChainHealthData} />
          </div>
        </div>

        <div className="card reports-section">
          <h3 className="section-title">Actionable Insights</h3>
          <div className="insight-item">
            <p className="insight-text">
              <span className="insight-icon">⚠️</span> Geo-fence violations increased by 15% in Tamil Nadu last quarter.
            </p>
            <button className="insight-button" onClick={handleInvestigate}>Investigate</button>
          </div>
          <div className="insight-item">
            <p className="insight-text">
              <span className="insight-icon">💰</span> Over ₹50 lakhs in incentives are pending disbursement.
            </p>
            <button className="insight-button" onClick={handleDisburse}>Disburse Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;