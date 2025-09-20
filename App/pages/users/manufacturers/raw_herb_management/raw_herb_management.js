import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
// Removed: import { SafeAreaView } from 'react-native-safe-area-context';

// Removed: import RawHerbHeader from './components/RawHerbHeader';
// Removed: import FilterBar from './components/FilterBar';
// Removed: import BatchCard from './components/BatchCard';
// Removed: import BatchDetailsModal from './components/BatchDetailsModal';
// Removed: import QRScannerModal from './components/QRScannerModal';

import AvailableHerbList from './components/AvailableHerbList';
import OrderedHerbList from './components/OrderedHerbList';
import ScannedHerbDetails from './components/ScannedHerbDetails';
import RawHerbSectionTabs from './components/RawHerbSectionTabs'; // New import
import HerbDetailsModal from './components/HerbDetailsModal'; // New Import

import useRawHerbData from './hooks/useRawHerbData';

const RawHerbManagementPage = () => {
  const {
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
  } = useRawHerbData();

  const renderContent = () => {
    switch (activeSection) {
      case 'available_herbs':
        return (
          <AvailableHerbList
            availableHerbs={availableHerbs}
            onOrderHerb={handleOrderHerb}
            getStatusStyle={getStatusStyle}
            onItemPress={openDetailsModal} // Pass openDetailsModal
          />
        );
      case 'ordered_herbs':
        return (
          <OrderedHerbList
            orderedHerbs={orderedHerbs}
            getStatusStyle={getStatusStyle}
            onScanQRCode={handleScanQRCode}
            onItemPress={openDetailsModal} // Pass openDetailsModal
          />
        );
      case 'scanned_details':
        return (
          <ScannedHerbDetails
            scannedHerb={scannedHerbDetails}
            getStatusStyle={getStatusStyle}
            onClearScannedDetails={clearScannedDetails}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <RawHerbSectionTabs activeSection={activeSection} onSelectSection={setActiveSection} />
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      <HerbDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={closeDetailsModal}
        herb={selectedHerbForDetails}
        getStatusStyle={getStatusStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    // paddingHorizontal: 16, // Handled by individual list components
    paddingVertical: 10, // Adjust as needed
  },
});

export default RawHerbManagementPage;