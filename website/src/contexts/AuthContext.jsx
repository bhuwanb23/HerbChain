/**
 * Auth state for the website. Persists to localStorage so a refresh keeps the
 * admin signed in.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiError, AuthAPI } from '../services/apiClient';

const STORAGE_KEY = 'herbchain.web.session.v1';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState({
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.accessToken && parsed.user) {
          setSession(parsed);
        }
      }
    } catch (err) {
      console.warn('AuthContext: failed to load session', err);
    } finally {
      setReady(true);
    }
  }, []);

  const persist = useCallback((next) => {
    try {
      if (next.accessToken) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('AuthContext: failed to persist', err);
    }
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      setBusy(true);
      setError(null);
      try {
        const data = await AuthAPI.login(identifier, password);
        const next = {
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token || null,
        };
        setSession(next);
        persist(next);
        return next;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : err?.message || 'Login failed';
        setError(msg);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [persist],
  );

  const logout = useCallback(() => {
    setSession({ user: null, accessToken: null, refreshToken: null });
    setError(null);
    persist({ user: null, accessToken: null, refreshToken: null });
  }, [persist]);

  const value = useMemo(
    () => ({
      ready,
      busy,
      error,
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isLoggedIn: Boolean(session.accessToken && session.user),
      role: session.user ? session.user.role : null,
      login,
      logout,
    }),
    [ready, busy, error, session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}
