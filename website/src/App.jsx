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

function AppShell() {
  const [themeMode] = useState('light');
  const theme = useMemo(() => (themeMode === 'light' ? lightTheme : darkTheme), [themeMode]);
  const { ready, isLoggedIn } = useAuth();
  const location = useLocation();

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

  if (!isLoggedIn && location.pathname !== '/login' && !location.pathname.startsWith('/trace')) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="/trace" element={<TracePage />} />
          <Route path="/trace/:batchId" element={<TracePage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
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
