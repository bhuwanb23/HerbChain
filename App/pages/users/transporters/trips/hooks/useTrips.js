import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';
import { Alert } from 'react-native';

export const useTrips = () => {
  const [pendingHerbs, setPendingHerbs] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [scanMode, setScanMode] = useState(null); // 'pickup' or 'deliver_to_manufacturer'
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

  const onStartScan = useCallback((herb, mode = 'pickup') => {
    setSelectedBatch(herb);
    setScanMode(mode);
    setScannerVisible(true);
  }, []);

  const onCloseScanner = useCallback(() => {
    setScannerVisible(false);
    setSelectedBatch(null);
    setScanMode(null);
  }, []);

  const handlePickup = useCallback(async (scannedData) => {
    if (!selectedBatch) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch.batch_id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_id: transporterId,
          scanned_qr_text: scannedData,
          pickup_location: selectedBatch.location,
          dropoff_location: 'Lab - TBD',
        })
      });
      const json = await res.json();
      if (!res.ok) {
        console.log('Pickup failed', json);
        Alert.alert('Pickup Failed', json.error || 'Unable to validate QR');
        return;
      }
      setPendingHerbs(prev => prev.filter(h => h.batch_id !== selectedBatch.batch_id));
      setActiveTrips(prev => [{ ...json.herb, new_qr_code: json.new_qr_code }, ...prev]);
      Alert.alert('Pickup Successful', 'Herb picked up. Now in transit.');
    } catch (e) {
      console.log('Error during pickup', e);
      Alert.alert('Error', 'Failed to complete pickup');
    } finally {
      setLoading(false);
      onCloseScanner();
      fetchActiveTrips();
      fetchCompletedTrips();
    }
  }, [selectedBatch, onCloseScanner, fetchActiveTrips, fetchCompletedTrips]);

  const handleDeliverToManufacturer = useCallback(async (scannedData) => {
    if (!selectedBatch) return;
    try {
      setLoading(true);
      // Assuming selectedBatch.current_owner is the transporter
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch.batch_id}/deliver_to_manufacturer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_id: transporterId,
          manufacturer_id: selectedBatch.to_owner, // Assuming to_owner is manufacturer_id for delivery
          scanned_qr_text: scannedData,
          delivery_location: selectedBatch.location, // Or a specific manufacturer location
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        console.log('Delivery to Manufacturer failed', json);
        Alert.alert('Delivery Failed', json.error || 'Unable to complete delivery to manufacturer');
        return;
      }

      // Update local state:
      setActiveTrips(prev => prev.filter(h => h.batch_id !== selectedBatch.batch_id));
      setCompletedTrips(prev => [{ ...json.herb, transit_status: 'completed' }, ...prev]);
      Alert.alert('Delivery Successful', 'Herb delivered to manufacturer.');

    } catch (error) {
      console.error("Error during delivery to manufacturer:", error);
      Alert.alert("Error", `Failed to complete delivery to manufacturer: ${error.message || 'Please try again later.'}`);
    } finally {
      setLoading(false);
      onCloseScanner();
      fetchActiveTrips();
      fetchCompletedTrips();
    }
  }, [selectedBatch, onCloseScanner, fetchActiveTrips, fetchCompletedTrips]);

  const onBarcodeScanned = useCallback(async (data) => {
    if (!selectedBatch) return;
    setScannerVisible(false);
    if (scanMode === 'pickup') {
      handlePickup(data);
    } else if (scanMode === 'deliver_to_manufacturer') {
      handleDeliverToManufacturer(data);
    }
    // Default scan for general details if no specific mode
    // else { navigation.navigate('ScannedDetailsScreen', { scannedData: data }); }
  }, [selectedBatch, scanMode, handlePickup, handleDeliverToManufacturer]);

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
    scanMode,
    // refreshAll: () => { fetchPendingPickup(); fetchActiveTrips(); fetchCompletedTrips(); }, // Removed as individual fetches are called after updates
  };
};


