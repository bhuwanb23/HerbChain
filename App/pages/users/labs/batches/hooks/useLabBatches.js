import { useCallback, useEffect, useState } from 'react';
import { LabsAPI } from '../../../../../services/apiClient';

/**
 * Lab batches hook — rewritten for the backend P8 lab contract.
 *
 * Maps old herbs-based flow to new lab endpoints:
 *   available   → GET /labs/batches?status=pending_lab
 *   accepted    → GET /labs/batches?status=with_lab (or in_testing)
 *   archived    → GET /labs/batches?status=received (completed tests)
 *   accept      → POST /labs/batches/receive
 */
export const useLabBatches = (token) => {
  const [all, setAll] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!token) return [];
    try {
      const data = await LabsAPI.queue(token, { status: 'pending_lab' });
      const items = Array.isArray(data) ? data : data?.batches || [];
      return items.map(b => ({
        batch_id: b.code || b.id,
        farmer_id: b.farmer_id,
        species_entered: b.species_name || b.species?.name,
        species_detected: b.species_name || b.species?.name,
        weight_kg: b.weight_kg,
        harvest_date: b.harvest_date,
        image_url: b.primary_asset?.url || null,
        geo_location: b.gps_location || b.location,
        status: b.phase || b.status,
        created_at: b.created_at,
        accepted: false,
        farmer: b.farmer || null,
      }));
    } catch (e) {
      console.log('[useLabBatches] Error fetching available:', e);
      return [];
    }
  }, [token]);

  const fetchAccepted = useCallback(async () => {
    if (!token) return [];
    try {
      const data = await LabsAPI.queue(token, { status: 'in_testing' });
      const items = Array.isArray(data) ? data : data?.batches || [];
      return items.map(b => ({
        batch_id: b.code || b.id,
        farmer_id: b.farmer_id,
        species_entered: b.species_name || b.species?.name,
        species_detected: b.species_name || b.species?.name,
        weight_kg: b.weight_kg,
        harvest_date: b.harvest_date,
        image_url: b.primary_asset?.url || null,
        geo_location: b.gps_location || b.location,
        status: 'Accepted',
        created_at: b.created_at,
        accepted: true,
        farmer: b.farmer || null,
      }));
    } catch (e) {
      console.log('[useLabBatches] Error fetching accepted:', e);
      return [];
    }
  }, [token]);

  const fetchArchived = useCallback(async () => {
    if (!token) return [];
    try {
      const data = await LabsAPI.queue(token, { status: 'received' });
      const items = Array.isArray(data) ? data : data?.batches || [];
      return items.map(b => ({
        batch_id: b.code || b.id,
        farmer_id: b.farmer_id,
        species_entered: b.species_name || b.species?.name,
        species_detected: b.species_name || b.species?.name,
        species_name: b.species_name || b.species?.name,
        weight_kg: b.weight_kg,
        harvest_date: b.harvest_date,
        image_url: b.primary_asset?.url || null,
        active_qr: b.active_qr || null,
        geo_location: b.gps_location || b.location,
        status: b.phase || b.status,
        quality_status: b.quality_status,
        created_at: b.created_at,
        accepted: true,
      }));
    } catch (e) {
      console.log('[useLabBatches] Error fetching archived:', e);
      return [];
    }
  }, [token]);

  const acceptHerb = useCallback(async (batchId) => {
    if (!token) throw new Error('Not authenticated');
    await LabsAPI.receive(token, { batch_id: batchId });
    await refresh();
  }, [token]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [a, b, c] = await Promise.all([fetchAll(), fetchAccepted(), fetchArchived()]);
      setAll(a);
      setAccepted(b);
      setArchived(c);
    } catch (e) {
      console.log('[useLabBatches] Refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchAll, fetchAccepted, fetchArchived]);

  useEffect(() => { refresh(); }, [refresh]);

  return { all, accepted, archived, loading, refresh, acceptHerb };
};
