import { useState, useMemo } from 'react';
import { AVAILABLE_HERBS, ORDERED_HERBS_MOCK, SCANNED_HERB_DETAILS_MOCK } from '../constants/rawHerbConstants';

const useRawHerbData = () => {
  const [activeSection, setActiveSection] = useState('available_herbs'); // 'available_herbs', 'ordered_herbs', 'scanned_details'
  const [availableHerbs, setAvailableHerbs] = useState(AVAILABLE_HERBS);
  const [orderedHerbs, setOrderedHerbs] = useState(ORDERED_HERBS_MOCK);
  const [scannedHerbDetails, setScannedHerbDetails] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedHerbForDetails, setSelectedHerbForDetails] = useState(null);

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
      // Optionally, show details of the ordered herb immediately in the modal
      openDetailsModal({ ...herbToOrder, orderDate: new Date().toISOString() });
    }
  };

  const handleScanQRCode = () => {
    // Simulate QR code scan - in a real app, this would open a camera scanner
    // For now, use a mock scanned herb detail
    const mockScannedHerb = SCANNED_HERB_DETAILS_MOCK[0];
    setScannedHerbDetails(mockScannedHerb);
    setActiveSection('scanned_details');
    openDetailsModal(mockScannedHerb); // Open modal for scanned item
  };

  const clearScannedDetails = () => {
    setScannedHerbDetails(null);
    setActiveSection('ordered_herbs'); // Go back to ordered herbs after clearing
    closeDetailsModal(); // Close modal if open
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
      case 'Certified':
        return { backgroundColor: '#dcfce7', color: '#16a34a' }; // green-100, green-700
      case 'Pending':
        return { backgroundColor: '#fef9c3', color: '#a16207' }; // yellow-100, yellow-700
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' }; // gray-200, gray-600
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