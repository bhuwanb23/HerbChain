// src/components/Dashboard.jsx
import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { batches } from '../constants/mockData';

// Import MUI Components
import { Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Box, Link } from '@mui/material';
import { AllInbox, LocalShipping, CheckCircle, Warning } from '@mui/icons-material';

// Reusable KPI Card Component using MUI
const KpiCard = ({ title, value, icon }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
    <Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  </Card>
);

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Calculate KPIs from the full batch list
  const kpis = useMemo(() => ({
    totalBatches: batches.length,
    inTransit: batches.filter(b => b.status === 'In Transit').length,
    withAlerts: batches.filter(b => b.hasAlert).length,
    delivered: batches.filter(b => b.status === 'Delivered').length,
  }), []);

  // Filter and search batches for display
  const filteredBatches = batches.filter(batch => 
    (statusFilter === 'All' || batch.status === statusFilter) &&
    (batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     batch.herbName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      {/* Section 1: KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><KpiCard title="Total Batches" value={kpis.totalBatches} icon={<AllInbox sx={{ fontSize: 40 }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KpiCard title="In Transit" value={kpis.inTransit} icon={<LocalShipping sx={{ fontSize: 40 }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KpiCard title="Delivered" value={kpis.delivered} icon={<CheckCircle sx={{ fontSize: 40 }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KpiCard title="Compliance Alerts" value={kpis.withAlerts} icon={<Warning sx={{ fontSize: 40 }} />} /></Grid>
      </Grid>

      {/* Section 2: Search and Filter */}
      <Card variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Search by Batch ID or Herb Name..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Quality Check">Quality Check</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Section 3: Batch List */}
      <Grid container spacing={3}>
        {filteredBatches.length > 0 ? (
          filteredBatches.map(batch => (
            <Grid item xs={12} sm={6} md={4} key={batch.batchId}>
              <Link component={RouterLink} to={`/trace/${batch.batchId}`} sx={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                <Card variant="outlined" sx={{ height: '100%', borderLeft: batch.hasAlert ? '4px solid' : '4px solid transparent', borderLeftColor: batch.hasAlert ? 'error.main' : 'transparent' }}>
                  <CardContent>
                    <Typography variant="h6" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {batch.herbName}
                      <span className={`status-pill ${batch.status.toLowerCase().replace(' ', '-')}`}>{batch.status}</span>
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1.5 }}>ID: {batch.batchId}</Typography>
                    <Typography variant="body2">Created: {batch.createdDate}</Typography>
                    <Typography variant="body2">Location: {batch.history.slice(-1)[0].location}</Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>No batches match your search criteria.</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Dashboard;