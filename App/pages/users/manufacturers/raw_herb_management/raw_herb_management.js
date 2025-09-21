import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
// Removed: import { SafeAreaView } from 'react-native-safe-area-context';
import AvailableHerbList from './components/AvailableHerbList';
import OrderedHerbList from './components/OrderedHerbList';
import ScannedHerbDetails from './components/ScannedHerbDetails';
import RawHerbSectionTabs from './components/RawHerbSectionTabs'; // New import
import HerbDetailsModal from './components/HerbDetailsModal'; // New Import
import { ScannerOverlay } from '../../transporters/trips/components/ScannerOverlay'; // Import ScannerOverlay
import useRawHerbData from './hooks/useRawHerbData';

const RawHerbManagementPage = () => {
  const { t } = useGlobalTranslation();
  const {
    activeSection,
    setActiveSection,
    availableHerbs, // This now comes from approvedHerbs in the hook
    orderedHerbs,
    scannedHerbDetails,
    handleOrderHerb,
    handleScanQRCode, // Get handleScanQRCode from hook
    handleReceiveHerb, // Get handleReceiveHerb from hook
    clearScannedDetails,
    getStatusStyle,
    isDetailsModalVisible,
    selectedHerbForDetails,
    openDetailsModal,
    closeDetailsModal,
    scannerVisible,
    scanMode,
    herbToReceive,
    setScannerVisible,
  } = useRawHerbData();

  const onManufacturerBarcodeScanned = ({ data }) => {
    console.log('ScannerOverlay - Scanned Data:', data);
    console.log('ScannerOverlay - Scan Mode:', scanMode);
    console.log('ScannerOverlay - Herb to Receive:', herbToReceive);
    setScannerVisible(false); // Close scanner after scan
    if (scanMode === 'receive_by_manufacturer') {
      if (herbToReceive) {
        handleReceiveHerb(herbToReceive, data);
      } else {
        Alert.alert(t.rawHerbManagement?.error || 'Error', t.rawHerbManagement?.noHerbSelectedForReceiving || 'No herb selected for receiving.');
      }
    } else {
      // Default scan for general herb details
      handleScanQRCode(null, 'general_scan'); // Re-initiate general scan if needed
      // navigation.navigate('QRScannerScreen', { scannedData: data }); // Navigate to a dedicated scanned details page or handle directly
    }
  };

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
            onScanInitiate={handleScanQRCode} // Pass handleScanQRCode
            onItemPress={openDetailsModal} // Pass openDetailsModal
            onReceiveHerb={handleReceiveHerb} // Pass handleReceiveHerb
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

      <ScannerOverlay
        isVisible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={onManufacturerBarcodeScanned}
        scanMode={scanMode}
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