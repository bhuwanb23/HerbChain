import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../../../constants/api';

export const useLabBatches = () => {
  const [all, setAll] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const url = `${API_BASE_URL}/api/v1/labs/batches`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load batches');
    const data = await res.json();
    return Array.isArray(data.batches) ? data.batches : [];
  }, []);

  const fetchAccepted = useCallback(async () => {
    const url = `${API_BASE_URL}/api/v1/labs/batches/accepted`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load accepted batches');
    const data = await res.json();
    return Array.isArray(data.batches) ? data.batches : [];
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [a, b] = await Promise.all([fetchAll(), fetchAccepted()]);
      setAll(a);
      setAccepted(b);
    } catch (e) {
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


