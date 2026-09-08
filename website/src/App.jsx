import './App.css';
import React, { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box, CircularProgress } from '@mui/material';

import { lightTheme, darkTheme } from './pages/dashboard/constants/theme';
import Header from './components/header.jsx';
import Dashboard from './pages/dashboard/components/Dashboard.jsx';
import CompliancePage from './pages/compliance/compliance.jsx';
import AlertsAndRecallsPage from './pages/alerts_recall/alters_recall.jsx';
import ReportsPage from './pages/reports/report.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import TracePage from './pages/trace/TracePage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import IncentivesPage from './pages/incentives/incentives.jsx';
import IntegrationsPage from './pages/integrations/integrations.jsx';
import SupportPage from './pages/support/support.jsx';
import BlockchainExplorer from './pages/blockchain/BlockchainExplorer.jsx';
import InvestigationsPage from './pages/investigations/InvestigationsPage.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

function RequireAuth({ children, role }) {
  const { isLoggedIn, ready, user } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/trace" element={<TracePage />} />
          <Route path="/trace/:batchId" element={<TracePage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/compliance"
            element={
              <RequireAuth>
                <CompliancePage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <ReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth role="admin">
                <UsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/recall"
            element={
              <RequireAuth>
                <AlertsAndRecallsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/incentives"
            element={
              <RequireAuth>
                <IncentivesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/integrations"
            element={
              <RequireAuth role="admin">
                <IntegrationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/support"
            element={
              <RequireAuth>
                <SupportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/blockchain"
            element={
              <RequireAuth role="admin">
                <BlockchainExplorer />
              </RequireAuth>
            }
          />
          <Route
            path="/investigations"
            element={
              <RequireAuth role="admin">
                <InvestigationsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
}

function AppShell() {
  const [themeMode] = useState('light');
  const theme = useMemo(() => (themeMode === 'light' ? lightTheme : darkTheme), [themeMode]);
  const { ready, isLoggedIn } = useAuth();

  if (!ready) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
