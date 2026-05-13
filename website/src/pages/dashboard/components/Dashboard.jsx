// Real-backend dashboard — fetches /admin/api/stats + /admin/api/batches and renders KPI cards
// with a filterable list. The mock data file is gone; all numbers come from SQLite.
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { AllInbox, LocalShipping, CheckCircle, Warning } from '@mui/icons-material';

import { AdminAPI } from '../../../services/apiClient';
import { useAuth } from '../../../contexts/AuthContext';

const PHASE_LABEL = {
  with_farmer: 'With farmer',
  in_transit_to_lab: 'In transit to lab',
  at_lab: 'At lab',
  with_farmer_after_lab: 'Back with farmer',
  in_transit_to_manufacturer: 'To manufacturer',
  with_manufacturer: 'With manufacturer',
  consumed: 'Used in product',
};

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

export default function Dashboard() {
  const { accessToken, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, batchesRes] = await Promise.all([
          AdminAPI.stats(accessToken),
          AdminAPI.batches(accessToken),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setBatches(batchesRes.batches || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const kpis = useMemo(() => {
    if (!stats) return null;
    const total = stats.batches?.total ?? 0;
    const phases = stats.batches?.by_phase || {};
    const inTransit =
      (phases.in_transit_to_lab || 0) + (phases.in_transit_to_manufacturer || 0);
    const completed = phases.consumed || 0;
    const rejected = stats.batches?.by_test_result?.rejected || 0;
    return { totalBatches: total, inTransit, delivered: completed, withAlerts: rejected };
  }, [stats]);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const matchesPhase = phaseFilter === 'All' || b.state.phase === phaseFilter;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        b.herb.batch_id.toLowerCase().includes(search) ||
        (b.herb.species_name || '').toLowerCase().includes(search);
      return matchesPhase && matchesSearch;
    });
  }, [batches, searchTerm, phaseFilter]);

  if (role !== 'admin') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Sign in with an admin account to see system-wide stats. Other roles can
        still view individual batch journeys at <code>/trace/&lt;batch-id&gt;</code>.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Batches"
            value={kpis?.totalBatches ?? 0}
            icon={<AllInbox sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="In Transit"
            value={kpis?.inTransit ?? 0}
            icon={<LocalShipping sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Used in Products"
            value={kpis?.delivered ?? 0}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Rejected by Lab"
            value={kpis?.withAlerts ?? 0}
            icon={<Warning sx={{ fontSize: 40 }} />}
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search by Batch ID or species…"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Phase</InputLabel>
              <Select
                value={phaseFilter}
                label="Phase"
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {Object.entries(PHASE_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={2}>
        {filtered.map((b) => (
          <Grid item xs={12} md={6} key={b.herb.batch_id}>
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  flexWrap="wrap"
                >
                  <Typography fontWeight={700}>{b.herb.species_name}</Typography>
                  <Chip
                    label={PHASE_LABEL[b.state.phase] || b.state.phase}
                    size="small"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {b.herb.batch_id} · {b.herb.weight_kg} kg · {b.herb.location}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Holder: {b.state.current_holder_id} · Test: {b.state.test_result}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Link component={RouterLink} to={`/trace/${b.herb.batch_id}`}>
                    View full journey →
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Alert severity="info" sx={{ mt: 4 }}>
          No batches match your filters.
        </Alert>
      )}
    </Box>
  );
}
