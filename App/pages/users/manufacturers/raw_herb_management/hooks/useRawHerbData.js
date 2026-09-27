import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../../contexts/AuthContext';
import { ManufacturerAPI, LabsAPI, ShipmentsAPI } from '../../../../../services/apiClient';

/**
 * Manufacturer raw herb management — backend P9/P10 contract.
 *
 * Marketplace:  GET /manufacturer/certified-batches  -> { batches: [{batch, certificate, inventory}] }
 * Certificates: GET /labs/certificates?batch_id=     -> { certifications: [...] }
 * Orders:       GET /manufacturer/requests           -> { requests: [serializeRequest] }
 * Order:        POST /manufacturer/request-batch     -> { batch_id, requested_quantity_kg, notes }
 * Receive(GRN): POST /manufacturer/receive           -> { shipment_id, accepted_quantity_kg? } (delivered shipment only)
 */
const useRawHerbData = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { accessToken: token } = useAuth();

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

  const toLabReports = useCallback((certs) => {
    const list = Array.isArray(certs) ? certs : certs?.certifications || certs?.certificates || [];
    return list.map((c) => ({
      ...c,
      certification: c.status !== 'revoked' && (!c.expiry_date || new Date(c.expiry_date) > new Date()),
      certification_level: c.status === 'expired' ? 'Expired' : 'Standard',
    }));
  }, []);

  const fetchApprovedHerbs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ManufacturerAPI.marketplace(token);
      const items = Array.isArray(data) ? data : data?.batches || [];
      const herbs = items.map((it) => (it && it.batch ? { ...it.batch, certificate: it.certificate, inventory: it.inventory } : it));
      setApprovedHerbs(herbs);

      const herbsWithReports = await Promise.all(herbs.map(async (herb) => {
        const batchId = herb.id || herb.code;
        try {
          const certs = await LabsAPI.listCertificates(token, batchId);
          return { ...herb, labReports: toLabReports(certs) };
        } catch {
          return { ...herb, labReports: [] };
        }
      }));

      const processed = herbsWithReports
        .filter((h) => h.labReports.length > 0)
        .map((h) => ({
          ...h,
          id: h.id || h.code,
          name: h.species?.common_name || h.species_name || 'N/A',
          batch_id: h.code || h.id,
          species_name: h.species?.common_name || h.species_name || 'N/A',
          farmer_id: h.farmer?.name || 'N/A',
          weight_kg: h.quantity_kg ?? h.weight_kg ?? null,
          status: 'Certified',
        }));
      setAvailableHerbs(processed);
    } catch (error) {
      console.error('Failed to fetch approved herbs:', error);
      Alert.alert('Error', 'Failed to load available herbs. Please try again later.');
    }
  }, [token, toLabReports]);

  const fetchOrderedHerbs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ManufacturerAPI.listRequests(token);
      const requests = Array.isArray(data) ? data : data?.requests || [];
      const rows = await Promise.all(requests.map(async (r) => {
        let labReports = [];
        if (r.batch?.id) {
          try {
            const certs = await LabsAPI.listCertificates(token, r.batch.id);
            labReports = toLabReports(certs);
          } catch { labReports = []; }
        }
        return {
          ...r,
          species_name: r.batch?.species?.common_name || r.batch?.code || 'N/A',
          farmer_id: r.batch?.current_holder_user_id ? 'Farm' : 'N/A',
          batch_id: r.batch?.code || r.batch?.id || null,
          weight_kg: r.approved_quantity_kg ?? r.requested_quantity_kg ?? null,
          labReports,
        };
      }));
      setOrderedHerbs(rows);
    } catch (error) {
      console.error('Failed to fetch ordered herbs:', error);
    }
  }, [token, toLabReports]);

  useEffect(() => {
    fetchApprovedHerbs();
    fetchOrderedHerbs();
  }, [fetchApprovedHerbs, fetchOrderedHerbs]);

  const openDetailsModal = useCallback((herb) => {
    setSelectedHerbForDetails(herb);
    setIsDetailsModalVisible(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalVisible(false);
    setSelectedHerbForDetails(null);
  }, []);

  useEffect(() => {
    if (route.params?.scannedData) {
      const { scannedData } = route.params;
      const foundHerb = approvedHerbs.find((h) => (h.code || h.id) === scannedData)
        || orderedHerbs.find((h) => (h.code || h.id) === scannedData || h.batch_id === scannedData);

      if (foundHerb) {
        setScannedHerbDetails(foundHerb);
        setActiveSection('scanned_details');
        openDetailsModal(foundHerb);
        Alert.alert('Scan Successful', `Details for ${foundHerb.species_name || foundHerb.id} loaded.`);
      } else {
        const mock = { id: scannedData, name: `Unknown Herb (${scannedData})`, species_name: `Unknown Herb (${scannedData})`, status: 'Unknown', description: 'No details found for this scanned herb.' };
        setScannedHerbDetails(mock);
        setActiveSection('scanned_details');
        openDetailsModal(mock);
        Alert.alert('Scan Successful', `No matching herb found. Displaying details for ${scannedData}.`);
      }
      navigation.setParams({ scannedData: undefined });
    }
  }, [route.params?.scannedData, approvedHerbs, orderedHerbs, navigation, openDetailsModal]);

  const handleReceiveHerb = useCallback(async (herb, scannedQrText) => {
    if (!herb || !scannedQrText || !token) {
      Alert.alert('Error', 'Herb details, scanned QR text, or authentication missing.');
      return;
    }
    try {
      const batchId = herb.batch?.id || herb.batch_id || herb.id;
      const res = await ShipmentsAPI.list(token, { role: 'incoming', limit: 100 });
      const shipments = res?.shipments || [];
      const forBatch = shipments.filter((sh) => sh.ref?.type === 'batch' && sh.ref?.id === batchId);
      const shipment = forBatch.find((sh) => ['delivered', 'completed'].includes(sh.status));
      if (!shipment) {
        const pending = forBatch[0];
        Alert.alert(
          'Cannot receive yet',
          pending
            ? `Shipment is '${pending.status}' — goods can be received only after delivery.`
            : 'No shipment found for this batch yet.',
        );
        return;
      }
      await ManufacturerAPI.receive(token, { shipment_id: shipment.id });
      setOrderedHerbs((prev) => prev.filter((h) => h.id !== herb.id));
      const receivedHerb = { ...herb, status: 'in_stock', current_owner: 'manufacturer' };
      setScannedHerbDetails(receivedHerb);
      setActiveSection('scanned_details');
      openDetailsModal(receivedHerb);
      Alert.alert('Receipt Successful', `${herb.species_name || herb.name} has been received and is now in stock.`);
      fetchApprovedHerbs();
      fetchOrderedHerbs();
    } catch (error) {
      console.error('Failed to receive herb:', error);
      Alert.alert('Error', `Failed to receive herb: ${error.message || 'Please try again later.'}`);
    }
  }, [token, openDetailsModal, fetchApprovedHerbs, fetchOrderedHerbs]);

  const handleOrderHerb = useCallback(async (herbId) => {
    if (!token) return;
    const herbToOrder = availableHerbs.find((h) => h.id === herbId || h.code === herbId || (h.code || h.id) === herbId);
    if (!herbToOrder) return;
    try {
      await ManufacturerAPI.requestBatch(token, {
        batch_id: herbToOrder.id,
        requested_quantity_kg: herbToOrder.weight_kg || 1,
        notes: 'Ordered from marketplace',
      });
      setOrderedHerbs((prev) => [...prev, { ...herbToOrder, orderDate: new Date().toISOString(), status: 'requested' }]);
      setAvailableHerbs((prev) => prev.filter((h) => h.id !== herbToOrder.id && (h.code || h.id) !== herbId));
      openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString(), status: 'requested' });
      Alert.alert('Order Placed', `${herbToOrder.species_name || herbToOrder.name} has been added to your ordered list.`);
      fetchApprovedHerbs();
      fetchOrderedHerbs();
    } catch (error) {
      console.error('Failed to order herb:', error);
      Alert.alert('Error', `Failed to place order. ${error.message || 'Please try again later.'}`);
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
      case 'approved': case 'Certified': case 'in_stock': case 'received':
        return { backgroundColor: '#D4EDDA', color: '#155724' };
      case 'pending': case 'pending_pickup': case 'testing': case 'requested': case 'approved_request':
      case 'awaiting_shipment': case 'in_transit':
        return { backgroundColor: '#FFF3CD', color: '#856404' };
      case 'rejected': case 'declined':
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
