import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';

export const useLabBatches = () => {
  const [all, setAll] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      console.log('[useLabBatches] Fetching available herbs...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/available`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available herbs');
      }
      
      const data = await response.json();
      console.log('[useLabBatches] API Response:', data);
      
      // Transform API data to match expected format
      const transformedBatches = data.herbs.map(herb => ({
        batch_id: herb.batch_id,
        farmer_id: herb.farmer_id,
        species_entered: herb.species_name,
        species_detected: herb.species_name,
        weight_kg: herb.weight_kg,
        harvest_date: herb.harvest_date,
        cultivation_method: 'Organic', // Default for now
        image_url: herb.image_url,
        geo_location: herb.location,
        status: herb.quality_status === 'pending' ? 'Available' : herb.quality_status,
        created_at: herb.created_at,
        accepted: herb.quality_status === 'pending_pickup',
        farmer: herb.farmer
      }));
      
      console.log('[useLabBatches] Loaded available herbs:', transformedBatches.length);
      return transformedBatches;
    } catch (error) {
      console.log('[useLabBatches] Error fetching available herbs:', error);
      // Fallback to dummy data
      return [
        {
          batch_id: 'BATCH-001',
          farmer_id: 'farmer_001',
          species_entered: 'Basil',
          species_detected: 'Ocimum basilicum',
          weight_kg: 25.5,
          harvest_date: '2025-09-15',
          cultivation_method: 'Organic',
          image_url: null,
          geo_location: 'Pune, Maharashtra',
          status: 'Available',
          created_at: '2025-09-15T10:30:00Z',
          accepted: false
        }
      ];
    }
  }, []);

  const fetchAccepted = useCallback(async () => {
    try {
      console.log('[useLabBatches] Fetching accepted herbs...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/lab/lab_001/accepted`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accepted herbs');
      }
      
      const data = await response.json();
      console.log('[useLabBatches] API Response:', data);
      
      // Transform API data to match expected format
      const transformedBatches = data.herbs.map(herb => ({
        batch_id: herb.batch_id,
        farmer_id: herb.farmer_id,
        species_entered: herb.species_name,
        species_detected: herb.species_name,
        weight_kg: herb.weight_kg,
        harvest_date: herb.harvest_date,
        cultivation_method: 'Organic', // Default for now
        image_url: herb.image_url,
        geo_location: herb.location,
        status: 'Accepted',
        created_at: herb.created_at,
        accepted: true,
        farmer: herb.farmer,
        lab_request: herb.lab_request
      }));
      
      console.log('[useLabBatches] Loaded accepted herbs:', transformedBatches.length);
      return transformedBatches;
    } catch (error) {
      console.log('[useLabBatches] Error fetching accepted herbs:', error);
      // Fallback to dummy data
      return [
        {
          batch_id: 'BATCH-002',
          farmer_id: 'farmer_001',
          species_entered: 'Cilantro',
          species_detected: 'Coriandrum sativum',
          weight_kg: 18.2,
          harvest_date: '2025-09-18',
          cultivation_method: 'Greenhouse',
          image_url: null,
          geo_location: 'Pune, Maharashtra',
          status: 'Accepted',
          created_at: '2025-09-18T14:20:00Z',
          accepted: true
        }
      ];
    }
  }, []);

  const fetchArchived = useCallback(async () => {
    try {
      console.log('[useLabBatches] Fetching archived (received) herbs...');
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/lab/lab_001/archived`);
      if (!response.ok) {
        throw new Error('Failed to fetch archived herbs');
      }
      const data = await response.json();
      const transformed = (data.herbs || []).map(herb => ({
        batch_id: herb.batch_id,
        farmer_id: herb.farmer_id,
        species_entered: herb.species_name,
        species_detected: herb.species_name,
        species_name: herb.species_name,
        weight_kg: herb.weight_kg,
        harvest_date: herb.harvest_date,
        cultivation_method: 'Organic',
        image_url: herb.image_url,
        active_qr: herb.active_qr,
        geo_location: herb.location,
        status: herb.quality_status,
        quality_status: herb.quality_status,
        created_at: herb.created_at,
        accepted: true,
      }));
      return transformed;
    } catch (e) {
      console.log('[useLabBatches] Error fetching archived herbs:', e);
      return [];
    }
  }, []);

  const acceptHerb = useCallback(async (batchId) => {
    try {
      console.log('[useLabBatches] Accepting herb:', batchId);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lab_id: 'lab_001',
          lab_location: 'Delhi, India'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept herb');
      }
      
      const result = await response.json();
      console.log('[useLabBatches] Herb accepted successfully:', result);
      
      // Refresh the data after successful acceptance
      await refresh();
      
      return result;
    } catch (error) {
      console.log('[useLabBatches] Error accepting herb:', error);
      throw error;
    }
  }, [refresh]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[useLabBatches] Starting refresh...');
      const [a, b, c] = await Promise.all([fetchAll(), fetchAccepted(), fetchArchived()]);
      setAll(a);
      setAccepted(b);
      setArchived(c);
      console.log('[useLabBatches] Refresh completed. All:', a.length, 'Accepted:', b.length, 'Archived:', c.length);
    } catch (e) {
      console.log('[useLabBatches] Refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchAll, fetchAccepted, fetchArchived]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { all, accepted, archived, loading, refresh, acceptHerb };
};


