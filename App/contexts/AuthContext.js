/**
 * AuthContext — single source of truth for "who is signed in" across the app.
 *
 * - Persists the access token, refresh token, and user object to AsyncStorage
 *   so a relaunch keeps the session.
 * - Exposes `login`, `register`, `logout`, and `refreshUser` actions.
 * - Provides a `ready` flag so callers can wait for the persisted session to
 *   be restored before deciding which navigator stack to mount.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, AuthAPI } from '../services/apiClient';

const STORAGE_KEY = '@herbchain/session/v1';

const AuthContext = createContext(null);

const initialState = {
  ready: false,
  user: null,
  accessToken: null,
  refreshToken: null,
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---------------------- persistence ----------------------

  const _save = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('AuthContext: failed to persist session', err);
    }
  }, []);

  const _clear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('AuthContext: failed to clear session', err);
    }
  }, []);

  // Hydrate session from disk on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.accessToken && parsed.user) {
            setState({
              ready: true,
              user: parsed.user,
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken || null,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('AuthContext: failed to load persisted session', err);
      }
      if (!cancelled) {
        setState({ ...initialState, ready: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------- actions ----------------------

  const _applySession = useCallback(
    async (data) => {
      const next = {
        ready: true,
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
      };
      setState(next);
      setError(null);
      await _save(next);
      return next;
    },
    [_save],
  );

  const login = useCallback(
    async (identifier, password) => {
      setBusy(true);
      setError(null);
      try {
        const data = await AuthAPI.login(identifier, password);
        return await _applySession(data);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : (err && err.message) || 'Login failed';
        setError(msg);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [_applySession],
  );

  const register = useCallback(
    async (payload) => {
      setBusy(true);
      setError(null);
      try {
        const data = await AuthAPI.register(payload);
        return await _applySession(data);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : (err && err.message) || 'Register failed';
        setError(msg);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [_applySession],
  );

  const logout = useCallback(async () => {
    setState({ ...initialState, ready: true });
    setError(null);
    await _clear();
  }, [_clear]);

  const refreshUser = useCallback(async () => {
    const tok = stateRef.current.accessToken;
    if (!tok) return null;
    try {
      const data = await AuthAPI.me(tok);
      const next = { ...stateRef.current, user: data.user };
      setState(next);
      await _save(next);
      return data.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
      throw err;
    }
  }, [_save, logout]);

  // ---------------------- context value ----------------------

  const value = useMemo(
    () => ({
      ready: state.ready,
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isLoggedIn: Boolean(state.accessToken && state.user),
      role: state.user ? state.user.role : null,
      busy,
      error,
      login,
      register,
      logout,
      refreshUser,
    }),
    [state, busy, error, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return ctx;
}
