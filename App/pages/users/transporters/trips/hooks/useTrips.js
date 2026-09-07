import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { ShipmentsAPI, QrAPI } from '../../../../../services/apiClient';

/**
 * Transporter trips hook — rewritten for second_backend shipments contract.
 *
 * Maps the old herbs-based flow to the new P7 shipment lifecycle:
 *   pending_pickup  → shipments with status=pending_assigned (available for accept)
 *   active trips    → shipments with status=in_transit (after pickup)
 *   completed trips → shipments with status=delivered
 *   pickup          → POST /shipments/:id/pickup + QR transfer
 *   deliver         → POST /shipments/:id/deliver + QR transfer
 */
export const useTrips = (token) => {
  const [pendingHerbs, setPendingHerbs] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [scanMode, setScanMode] = useState(null); // 'pickup' or 'deliver_to_manufacturer'

  // ---- fetch helpers ----

  const fetchPendingPickup = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await ShipmentsAPI.list(token, { status: 'pending_assigned', limit: 50 });
      setPendingHerbs(Array.isArray(data) ? data : data?.shipments || []);
    } catch (e) {
      console.log('Failed to load pending pickup shipments', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchActiveTrips = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ShipmentsAPI.list(token, { status: 'in_transit', limit: 50 });
      setActiveTrips(Array.isArray(data) ? data : data?.shipments || []);
    } catch (e) {
      console.log('Failed to load active trips', e);
    }
  }, [token]);

  const fetchCompletedTrips = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ShipmentsAPI.list(token, { status: 'delivered', limit: 50 });
      setCompletedTrips(Array.isArray(data) ? data : data?.shipments || []);
    } catch (e) {
      console.log('Failed to load completed trips', e);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingPickup();
    fetchActiveTrips();
    fetchCompletedTrips();
  }, [fetchPendingPickup, fetchActiveTrips, fetchCompletedTrips]);

  // ---- scanner ----

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

  // ---- pickup (accept + pickup in one flow) ----

  const handlePickup = useCallback(async (scannedData) => {
    if (!selectedBatch || !token) return;
    try {
      setLoading(true);
      const shipmentId = selectedBatch.id || selectedBatch.shipment_id;

      // Step 1: accept the shipment
      await ShipmentsAPI.accept(token, shipmentId);

      // Step 2: record pickup with QR scan
      await ShipmentsAPI.pickup(token, shipmentId, {
        scanned_qr: scannedData,
        gps_lat: selectedBatch.origin_gps_lat || null,
        gps_lng: selectedBatch.origin_gps_lng || null,
        location: selectedBatch.origin_location || undefined,
      });

      setPendingHerbs(prev => prev.filter(h => (h.id || h.shipment_id) !== shipmentId));
      setActiveTrips(prev => [{ ...selectedBatch, status: 'in_transit' }, ...prev]);
      Alert.alert('Pickup Successful', 'Shipment picked up. Now in transit.');
    } catch (e) {
      console.log('Pickup failed', e);
      Alert.alert('Pickup Failed', e.message || 'Unable to complete pickup');
    } finally {
      setLoading(false);
      onCloseScanner();
      fetchActiveTrips();
      fetchCompletedTrips();
    }
  }, [selectedBatch, token, onCloseScanner, fetchActiveTrips, fetchCompletedTrips]);

  // ---- deliver to destination ----

  const handleDeliverToManufacturer = useCallback(async (scannedData) => {
    if (!selectedBatch || !token) return;
    try {
      setLoading(true);
      const shipmentId = selectedBatch.id || selectedBatch.shipment_id;

      // Step 1: arrive
      await ShipmentsAPI.arrive(token, shipmentId, {
        gps_lat: selectedBatch.destination_gps_lat || null,
        gps_lng: selectedBatch.destination_gps_lng || null,
      });

      // Step 2: deliver with POD scan
      await ShipmentsAPI.deliver(token, shipmentId, {
        scanned_qr: scannedData,
        gps_lat: selectedBatch.destination_gps_lat || null,
        gps_lng: selectedBatch.destination_gps_lng || null,
        location: selectedBatch.destination_location || undefined,
      });

      setActiveTrips(prev => prev.filter(h => (h.id || h.shipment_id) !== shipmentId));
      setCompletedTrips(prev => [{ ...selectedBatch, status: 'delivered' }, ...prev]);
      Alert.alert('Delivery Successful', 'Shipment delivered to destination.');
    } catch (error) {
      console.error('Error during delivery:', error);
      Alert.alert('Delivery Failed', error.message || 'Failed to complete delivery');
    } finally {
      setLoading(false);
      onCloseScanner();
      fetchActiveTrips();
      fetchCompletedTrips();
    }
  }, [selectedBatch, token, onCloseScanner, fetchActiveTrips, fetchCompletedTrips]);

  // ---- barcode scan dispatcher ----

  const onBarcodeScanned = useCallback(async (data) => {
    if (!selectedBatch) return;
    setScannerVisible(false);
    if (scanMode === 'pickup') {
      handlePickup(data);
    } else if (scanMode === 'deliver_to_manufacturer') {
      handleDeliverToManufacturer(data);
    }
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
  };
};
