import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../../../constants/api';

export const useLabBatches = () => {
  const [all, setAll] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/v1/labs/batches`;
      console.log('[useLabBatches] Fetching all batches from:', url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || 'Failed to load batches');
      }
      const data = await res.json();
      console.log('[useLabBatches] All batches response:', data);
      return Array.isArray(data.batches) ? data.batches : [];
    } catch (e) {
      console.log('[useLabBatches] Error fetching all batches:', e);
      throw e;
    }
  }, []);

  const fetchAccepted = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/v1/labs/batches/accepted`;
      console.log('[useLabBatches] Fetching accepted batches from:', url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || 'Failed to load accepted batches');
      }
      const data = await res.json();
      console.log('[useLabBatches] Accepted batches response:', data);
      return Array.isArray(data.batches) ? data.batches : [];
    } catch (e) {
      console.log('[useLabBatches] Error fetching accepted batches:', e);
      throw e;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[useLabBatches] Starting refresh...');
      const [a, b] = await Promise.all([fetchAll(), fetchAccepted()]);
      setAll(a);
      setAccepted(b);
      console.log('[useLabBatches] Refresh completed. All:', a.length, 'Accepted:', b.length);
    } catch (e) {
      console.log('[useLabBatches] Refresh failed:', e);
      Alert.alert('Error', e.message || 'Failed to load lab batches');
    } finally {
      setLoading(false);
    }
  }, [fetchAll, fetchAccepted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { all, accepted, loading, refresh };
};


