import { useCallback, useEffect, useState } from 'react';

export const useHerbList = (farmerId = 1) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call with dummy data
      setTimeout(() => {
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
          },
          {
            batch_id: 'BATCH-002',
            farmer_id: farmerId,
            species_entered: 'Cilantro',
            species_detected: 'Coriandrum sativum',
            weight_kg: 18.2,
            harvest_date: '2025-09-18',
            cultivation_method: 'Greenhouse',
            image_url: null,
            geo_location: '12.83068, 79.70896',
            status: 'Registered',
            created_at: '2025-09-18T14:20:00Z',
            qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        ];
        
        console.log('[HerbList] Loaded dummy data', dummyBatches.length);
        setItems(dummyBatches);
        setLoading(false);
      }, 1000);
      
    } catch (e) {
      console.log('[HerbList] Request failed', e);
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refresh: fetchItems };
};


