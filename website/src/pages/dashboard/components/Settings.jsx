// src/components/Settings.jsx
import React from 'react';

function Settings({ currentTheme, onToggleTheme }) {
  return (
    <div className="settings-page">
      <h2>Profile & Settings</h2>
      <p>System-wide permissions, security configurations, and admin profile settings will be managed here.</p>
      
      <div className="setting-section">
        <h3>Appearance</h3>
        <p>Current Theme: <strong>{currentTheme}</strong></p>
        <button onClick={onToggleTheme} className="theme-toggle-button">
          Switch to {currentTheme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

       <div className="setting-section">
        <h3>Role Permissions</h3>
        <p>Define what each role (Farmer, Lab, etc.) can see and do.</p>
      </div>
    </div>
  );
}

export default Settings;