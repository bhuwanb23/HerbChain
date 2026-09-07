import { useCallback, useEffect, useState } from 'react';
import { BatchesAPI } from '../../../../../services/apiClient';

/**
 * Farmer's batch list for the herb-register flow, backed by
 * GET /api/v1/batches/mine (second_backend P3 contract).
 */
export const useHerbList = (accessToken) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await BatchesAPI.listMine(accessToken, { limit: 100 });
      const rows = data.batches || [];
      const transformed = rows.map((b) => ({
        batch_id: b.id,
        code: b.code,
        farmer_id: b.farmer?.id || null,
        species_entered: b.species?.common_name || b.species?.code || 'Unknown',
        species_detected: b.species?.common_name || null,
        weight_kg: b.weight_kg,
        harvest_date: b.harvest_date,
        cultivation_method: b.cultivation_type || 'organic',
        image_url: b.images?.find((i) => i.is_primary)?.url || b.images?.[0]?.url || null,
        geo_location: b.location || null,
        status: b.status || b.phase,
        phase: b.phase,
        test_status: b.test_status,
        created_at: b.created_at,
      }));
      setItems(transformed);
    } catch (e) {
      console.log('[HerbList] Request failed', e);
      setError(e?.message || 'Failed to fetch batches');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
};

export default useHerbList;
