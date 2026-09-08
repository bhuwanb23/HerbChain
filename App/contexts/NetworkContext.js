/**
 * NetworkContext — global connectivity state for the entire app.
 *
 * Tracks: isOnline, connectionType, lastChecked
 * Used by: SyncStatusBar, offline queue, any screen that needs connectivity info
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (_e) {
  // Fallback: always online (dev/web environment)
  NetInfo = {
    fetch: () => Promise.resolve({ isConnected: true, type: 'wifi' }),
    addEventListener: () => () => {},
  };
}

const NetworkContext = createContext({
  isOnline: true,
  connectionType: 'wifi',
  lastChecked: null,
});

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const [lastChecked, setLastChecked] = useState(Date.now());
  const debounceRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      setIsOnline(Boolean(state.isConnected));
      setConnectionType(state.type || 'unknown');
      setLastChecked(Date.now());
    });

    // Subscribe to changes with debounce
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setIsOnline(Boolean(state.isConnected));
        setConnectionType(state.type || 'unknown');
        setLastChecked(Date.now());
      }, 300); // 300ms debounce to avoid flickering
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, connectionType, lastChecked }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
