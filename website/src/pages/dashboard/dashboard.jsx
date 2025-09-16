import React, { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Container } from '@mui/material'
import { lightTheme, darkTheme } from './constants/theme'
import Dashboard from './components/Dashboard.jsx'
import CompliancePage from './components/CompliancePage.jsx'
import ReportsPage from './components/ReportsPage.jsx'
import Traceability from './components/Traceability.jsx'
import UserManagement from './components/UserManagement.jsx'
import Settings from './components/Settings.jsx'
import { users as initialUsers } from './constants/mockData'
import 'leaflet/dist/leaflet.css'
import Header from '../../components/header.jsx'

function DashboardShell() {
  const [themeMode, setThemeMode] = useState('light')
  const theme = useMemo(() => (themeMode === 'light' ? lightTheme : darkTheme), [themeMode])

  const [users, setUsers] = useState(initialUsers)

  const handleAddUser = (user) => {
    const nextId = users.length ? Math.max(...users.map(u => u.id || 0)) + 1 : 1
    setUsers(prev => [...prev, { ...user, id: nextId }])
  }

  const handleUpdateUser = (user) => {
    setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, ...user } : u)))
  }

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const toggleTheme = () => setThemeMode(m => (m === 'light' ? 'dark' : 'light'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trace/:batchId" element={<Traceability />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={
            <UserManagement
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          } />
          <Route path="/settings" element={<Settings currentTheme={themeMode} onToggleTheme={toggleTheme} />} />
          <Route path="/recall" element={<div className="py-6"><h2 className="text-2xl font-semibold">Alerts & Recall Management</h2><p className="text-gray-500">Manage warnings, violations, and initiate recalls.</p></div>} />
          <Route path="/incentives" element={<div className="py-6"><h2 className="text-2xl font-semibold">Incentives & Funding</h2><p className="text-gray-500">Oversee rewards, eco-bonuses, and subsidies.</p></div>} />
          <Route path="/integration" element={<div className="py-6"><h2 className="text-2xl font-semibold">Integration & API Management</h2><p className="text-gray-500">Connect with AYUSH Grid, A-HMIS, and ERP.</p></div>} />
          <Route path="/support" element={<div className="py-6"><h2 className="text-2xl font-semibold">Support & Dispute Resolution</h2><p className="text-gray-500">Handle escalations and disputes across the chain.</p></div>} />
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


