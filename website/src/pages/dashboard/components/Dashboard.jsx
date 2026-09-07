// Real-backend dashboard — fetches /api/v1/admin/portal/dashboard (P13 KPIs)
// and lists recent batches via /api/v1/admin/portal/search. All numbers come
// from the live second_backend.
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const dash = await AdminAPI.stats(accessToken);
        if (cancelled) return;
        setStats(dash);
        // Recent batches for the list — universal search with an empty query
        // returns nothing, so pull by wildcard: search 'HERB' matches batch codes.
        try {
          const found = await AdminAPI.search(accessToken, 'HERB', { limit: 24 });
          if (!cancelled) setBatches(found.results || []);
        } catch (_e) {
          if (!cancelled) setBatches([]);
        }
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
    if (!stats?.kpis) return null;
    const k = stats.kpis;
    return {
      totalBatches: k.active_batches ?? 0,
      inTransit: k.active_shipments ?? 0,
      certified: k.certified_batches ?? 0,
      rejected: k.rejected_batches ?? 0,
      alerts: k.compliance_alerts ?? 0,
    };
  }, [stats]);

  const batchRows = useMemo(
    () => batches.filter((r) => r.type === 'batch'),
    [batches],
  );

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return batchRows;
    return batchRows.filter(
      (r) =>
        (r.label || '').toLowerCase().includes(needle) ||
        (r.id || '').toLowerCase().includes(needle) ||
        (r.sublabel || '').toLowerCase().includes(needle),
    );
  }, [batchRows, searchTerm]);

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
            title="Active Batches"
            value={kpis?.totalBatches ?? 0}
            icon={<AllInbox sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Shipments"
            value={kpis?.inTransit ?? 0}
            icon={<LocalShipping sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Certified Batches"
            value={kpis?.certified ?? 0}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Open Compliance Alerts"
            value={kpis?.alerts ?? 0}
            icon={<Warning sx={{ fontSize: 40 }} />}
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="Search recent batches…"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      <Grid container spacing={2}>
        {filtered.map((r) => (
          <Grid item xs={12} md={6} key={r.id}>
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  flexWrap="wrap"
                >
                  <Typography fontWeight={700}>{r.label || r.id}</Typography>
                  {r.sublabel && <Chip label={r.sublabel} size="small" />}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {r.id}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Link component={RouterLink} to={`/trace/${r.id}`}>
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
