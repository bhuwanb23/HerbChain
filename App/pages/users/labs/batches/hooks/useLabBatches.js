import { useCallback, useEffect, useState } from 'react';

export const useLabBatches = () => {
  const [all, setAll] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    // Simulate API call with dummy data
    const dummyBatches = [
      {
        batch_id: 'BATCH-001',
        farmer_id: 1,
        species_entered: 'Basil',
        species_detected: 'Ocimum basilicum',
        weight_kg: 25.5,
        harvest_date: '2025-09-15',
        cultivation_method: 'Organic',
        image_url: null,
        geo_location: '12.83068, 79.70896',
        status: 'Registered',
        created_at: '2025-09-15T10:30:00Z',
        accepted: false
      },
      {
        batch_id: 'BATCH-002',
        farmer_id: 1,
        species_entered: 'Cilantro',
        species_detected: 'Coriandrum sativum',
        weight_kg: 18.2,
        harvest_date: '2025-09-18',
        cultivation_method: 'Greenhouse',
        image_url: null,
        geo_location: '12.83068, 79.70896',
        status: 'Registered',
        created_at: '2025-09-18T14:20:00Z',
        accepted: true
      }
    ];
    console.log('[useLabBatches] Loaded dummy all batches:', dummyBatches.length);
    return dummyBatches;
  }, []);

  const fetchAccepted = useCallback(async () => {
    // Simulate API call with dummy data
    const dummyAcceptedBatches = [
      {
        batch_id: 'BATCH-002',
        farmer_id: 1,
        species_entered: 'Cilantro',
        species_detected: 'Coriandrum sativum',
        weight_kg: 18.2,
        harvest_date: '2025-09-18',
        cultivation_method: 'Greenhouse',
        image_url: null,
        geo_location: '12.83068, 79.70896',
        status: 'Registered',
        created_at: '2025-09-18T14:20:00Z',
        accepted: true
      }
    ];
    console.log('[useLabBatches] Loaded dummy accepted batches:', dummyAcceptedBatches.length);
    return dummyAcceptedBatches;
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
    } finally {
      setLoading(false);
    }
  }, [fetchAll, fetchAccepted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { all, accepted, loading, refresh };
};


