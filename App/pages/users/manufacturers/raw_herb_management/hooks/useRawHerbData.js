import { useState, useMemo } from 'react';
import { BATCH_DATA } from '../constants/rawHerbConstants';

const useRawHerbData = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isBatchDetailsModalVisible, setBatchDetailsModalVisible] = useState(false);
  const [isQRScannerModalVisible, setQRScannerModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const filteredBatches = useMemo(() => {
    if (selectedFilter === 'all') {
      return BATCH_DATA;
    }
    return BATCH_DATA.filter(batch => batch.status.toLowerCase() === selectedFilter || batch.name.toLowerCase().includes(selectedFilter));
  }, [selectedFilter]);

  const openBatchDetails = (batchId) => {
    const batch = BATCH_DATA.find(b => b.id === batchId);
    setSelectedBatch(batch);
    setBatchDetailsModalVisible(true);
  };

  const closeBatchDetails = () => {
    setBatchDetailsModalVisible(false);
    setSelectedBatch(null);
  };

  const openQRScanner = () => {
    setQRScannerModalVisible(true);
  };

  const closeQRScanner = () => {
    setQRScannerModalVisible(false);
  };

  return {
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
  };
};

export default useRawHerbData;