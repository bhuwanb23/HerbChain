import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login, busy, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setLocalError(err?.message || 'Login failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        p: 3,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              HerbChain Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to view supply-chain stats, trace batches, and manage users.
              Only accounts with the <b>admin</b> role can see all stats.
            </Typography>

            {(localError || error) && (
              <Alert severity="error">{localError || error}</Alert>
            )}

            <TextField
              label="Email or user-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              required
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={busy}
              fullWidth
            >
              {busy ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
