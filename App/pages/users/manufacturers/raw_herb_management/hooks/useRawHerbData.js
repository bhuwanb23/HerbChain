import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native'; // Import Alert
import { AVAILABLE_HERBS, ORDERED_HERBS_MOCK, SCANNED_HERB_DETAILS_MOCK } from '../constants/rawHerbConstants';
import { useNavigation, useRoute } from '@react-navigation/native';

const useRawHerbData = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeSection, setActiveSection] = useState('available_herbs'); // 'available_herbs', 'ordered_herbs', 'scanned_details'
  const [availableHerbs, setAvailableHerbs] = useState(AVAILABLE_HERBS);
  const [orderedHerbs, setOrderedHerbs] = useState(ORDERED_HERBS_MOCK);
  const [scannedHerbDetails, setScannedHerbDetails] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedHerbForDetails, setSelectedHerbForDetails] = useState(null);

  useEffect(() => {
    if (route.params?.scannedData) {
      const { scannedData } = route.params;
      const foundHerb = orderedHerbs.find(herb => herb.id === scannedData) || AVAILABLE_HERBS.find(herb => herb.id === scannedData);

      if (foundHerb) {
        setScannedHerbDetails(foundHerb);
        setActiveSection('scanned_details');
        openDetailsModal(foundHerb);
        Alert.alert('Scan Successful', `Details for ${foundHerb.name} (${foundHerb.id}) loaded.`);
      } else {
        const mockScannedHerb = { ...SCANNED_HERB_DETAILS_MOCK[0], id: scannedData, name: `Unknown Herb (${scannedData})` };
        setScannedHerbDetails(mockScannedHerb);
        setActiveSection('scanned_details');
        openDetailsModal(mockScannedHerb);
        Alert.alert('Scan Successful', `No matching herb found. Displaying mock details for ${scannedData}.`);
      }
      navigation.setParams({ scannedData: undefined });
    }
  }, [route.params?.scannedData, orderedHerbs, availableHerbs]);

  const openDetailsModal = (herb) => {
    setSelectedHerbForDetails(herb);
    setIsDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setSelectedHerbForDetails(null);
  };

  const handleOrderHerb = (herbId) => {
    const herbToOrder = availableHerbs.find(herb => herb.id === herbId);
    if (herbToOrder) {
      setOrderedHerbs(prev => [...prev, { ...herbToOrder, orderDate: new Date().toISOString() }]);
      setAvailableHerbs(prev => prev.filter(herb => herb.id !== herbId));
      openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString() });
      Alert.alert('Order Placed', `${herbToOrder.name} has been added to your ordered list.`);
    }
  };

  const handleScanQRCode = () => {
    navigation.navigate('QRScannerScreen');
  };

  const clearScannedDetails = () => {
    setScannedHerbDetails(null);
    setActiveSection('ordered_herbs');
    closeDetailsModal();
    Alert.alert('Cleared', 'Scanned herb details have been cleared.');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
      case 'Certified':
        return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'Pending':
        return { backgroundColor: '#fef9c3', color: '#a16207' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' };
    }
  };

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
  };
};

export default useRawHerbData;