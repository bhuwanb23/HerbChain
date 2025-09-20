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
      const processedHerbs = herbs.map(herb => ({
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

  useEffect(() => {
    fetchApprovedHerbs();
  }, [fetchApprovedHerbs]);

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

  const handleOrderHerb = useCallback((herbId) => {
    const herbToOrder = availableHerbs.find(herb => herb.id === herbId);
    if (herbToOrder) {
      // In a real app, this would be an API call to order the herb
      setOrderedHerbs(prev => [...prev, { ...herbToOrder, orderDate: new Date().toISOString() }]);
      setAvailableHerbs(prev => prev.filter(herb => herb.id !== herbId));
      openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString() });
      Alert.alert('Order Placed', `${herbToOrder.name} has been added to your ordered list.`);
    }
  }, [availableHerbs, openDetailsModal]);

  const handleScanQRCode = useCallback(() => {
    navigation.navigate('QRScannerScreen');
  }, [navigation]);

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
  };
};

export default useRawHerbData;