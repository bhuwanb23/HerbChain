import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../../../../constants/api'; // Import API_BASE_URL

const useRawHerbData = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeSection, setActiveSection] = useState('available_herbs');
  const [approvedHerbs, setApprovedHerbs] = useState([]); // New state for approved herbs
  const [availableHerbs, setAvailableHerbs] = useState([]); // Will be derived from approvedHerbs
  const [orderedHerbs, setOrderedHerbs] = useState([]); // This will also likely come from a backend call in a real app
  const [scannedHerbDetails, setScannedHerbDetails] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedHerbForDetails, setSelectedHerbForDetails] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false); // State for scanner visibility
  const [scanMode, setScanMode] = useState(null); // 'receive_by_manufacturer' or 'general_scan'
  const [herbToReceive, setHerbToReceive] = useState(null); // Stores the herb that is about to be received

  // Function to fetch approved herbs from the backend
  const fetchApprovedHerbs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/approved_for_manufacturer`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response data:', data); // Log the raw API response
      const herbs = data.herbs || [];
      setApprovedHerbs(herbs);
      
      const herbsWithReports = await Promise.all(herbs.map(async (herb) => {
        try {
          const reportsResponse = await fetch(`${API_BASE_URL}/api/v1/herbs/${herb.batch_id}/lab_report`);
          if (!reportsResponse.ok) {
            console.warn(`Failed to fetch lab reports for batch ${herb.batch_id}: ${reportsResponse.status}`);
            return { ...herb, labReports: [] };
          }
          const reportsData = await reportsResponse.json();
          return { ...herb, labReports: reportsData.reports || [] };
        } catch (reportError) {
          console.error(`Error fetching lab reports for batch ${herb.batch_id}:`, reportError);
          return { ...herb, labReports: [] };
        }
      }));

      const processedHerbs = herbsWithReports
        .filter(herb => herb.labReports && herb.labReports.length > 0) // Filter for herbs with lab reports
        .map(herb => ({
          id: herb.batch_id, // Ensure id is batch_id
          name: herb.species_name,
          ...herb, // Keep all herb data
          status: herb.quality_status // Ensure status is quality_status
        }));
      console.log('Processed availableHerbs:', processedHerbs); // Log the processed herbs
      setAvailableHerbs(processedHerbs);
    } catch (error) {
      console.error("Failed to fetch approved herbs:", error);
      Alert.alert("Error", "Failed to load available herbs. Please try again later.");
    }
  }, []);

  // Function to fetch ordered herbs for a specific manufacturer
  const fetchOrderedHerbs = useCallback(async () => {
    try {
      // Assuming manufacturer_001 for now
      const manufacturerId = 'manufacturer_001';
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/manufacturer/${manufacturerId}/ordered`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrderedHerbs(data.herbs || []);
    } catch (error) {
      console.error("Failed to fetch ordered herbs:", error);
      Alert.alert("Error", "Failed to load ordered herbs. Please try again later.");
    }
  }, []);

  useEffect(() => {
    fetchApprovedHerbs();
    fetchOrderedHerbs(); // Fetch ordered herbs on mount/reload
  }, [fetchApprovedHerbs, fetchOrderedHerbs]);

  useEffect(() => {
    if (route.params?.scannedData) {
      const { scannedData } = route.params;
      // In a real app, you would fetch details for scannedData from an API
      // For now, let's try to find it in our approved/ordered lists
      const foundHerb = approvedHerbs.find(herb => herb.id === scannedData) || orderedHerbs.find(herb => herb.id === scannedData);

      if (foundHerb) {
        setScannedHerbDetails(foundHerb);
        setActiveSection('scanned_details');
        openDetailsModal(foundHerb);
        Alert.alert('Scan Successful', `Details for ${foundHerb.name} (${foundHerb.id}) loaded.`);
      } else {
        // Fallback for not found or mock data
        const mockScannedHerb = { id: scannedData, name: `Unknown Herb (${scannedData})`, status: 'Unknown', description: 'No details found for this scanned herb.' };
        setScannedHerbDetails(mockScannedHerb);
        setActiveSection('scanned_details');
        openDetailsModal(mockScannedHerb);
        Alert.alert('Scan Successful', `No matching herb found. Displaying mock details for ${scannedData}.`);
      }
      navigation.setParams({ scannedData: undefined });
    }
  }, [route.params?.scannedData, approvedHerbs, orderedHerbs, openDetailsModal, navigation]);

  const openDetailsModal = useCallback((herb) => {
    setSelectedHerbForDetails(herb);
    setIsDetailsModalVisible(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalVisible(false);
    setSelectedHerbForDetails(null);
  }, []);

  const handleReceiveHerb = useCallback(async (herb, scannedQrText) => {
    if (!herb || !scannedQrText) {
      Alert.alert("Error", "Herb details or scanned QR text missing.");
      return;
    }

    try {
      // Assuming manufacturer_001 for now, similar to ordering
      const manufacturerId = 'manufacturer_001';
      // For transporterId, we assume the current owner of the herb is the transporter
      const transporterId = herb.current_owner; 
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${herb.id}/receive_by_manufacturer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer_id: manufacturerId,
          transporter_id: transporterId,
          scanned_qr_text: scannedQrText,
          receiving_location: 'Manufacturer Facility', // Hardcoded for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Receive Herb API response:', result);

      // Update local state:
      // Remove from orderedHerbs
      setOrderedHerbs(prev => prev.filter(h => h.id !== herb.id));

      // Add to scannedHerbDetails for display on scanned_details page
      const receivedHerb = { 
        ...herb, 
        status: 'in_stock', // Update status
        active_qr: result.new_qr_code, // New QR code from backend
        current_owner: manufacturerId, // Update current owner
        labReports: herb.labReports, // Persist lab reports
      };
      setScannedHerbDetails(receivedHerb);
      setActiveSection('scanned_details');
      openDetailsModal(receivedHerb); // Show details modal

      Alert.alert('Receipt Successful', `${receivedHerb.name} has been received and is now in stock.`);

      // Optionally refresh available herbs to ensure consistency
      fetchApprovedHerbs();

    } catch (error) {
      console.error("Failed to receive herb:", error);
      Alert.alert("Error", `Failed to receive herb: ${error.message || 'Please try again later.'}`);
    }
  }, [orderedHerbs, openDetailsModal, fetchApprovedHerbs]);

  const handleOrderHerb = useCallback(async (herbId) => {
    const herbToOrder = availableHerbs.find(herb => herb.id === herbId);
    if (herbToOrder) {
      console.log('Attempting to order herb:', herbToOrder);
      try {
        // Assuming a manufacturer_id is available, e.g., from context or props
        // For now, using a placeholder. In a real app, this would come from authentication context.
        const manufacturerId = 'manufacturer_001'; 
        const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${herbId}/order_by_manufacturer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({'manufacturer_id': manufacturerId}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Order API response:', result);

        // Update local state after successful API call
        setOrderedHerbs(prev => [...prev, { ...herbToOrder, orderDate: new Date().toISOString(), status: 'manufacturer_ordered_pending_pickup' }]);
        setAvailableHerbs(prev => prev.filter(herb => herb.id !== herbId));
        openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString(), status: 'manufacturer_ordered_pending_pickup' });
        Alert.alert('Order Placed', `${herbToOrder.name} has been added to your ordered list. Reference: ${result.ownership_transfer.transfer_id || 'N/A'}`);

        // Refresh both lists after successful order
        fetchApprovedHerbs();
        fetchOrderedHerbs();

      } catch (error) {
        console.error("Failed to order herb:", error);
        Alert.alert("Error", `Failed to place order for ${herbToOrder.name}. ${error.message || 'Please try again later.'}`);
      }
    }
  }, [availableHerbs, openDetailsModal, fetchApprovedHerbs, fetchOrderedHerbs]);

  const handleScanQRCode = useCallback((herb = null, mode = 'general_scan') => {
    setHerbToReceive(herb); // Store the herb if it's a receive operation
    setScanMode(mode);
    setScannerVisible(true);
    // navigation.navigate('QRScannerScreen'); // We will use a modal for the scanner
  }, []);

  const clearScannedDetails = useCallback(() => {
    setScannedHerbDetails(null);
    setActiveSection('available_herbs'); // Go back to available herbs after clearing
    closeDetailsModal();
    Alert.alert('Cleared', 'Scanned herb details have been cleared.');
  }, [closeDetailsModal]);

  const getStatusStyle = useCallback((status) => {
    switch (status) {
      case 'approved':
      case 'Certified': // API might return 'approved', mock data might use 'Certified'
        return { backgroundColor: '#D4EDDA', color: '#155724' };
      case 'pending':
      case 'pending_pickup':
      case 'testing':
      case 'manufacturer_ordered_pending_pickup': // Added new status
        return { backgroundColor: '#FFF3CD', color: '#856404' };
      case 'rejected':
        return { backgroundColor: '#F8D7DA', color: '#721C24' };
      default:
        return { backgroundColor: '#F9FAFB', color: '#4B5563' };
    }
  }, []);

  return {
    activeSection,
    setActiveSection,
    availableHerbs,
    orderedHerbs,
    scannedHerbDetails,
    handleOrderHerb,
    handleScanQRCode,
    clearScannedDetails,
    getStatusStyle,
    isDetailsModalVisible,
    selectedHerbForDetails,
    openDetailsModal,
    closeDetailsModal,
    approvedHerbs, // Expose approvedHerbs
    handleReceiveHerb, // Expose handleReceiveHerb
    scannerVisible, // Expose scannerVisible
    scanMode, // Expose scanMode
    herbToReceive, // Expose herbToReceive
    setScannerVisible, // Expose setScannerVisible for closing the scanner
  };
};

export default useRawHerbData;