import React, { useEffect, useState } from 'react';
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

import { AdminAPI, API_BASE_URL } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user, accessToken, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [apiBaseInput, setApiBaseInput] = useState(API_BASE_URL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await AdminAPI.health();
        if (!cancelled) setHealth(res);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not reach API');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToken = async () => {
    if (!accessToken) return;
    try {
      await navigator.clipboard.writeText(accessToken);
    } catch (_e) {
      // ignore
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Account
              </Typography>
              {user ? (
                <Stack spacing={1}>
                  <Typography>
                    <b>Name:</b> {user.name || '—'}
                  </Typography>
                  <Typography>
                    <b>User ID:</b> {user.user_id}
                  </Typography>
                  <Typography>
                    <b>Role:</b> <Chip label={user.role} size="small" />
                  </Typography>
                  {user.email && (
                    <Typography>
                      <b>Email:</b> {user.email}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Button onClick={logout} variant="outlined" color="error">
                    Sign out
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info">Not signed in.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Backend
              </Typography>

              <TextField
                fullWidth
                label="API base URL"
                value={apiBaseInput}
                onChange={(e) => setApiBaseInput(e.target.value)}
                helperText="Set VITE_API_BASE_URL in your .env to change permanently."
                sx={{ mb: 2 }}
              />

              {loading && <CircularProgress size={18} />}
              {error && <Alert severity="error">{error}</Alert>}
              {health && (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <b>Status:</b>{' '}
                    <Chip
                      label={health.message === 'pong' ? 'healthy' : 'unknown'}
                      color={health.message === 'pong' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2">
                    <b>API base:</b> {API_BASE_URL}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Responded {new Date().toLocaleTimeString()}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Developer
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                JWT access token for the current session. Useful when testing the
                API from curl/Postman. Never share this token.
              </Typography>
              <TextField
                fullWidth
                value={accessToken || ''}
                InputProps={{ readOnly: true }}
                size="small"
                multiline
                minRows={2}
                maxRows={4}
              />
              <Box sx={{ mt: 1 }}>
                <Button onClick={copyToken} disabled={!accessToken} size="small">
                  Copy token
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
