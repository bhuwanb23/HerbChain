import React from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RawHerbHeader from './components/RawHerbHeader';
import FilterBar from './components/FilterBar';
import BatchCard from './components/BatchCard';
import BatchDetailsModal from './components/BatchDetailsModal';
import QRScannerModal from './components/QRScannerModal';
import useRawHerbData from './hooks/useRawHerbData';

const RawHerbManagementPage = () => {
  const {
    selectedFilter,
    setSelectedFilter,
    filteredBatches,
    isBatchDetailsModalVisible,
    openBatchDetails,
    closeBatchDetails,
    isQRScannerModalVisible,
    openQRScanner,
    closeQRScanner,
    selectedBatch,
  } = useRawHerbData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <RawHerbHeader onScanQR={openQRScanner} />
      <FilterBar selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} />
      <FlatList
        data={filteredBatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BatchCard batch={item} onPress={openBatchDetails} />}
        contentContainerStyle={styles.batchListContent}
        style={styles.batchList}
      />

      <BatchDetailsModal
        isVisible={isBatchDetailsModalVisible}
        onClose={closeBatchDetails}
        batch={selectedBatch}
      />

      <QRScannerModal
        isVisible={isQRScannerModalVisible}
        onClose={closeQRScanner}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
  },
  batchList: {
    flex: 1,
  },
  batchListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    rowGap: 12, // space-y-3
  },
});

export default RawHerbManagementPage;