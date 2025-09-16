import React, { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Container } from '@mui/material'
import { lightTheme, darkTheme } from './constants/theme'
import Header from '../../components/header.jsx'
import CompliancePage from '../compliance/compliance.jsx'
import AlertsAndRecallsPage from '../alerts_recall/alters_recall.jsx'
import Dashboard from './components/Dashboard.jsx'
import IntegrationsPage from '../integrations/integrations.jsx'
import IncentivesPage from '../incentives/incentives.jsx'
import ReportsPage from '../reports/report.jsx'
import SupportPage from '../support/support.jsx'

function DashboardShell() {
  const [themeMode, setThemeMode] = useState('light')
  const theme = useMemo(() => (themeMode === 'light' ? lightTheme : darkTheme), [themeMode])

  const toggleTheme = () => setThemeMode(m => (m === 'light' ? 'dark' : 'light'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trace/:batchId" element={<div className="py-10 text-center"><h1 className="text-2xl font-semibold">Traceability</h1><p className="text-gray-500 mt-2">Temporarily unavailable.</p></div>} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<div className="py-10 text-center"><h1 className="text-2xl font-semibold">User & Role Management</h1><p className="text-gray-500 mt-2">Temporarily unavailable.</p></div>} />
          <Route path="/settings" element={<div className="py-10 text-center"><h1 className="text-2xl font-semibold">Settings</h1><p className="text-gray-500 mt-2">Temporarily unavailable.</p></div>} />
          <Route path="/recall" element={<AlertsAndRecallsPage />} />
          <Route path="/incentives" element={<IncentivesPage />} />
          <Route path="/integration" element={<IntegrationsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </Container>
    </ThemeProvider>
  )
}

export default function DashboardApp() {
  return (
    <BrowserRouter>
      <DashboardShell />
    </BrowserRouter>
  )
}


