import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { AdminAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_OPTIONS = [
  'all',
  'farmer',
  'transporter',
  'lab',
  'manufacturer',
  'consumer',
  'admin',
];

const ROLE_COLOR = {
  farmer: 'success',
  transporter: 'info',
  lab: 'warning',
  manufacturer: 'secondary',
  consumer: 'default',
  admin: 'error',
};

export default function UsersPage() {
  const { accessToken, role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await AdminAPI.users(accessToken, {
          role: filter === 'all' ? null : filter,
        });
        if (!cancelled) setUsers(res.users || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, filter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.user_id || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q),
    );
  }, [users, search]);

  if (role !== 'admin') {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Admin role required to view user management.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        User & Role Management
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by name, email, or id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filter}
                  label="Role"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r === 'all' ? 'All roles' : r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} of {users.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Grid container spacing={2}>
          {filtered.map((u) => (
            <Grid item xs={12} sm={6} md={4} key={u.user_id}>
              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{u.name || u.user_id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {u.user_id}
                      </Typography>
                    </Box>
                    <Chip
                      label={u.role}
                      size="small"
                      color={ROLE_COLOR[u.role] || 'default'}
                    />
                  </Box>
                  {u.email && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {u.email}
                    </Typography>
                  )}
                  {u.phone && (
                    <Typography variant="body2" color="text.secondary">
                      {u.phone}
                    </Typography>
                  )}
                  {u.location && (
                    <Typography variant="body2" color="text.secondary">
                      {u.location}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    {u.is_active === false && (
                      <Chip label="Disabled" size="small" color="error" />
                    )}
                    {u.kyc_verified && (
                      <Chip label="KYC verified" size="small" color="success" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">No users match your filters.</Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
