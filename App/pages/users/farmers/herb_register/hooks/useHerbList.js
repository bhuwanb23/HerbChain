import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';

export const useHerbList = (farmerId = 'farmer_001') => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('[HerbList] Fetching herbs for farmer:', farmerId);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/farmer/${farmerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch herbs');
      }
      
      const data = await response.json();
      console.log('[HerbList] API Response:', data);
      
      // Transform API data to match expected format
      const transformedItems = data.herbs.map(herb => ({
        batch_id: herb.batch_id,
        farmer_id: herb.farmer_id,
        species_entered: herb.species_name,
        species_detected: herb.species_name, // Use same as entered for now
        weight_kg: herb.weight_kg,
        harvest_date: herb.harvest_date,
        cultivation_method: 'Organic', // Default for now
        image_url: herb.image_url,
        geo_location: herb.location,
        status: herb.quality_status === 'pending' ? 'Registered' : herb.quality_status,
        created_at: herb.created_at,
        qr_code: herb.active_qr
      }));
      
      console.log('[HerbList] Loaded herbs:', transformedItems.length);
      setItems(transformedItems);
      setLoading(false);
      
    } catch (e) {
      console.log('[HerbList] Request failed', e);
      // Fallback to dummy data on error
      const dummyBatches = [
        {
          batch_id: 'BATCH-001',
          farmer_id: farmerId,
          species_entered: 'Basil',
          species_detected: 'Ocimum basilicum',
          weight_kg: 25.5,
          harvest_date: '2025-09-15',
          cultivation_method: 'Organic',
          image_url: null,
          geo_location: '12.83068, 79.70896',
          status: 'Registered',
          created_at: '2025-09-15T10:30:00Z',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ];
      setItems(dummyBatches);
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refresh: fetchItems };
};


