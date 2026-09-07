import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ManufacturerAPI, LabsAPI } from '../../../../../services/apiClient';

/**
 * Manufacturer raw herb management — rewritten for the backend P9/P10 contract.
 *
 * Old flow: GET /herbs/approved_for_manufacturer → GET /herbs/:id/lab_report → POST receive_by_manufacturer
 * New flow: ManufacturerAPI.marketplace → LabsAPI.listCertificates → ManufacturerAPI.receive
 */
const useRawHerbData = (token) => {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeSection, setActiveSection] = useState('available_herbs');
  const [approvedHerbs, setApprovedHerbs] = useState([]);
  const [availableHerbs, setAvailableHerbs] = useState([]);
  const [orderedHerbs, setOrderedHerbs] = useState([]);
  const [scannedHerbDetails, setScannedHerbDetails] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedHerbForDetails, setSelectedHerbForDetails] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanMode, setScanMode] = useState(null);
  const [herbToReceive, setHerbToReceive] = useState(null);

  const fetchApprovedHerbs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ManufacturerAPI.marketplace(token);
      const herbs = Array.isArray(data) ? data : data?.batches || [];
      setApprovedHerbs(herbs);

      const herbsWithReports = await Promise.all(herbs.map(async (herb) => {
        const batchId = herb.code || herb.id;
        try {
          const certs = await LabsAPI.listCertificates(token, batchId);
          return { ...herb, labReports: Array.isArray(certs) ? certs : certs?.certificates || [] };
        } catch {
          return { ...herb, labReports: [] };
        }
      }));

      const processed = herbsWithReports
        .filter(h => h.labReports && h.labReports.length > 0)
        .map(h => ({
          id: h.code || h.id,
          name: h.species_name || h.species?.name,
          ...h,
          status: h.quality_status || h.phase,
        }));
      setAvailableHerbs(processed);
    } catch (error) {
      console.error("Failed to fetch approved herbs:", error);
      Alert.alert("Error", "Failed to load available herbs. Please try again later.");
    }
  }, [token]);

  const fetchOrderedHerbs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ManufacturerAPI.listRequests(token);
      setOrderedHerbs(Array.isArray(data) ? data : data?.requests || []);
    } catch (error) {
      console.error("Failed to fetch ordered herbs:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchApprovedHerbs();
    fetchOrderedHerbs();
  }, [fetchApprovedHerbs, fetchOrderedHerbs]);

  useEffect(() => {
    if (route.params?.scannedData) {
      const { scannedData } = route.params;
      const foundHerb = approvedHerbs.find(h => (h.code || h.id) === scannedData)
        || orderedHerbs.find(h => (h.code || h.id) === scannedData);

      if (foundHerb) {
        setScannedHerbDetails(foundHerb);
        setActiveSection('scanned_details');
        openDetailsModal(foundHerb);
        Alert.alert('Scan Successful', `Details for ${foundHerb.species_name || foundHerb.id} loaded.`);
      } else {
        const mock = { id: scannedData, name: `Unknown Herb (${scannedData})`, status: 'Unknown', description: 'No details found for this scanned herb.' };
        setScannedHerbDetails(mock);
        setActiveSection('scanned_details');
        openDetailsModal(mock);
        Alert.alert('Scan Successful', `No matching herb found. Displaying mock details for ${scannedData}.`);
      }
      navigation.setParams({ scannedData: undefined });
    }
  }, [route.params?.scannedData, approvedHerbs, orderedHerbs, navigation]);

  const openDetailsModal = useCallback((herb) => {
    setSelectedHerbForDetails(herb);
    setIsDetailsModalVisible(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalVisible(false);
    setSelectedHerbForDetails(null);
  }, []);

  const handleReceiveHerb = useCallback(async (herb, scannedQrText) => {
    if (!herb || !scannedQrText || !token) {
      Alert.alert("Error", "Herb details, scanned QR text, or authentication missing.");
      return;
    }
    try {
      const batchId = herb.code || herb.id;
      await ManufacturerAPI.receive(token, {
        batch_id: batchId,
        scanned_qr: scannedQrText,
        receiving_location: 'Manufacturer Facility',
      });
      setOrderedHerbs(prev => prev.filter(h => (h.code || h.id) !== batchId));
      const receivedHerb = { ...herb, status: 'in_stock', current_owner: 'manufacturer' };
      setScannedHerbDetails(receivedHerb);
      setActiveSection('scanned_details');
      openDetailsModal(receivedHerb);
      Alert.alert('Receipt Successful', `${herb.species_name || herb.name} has been received and is now in stock.`);
      fetchApprovedHerbs();
    } catch (error) {
      console.error("Failed to receive herb:", error);
      Alert.alert("Error", `Failed to receive herb: ${error.message || 'Please try again later.'}`);
    }
  }, [token, openDetailsModal, fetchApprovedHerbs]);

  const handleOrderHerb = useCallback(async (herbId) => {
    if (!token) return;
    const herbToOrder = availableHerbs.find(h => (h.code || h.id) === herbId);
    if (!herbToOrder) return;
    try {
      await ManufacturerAPI.requestBatch(token, {
        batch_id: herbId,
        quantity: herbToOrder.weight_kg || 1,
        unit: 'kg',
        priority: 'normal',
        notes: 'Ordered from marketplace',
      });
      setOrderedHerbs(prev => [...prev, { ...herbToOrder, orderDate: new Date().toISOString(), status: 'requested' }]);
      setAvailableHerbs(prev => prev.filter(h => (h.code || h.id) !== herbId));
      openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString(), status: 'requested' });
      Alert.alert('Order Placed', `${herbToOrder.species_name || herbToOrder.name} has been added to your ordered list.`);
      fetchApprovedHerbs();
      fetchOrderedHerbs();
    } catch (error) {
      console.error("Failed to order herb:", error);
      Alert.alert("Error", `Failed to place order. ${error.message || 'Please try again later.'}`);
    }
  }, [token, availableHerbs, openDetailsModal, fetchApprovedHerbs, fetchOrderedHerbs]);

  const handleScanQRCode = useCallback((herb = null, mode = 'general_scan') => {
    setHerbToReceive(herb);
    setScanMode(mode);
    setScannerVisible(true);
  }, []);

  const clearScannedDetails = useCallback(() => {
    setScannedHerbDetails(null);
    setActiveSection('available_herbs');
    closeDetailsModal();
    Alert.alert('Cleared', 'Scanned herb details have been cleared.');
  }, [closeDetailsModal]);

  const getStatusStyle = useCallback((status) => {
    switch (status) {
      case 'approved': case 'Certified': case 'in_stock':
        return { backgroundColor: '#D4EDDA', color: '#155724' };
      case 'pending': case 'pending_pickup': case 'testing': case 'requested':
        return { backgroundColor: '#FFF3CD', color: '#856404' };
      case 'rejected':
        return { backgroundColor: '#F8D7DA', color: '#721C24' };
      default:
        return { backgroundColor: '#F9FAFB', color: '#4B5563' };
    }
  }, []);

  return {
    activeSection, setActiveSection,
    availableHerbs, orderedHerbs,
    scannedHerbDetails,
    handleOrderHerb, handleScanQRCode, clearScannedDetails,
    getStatusStyle,
    isDetailsModalVisible, selectedHerbForDetails,
    openDetailsModal, closeDetailsModal,
    approvedHerbs, handleReceiveHerb,
    scannerVisible, scanMode, herbToReceive,
    setScannerVisible,
  };
};

export default useRawHerbData;
