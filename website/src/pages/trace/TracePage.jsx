import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { AdminAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const PHASE_LABEL = {
  with_farmer: 'With farmer',
  in_transit_to_lab: 'In transit to lab',
  at_lab: 'At lab',
  with_farmer_after_lab: 'Back with farmer',
  in_transit_to_manufacturer: 'To manufacturer',
  with_manufacturer: 'With manufacturer',
  consumed: 'Used in product',
};

const EVENT_LABEL = {
  BATCH_CREATED: 'Batch created',
  TRANSFER: 'Custody transfer',
  QR_ROTATED: 'QR rotated',
  SHIPMENT_CREATED: 'Shipment raised',
  PICKUP: 'Picked up',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  LAB_RECEIVED: 'Received at lab',
  SAMPLE_CREATED: 'Sample taken',
  TEST_COMPLETED: 'Test completed',
  CERTIFIED: 'Certified',
  REJECTED: 'Rejected',
  GRN: 'Goods receipt',
  MANUFACTURING_STARTED: 'Manufacturing started',
  MANUFACTURING_COMPLETED: 'Manufacturing completed',
};

function fmt(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function StepCard({ ev }) {
  const actorRole = ev.actor?.role || 'system';
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          spacing={1}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={EVENT_LABEL[ev.event_type] || ev.event_type}
              color="primary"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {fmt(ev.created_at)}
          </Typography>
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          <Typography variant="body2">
            <b>Actor:</b> {ev.actor?.name || '—'}{' '}
            <span style={{ color: '#888' }}>({actorRole})</span>
          </Typography>
          {ev.from && (
            <Typography variant="body2">
              <b>From:</b> {ev.from.name} ({ev.from.role})
            </Typography>
          )}
          {ev.to && (
            <Typography variant="body2">
              <b>To:</b> {ev.to.name} ({ev.to.role})
            </Typography>
          )}
          {ev.location && (
            <Typography variant="body2">
              <b>Location:</b> {ev.location}
            </Typography>
          )}
          {(ev.phase_before || ev.phase_after) && (
            <Typography variant="caption" color="text.secondary">
              {ev.phase_before || '—'} → {ev.phase_after || '—'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function TracePage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(batchId || '');

  useEffect(() => {
    if (!batchId) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await AdminAPI.batch(accessToken, batchId);
        if (!cancelled) setData(res.batch_trace || res);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || `Could not load ${batchId}`);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId, accessToken]);

  const onSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/trace/${search.trim()}`);
  };

  const b = data?.batch;
  const events = data?.ownership_history || [];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} component="form" onSubmit={onSearch}>
            <TextField
              fullWidth
              label="Search by batch code or id…"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="contained" type="submit">
              Trace
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {data && b && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="h6">{b.species?.common_name || b.code}</Typography>
                <Chip
                  label={PHASE_LABEL[b.phase] || b.phase || '—'}
                  color="primary"
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {b.code} · {b.weight_kg} kg · harvested {fmt(b.harvest_date)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {b.gps?.lat != null ? `GPS ${b.gps.lat.toFixed(4)}, ${b.gps.lng.toFixed(4)}` : ''} ·{' '}
                {b.cultivation_type || ''}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <b>Farmer:</b> {b.farmer?.name || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <b>Current holder:</b> {b.current_holder?.name || '—'} ({b.current_holder?.role || '—'})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <b>Test status:</b> {b.test_status || 'pending'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <b>Farmer trust score:</b>{' '}
                    {b.farmer_compliance_score ? `${b.farmer_compliance_score.score_value}/100` : '—'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {data.certificates?.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Certificates
                </Typography>
                {data.certificates.map((c) => (
                  <Stack key={c.certificate_number} direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip
                      label={c.active ? 'Active' : 'Expired'}
                      color={c.active ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {c.certificate_number} · {c.lab_code} · {fmt(c.issued_at)} · {c.issued_by || '—'}
                    </Typography>
                  </Stack>
                ))}
              </CardContent>
            </Card>
          )}

          {data.rejection && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <b>Rejected:</b> {data.rejection.reason} — {data.rejection.description}
            </Alert>
          )}

          <Typography fontWeight={700} sx={{ mb: 1 }}>
            Ownership & custody history ({events.length})
          </Typography>
          {events.length === 0 ? (
            <Alert severity="info">No custody events recorded for this batch.</Alert>
          ) : (
            events.map((ev, i) => <StepCard key={ev.event_id || i} ev={ev} />)
          )}

          {data.products_using_batch?.length > 0 && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Used in products (forward trace)
                </Typography>
                {data.products_using_batch.map((p, i) => (
                  <Typography key={i} variant="body2">
                    {p.run} → <b>{p.product?.name || p.product?.code || '—'}</b> ({p.quantity_kg} kg)
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}

          {data.recall_impacts?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <b>Recall impacts:</b>{' '}
              {data.recall_impacts.map((r) => `${r.product?.name || r.product?.code} (${r.status})`).join(', ')}
            </Alert>
          )}
        </>
      )}

      {!loading && !error && !data && batchId == null && (
        <Alert severity="info">Enter a batch code above to trace its full journey.</Alert>
      )}
    </Box>
  );
}
