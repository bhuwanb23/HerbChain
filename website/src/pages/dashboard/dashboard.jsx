import React, { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material'
import { lightTheme, darkTheme } from './constants/theme'
import Dashboard from './components/Dashboard.jsx'
import CompliancePage from './components/CompliancePage.jsx'
import ReportsPage from './components/ReportsPage.jsx'
import Traceability from './components/Traceability.jsx'
import UserManagement from './components/UserManagement.jsx'
import Settings from './components/Settings.jsx'
import { users as initialUsers } from './constants/mockData'
import 'leaflet/dist/leaflet.css'

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
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>HerbChain Admin</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/compliance">Compliance</Button>
            <Button color="inherit" component={Link} to="/reports">Reports</Button>
            <Button color="inherit" component={Link} to="/users">Users</Button>
            <Button color="inherit" component={Link} to="/settings">Settings</Button>
            <Button color="inherit" onClick={toggleTheme}>{themeMode === 'light' ? 'Dark' : 'Light'} Mode</Button>
          </Box>
        </Toolbar>
      </AppBar>
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


