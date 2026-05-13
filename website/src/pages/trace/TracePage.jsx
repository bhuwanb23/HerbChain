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

import { TraceabilityAPI } from '../../services/apiClient';

const PHASE_LABEL = {
  with_farmer: 'With farmer',
  in_transit_to_lab: 'In transit to lab',
  at_lab: 'At lab',
  with_farmer_after_lab: 'Back with farmer',
  in_transit_to_manufacturer: 'To manufacturer',
  with_manufacturer: 'With manufacturer',
  consumed: 'Used in product',
};

function fmt(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function StepCard({ step }) {
  const actorRole = step.actor?.role || 'system';
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
              label={`Step ${step.step}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 700 }}
            />
            <Typography fontWeight={600}>{step.label}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {fmt(step.occurred_at)}
          </Typography>
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          <Typography variant="body2">
            <b>Actor:</b> {step.actor?.name || step.actor?.user_id || '—'}{' '}
            <span style={{ color: '#888' }}>({actorRole})</span>
          </Typography>
          {step.from_party && (
            <Typography variant="body2">
              <b>From:</b> {step.from_party.name} ({step.from_party.role})
            </Typography>
          )}
          {step.to_party && (
            <Typography variant="body2">
              <b>To:</b> {step.to_party.name} ({step.to_party.role})
            </Typography>
          )}
          {step.location && (
            <Typography variant="body2">
              <b>Location:</b> {step.location}
            </Typography>
          )}
          {step.phase_before && (
            <Typography variant="caption" color="text.secondary">
              {step.phase_before} → {step.phase_after}
            </Typography>
          )}
        </Box>

        {step.lab_report && (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Lab report
            </Typography>
            <Typography variant="body2">
              Result: <b>{step.lab_report.test_result}</b>
            </Typography>
            {step.lab_report.notes && (
              <Typography variant="body2">{step.lab_report.notes}</Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function TracePage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
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
        const res = await TraceabilityAPI.batch(batchId);
        if (!cancelled) setData(res);
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
  }, [batchId]);

  const onSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/trace/${search.trim()}`);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Batch Traceability
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent component="form" onSubmit={onSearch}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Batch ID (e.g. BATCH123456)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="contained">
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

      {data && !loading && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{data.herb.species_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.herb.batch_id}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Harvest: {data.herb.harvest_date} · {data.herb.weight_kg} kg
                  </Typography>
                  <Typography variant="body2">
                    Origin: {data.herb.location || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={`Phase: ${
                        PHASE_LABEL[data.state?.phase] || data.state?.phase || '—'
                      }`}
                      color="primary"
                    />
                    <Chip
                      label={`Test: ${data.state?.test_result || 'pending'}`}
                      color={
                        data.state?.test_result === 'approved'
                          ? 'success'
                          : data.state?.test_result === 'rejected'
                          ? 'error'
                          : 'default'
                      }
                    />
                    {data.summary?.quality_certified && (
                      <Chip label="Quality Certified" color="success" />
                    )}
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <b>Farmer:</b> {data.farmer?.name || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <b>Current holder:</b>{' '}
                      {data.current_holder?.name || data.state?.current_holder_id || '—'}{' '}
                      ({data.current_holder?.role || '—'})
                    </Typography>
                    <Typography variant="body2">
                      <b>Total steps:</b> {data.summary?.total_steps ?? 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Journey timeline
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {data.journey.length === 0 ? (
            <Alert severity="info">No events recorded yet for this batch.</Alert>
          ) : (
            data.journey.map((step) => <StepCard key={step.event_id} step={step} />)
          )}

          {data.products && data.products.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Used in products
              </Typography>
              <Stack spacing={1}>
                {data.products.map((p) => (
                  <Card key={p.product_id} variant="outlined">
                    <CardContent>
                      <Typography fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.product_id} {p.sku ? `· SKU ${p.sku}` : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {!loading && !data && !error && batchId && (
        <Alert severity="info">No data for &quot;{batchId}&quot;.</Alert>
      )}

      {!batchId && !loading && !error && (
        <Alert severity="info">
          Enter a batch ID above to see its full traceability journey.
        </Alert>
      )}
    </Box>
  );
}
