// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Compliance from './pages/Compliance';
import AlertsandRecalls from './pages/AlertsandRecalls';
import Recalls from './pages/Recalls';
import Reports from './pages/Reports';
import Incentives from './pages/Incentives';
import Integrations from './pages/Integrations';
import Support from './pages/Support';
import './App.css';


const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2 className="logo">AyurGuard</h2>
          </div>
          <ul className="nav-list">
            <li>
              <NavLink to="/compliance" className="nav-item">
                Compliance
              </NavLink>
            </li>
            <li>
              <NavLink to="/alerts" className="nav-item">
                Alerts & Recalls
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className="nav-item">
                Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/incentives" className="nav-item">
                Incentives
              </NavLink>
            </li>
            <li>
              <NavLink to="/integrations" className="nav-item">
                Integrations
              </NavLink>
            </li>
            <li>
              <NavLink to="/support" className="nav-item">
                Support
              </NavLink>
            </li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/alerts" element={<AlertsandRecalls />} />
            <Route path="/recalls/:batchId" element={<Recalls />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/incentives" element={<Incentives />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Compliance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;