// Real-backend dashboard — fetches /api/v1/admin/portal/dashboard (P13 KPIs,
// entity widgets, compliance surface) and lists recent batches via
// /api/v1/admin/portal/search. All numbers come from the live backend.
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Link,
  TextField,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  AllInbox,
  Agriculture,
  CheckCircle,
  ErrorOutline,
  Factory,
  Hub,
  LocalShipping,
  PendingActions,
  Receipt,
  Science,
  VerifiedUser,
  Warning,
} from '@mui/icons-material';

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

const KpiCard = ({ title, value, icon, color = 'primary.main' }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Box sx={{ mr: 2, color }}>{icon}</Box>
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

const StatRow = ({ label, value }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="baseline"
    sx={{ py: 0.75 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="subtitle1" fontWeight={700}>
      {value}
    </Typography>
  </Stack>
);

const WidgetCard = ({ title, icon, stats }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Divider />
      {stats.map(({ label, value }) => (
        <StatRow key={label} label={label} value={value} />
      ))}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { accessToken, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = role === 'admin';

  useEffect(() => {
    let cancelled = false;
    if (!isAdmin) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const dash = await AdminAPI.stats(accessToken);
        if (cancelled) return;
        // Route wraps the payload: { dashboard: { kpis, widgets, compliance_surface } }
        setStats(dash?.dashboard || dash);
        // Recent batches for the list — universal search with an empty query
        // returns nothing, so pull by wildcard: search 'HERB' matches batch codes.
        try {
          const found = await AdminAPI.search(accessToken, 'HERB', { limit: 24 });
          if (!cancelled) setBatches(found.results || []);
        } catch {
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
  }, [accessToken, isAdmin]);

  const k = stats?.kpis || {};
  const cs = stats?.compliance_surface || {};

  const widgetCards = useMemo(() => {
    const w = stats?.widgets || {};
    const cards = [];
    if (w.farmers) {
      cards.push({
        key: 'farmers',
        title: 'Farmers',
        icon: <Agriculture sx={{ fontSize: 28 }} />,
        stats: [
          { label: 'Registered', value: w.farmers.registered ?? 0 },
          { label: 'KYC verified', value: w.farmers.verified ?? 0 },
          { label: 'New (30 days)', value: w.farmers.new_registrations_30d ?? 0 },
        ],
      });
    }
    if (w.labs) {
      cards.push({
        key: 'labs',
        title: 'Laboratories',
        icon: <Science sx={{ fontSize: 28 }} />,
        stats: [
          { label: 'Active labs', value: w.labs.active_labs ?? 0 },
          { label: 'Certifications issued', value: w.labs.certification_count ?? 0 },
          { label: 'Failure rate', value: `${w.labs.failure_rate_pct ?? 0}%` },
          { label: 'Species mismatches', value: w.labs.species_mismatches ?? 0 },
        ],
      });
    }
    if (w.manufacturers) {
      cards.push({
        key: 'manufacturers',
        title: 'Manufacturers',
        icon: <Factory sx={{ fontSize: 28 }} />,
        stats: [
          { label: 'Active', value: w.manufacturers.active_manufacturers ?? 0 },
          { label: 'Products created', value: w.manufacturers.products_created ?? 0 },
          { label: 'Inventory (kg)', value: w.manufacturers.inventory_volume_kg ?? 0 },
        ],
      });
    }
    if (w.logistics) {
      cards.push({
        key: 'logistics',
        title: 'Logistics',
        icon: <LocalShipping sx={{ fontSize: 28 }} />,
        stats: [
          { label: 'In transit', value: w.logistics.shipments_in_transit ?? 0 },
          { label: 'Successful deliveries', value: w.logistics.successful_deliveries ?? 0 },
          { label: 'Delivery failures', value: w.logistics.delivery_failures ?? 0 },
        ],
      });
    }
    return cards;
  }, [stats]);

  const batchRows = useMemo(
    () => batches.filter((r) => r.category === 'batch'),
    [batches],
  );

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return batchRows;
    return batchRows.filter(
      (r) =>
        String(r.code || '').toLowerCase().includes(needle) ||
        String(r.id || '').toLowerCase().includes(needle) ||
        String(r.species || '').toLowerCase().includes(needle) ||
        String(r.phase || '').toLowerCase().includes(needle),
    );
  }, [batchRows, searchTerm]);

  if (!isAdmin) {
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Batches"
            value={k.active_batches ?? 0}
            icon={<AllInbox sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Shipments"
            value={k.active_shipments ?? 0}
            icon={<LocalShipping sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Certified Batches"
            value={k.certified_batches ?? 0}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Open Compliance Alerts"
            value={k.compliance_alerts ?? 0}
            icon={<Warning sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Rejected Batches"
            value={k.rejected_batches ?? 0}
            icon={<ErrorOutline sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Pending Approvals"
            value={k.pending_approvals ?? 0}
            icon={<PendingActions sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Products Created"
            value={k.products_created ?? 0}
            icon={<Receipt sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Blockchain Transactions"
            value={k.blockchain_transactions ?? 0}
            icon={<Hub sx={{ fontSize: 40 }} />}
          />
        </Grid>
      </Grid>

      {widgetCards.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ecosystem
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {widgetCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.key}>
                <WidgetCard title={card.title} icon={card.icon} stats={card.stats} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>
        Compliance surface
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderLeft: '4px solid',
              borderLeftColor:
                (cs.suspicious_activities ?? 0) > 0 ? 'error.main' : 'success.main',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ErrorOutline
                  sx={{
                    color: (cs.suspicious_activities ?? 0) > 0 ? 'error.main' : 'success.main',
                  }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  High / critical alerts
                </Typography>
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
                {cs.suspicious_activities ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open or acknowledged HIGH / CRITICAL compliance alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderLeft: '4px solid',
              borderLeftColor:
                (cs.certificate_expiry_soon ?? 0) > 0 ? 'warning.main' : 'success.main',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <VerifiedUser
                  sx={{
                    color: (cs.certificate_expiry_soon ?? 0) > 0 ? 'warning.main' : 'success.main',
                  }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  Certificates expiring soon
                </Typography>
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
                {cs.certificate_expiry_soon ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certifications inside the expiry warning window
              </Typography>
            </CardContent>
          </Card>
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
                  <Typography fontWeight={700}>{r.code || r.id}</Typography>
                  {r.species && <Chip label={r.species} size="small" />}
                  {r.phase && <Chip label={PHASE_LABEL[r.phase] || r.phase} size="small" variant="outlined" />}
                  {r.test_status && <Chip label={r.test_status} size="small" color={r.test_status === 'certified' ? 'success' : r.test_status === 'rejected' ? 'error' : 'default'} />}
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
