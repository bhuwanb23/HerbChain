import React from 'react';
import { View, StyleSheet } from 'react-native';
// Removed: import { SafeAreaView } from 'react-native-safe-area-context';
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
    availableHerbs, // This now comes from approvedHerbs in the hook
    orderedHerbs,
    scannedHerbDetails,
    handleOrderHerb,
    handleScanQRCode, // Get handleScanQRCode from hook
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
            onScanQRCode={handleScanQRCode} // Pass handleScanQRCode
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
      {/* Replaced ScrollView with a View */}
      <View style={styles.contentContainerWrapper}>
        {renderContent()}
      </View>

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
    backgroundColor: '#F9FAFB', // Use a hardcoded value for COLORS.gray[50]
  },
  contentContainerWrapper: {
    flex: 1, // Ensure it takes up available space
  },
});

export default RawHerbManagementPage;