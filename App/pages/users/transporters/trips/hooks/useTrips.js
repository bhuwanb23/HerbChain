import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';

export const useTrips = () => {
  const [pendingHerbs, setPendingHerbs] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const transporterId = 'transporter_001';

  const fetchPendingPickup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/pending_pickup`);
      const json = await res.json();
      setPendingHerbs(Array.isArray(json.herbs) ? json.herbs : []);
    } catch (e) {
      console.log('Failed to load pending pickup herbs', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveTrips = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/transporter/${transporterId}/active`);
      const json = await res.json();
      setActiveTrips(Array.isArray(json.herbs) ? json.herbs : []);
    } catch (e) {
      console.log('Failed to load active trips', e);
    }
  }, []);

  const fetchCompletedTrips = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/transporter/${transporterId}/completed`);
      const json = await res.json();
      setCompletedTrips(Array.isArray(json.herbs) ? json.herbs : []);
    } catch (e) {
      console.log('Failed to load completed trips', e);
    }
  }, []);

  useEffect(() => {
    fetchPendingPickup();
    fetchActiveTrips();
    fetchCompletedTrips();
  }, [fetchPendingPickup, fetchActiveTrips, fetchCompletedTrips]);

  const onStartScan = useCallback((herb) => {
    setSelectedBatch(herb);
    setScannerVisible(true);
  }, []);

  const onCloseScanner = useCallback(() => {
    setScannerVisible(false);
    setSelectedBatch(null);
  }, []);

  const onBarcodeScanned = useCallback(async (data) => {
    if (!selectedBatch) return;
    setScannerVisible(false);
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch.batch_id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_id: transporterId,
          scanned_qr_text: data,
          pickup_location: selectedBatch.location,
          dropoff_location: 'Lab - TBD',
        })
      });
      const json = await res.json();
      if (!res.ok) {
        console.log('Pickup failed', json);
        return;
      }
      setPendingHerbs(prev => prev.filter(h => h.batch_id !== selectedBatch.batch_id));
      setActiveTrips(prev => [{ ...json.herb, new_qr_code: json.new_qr_code }, ...prev]);
      fetchActiveTrips();
      fetchCompletedTrips();
      setSelectedBatch(null);
    } catch (e) {
      console.log('Error during pickup', e);
    } finally {
      setLoading(false);
    }
  }, [fetchActiveTrips, selectedBatch]);

  return {
    loading,
    pendingHerbs,
    activeTrips,
    completedTrips,
    scannerVisible,
    selectedBatch,
    onStartScan,
    onCloseScanner,
    onBarcodeScanned,
    refreshAll: () => { fetchPendingPickup(); fetchActiveTrips(); fetchCompletedTrips(); },
  };
};


