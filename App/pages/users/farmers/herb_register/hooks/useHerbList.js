import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../../../constants/api';

export const useHerbList = (farmerId = 1) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/v1/farmers/${farmerId}/batches`;
      console.log('[HerbList] GET', url);
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.log('[HerbList] Error response', res.status, text);
        throw new Error('Failed to load herb batches');
      }
      const data = await res.json();
      console.log('[HerbList] Loaded', data?.batches?.length || 0);
      setItems(Array.isArray(data.batches) ? data.batches : []);
    } catch (e) {
      console.log('[HerbList] Request failed', e);
      Alert.alert('Error', e.message || 'Failed to load herb batches');
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refresh: fetchItems };
};


