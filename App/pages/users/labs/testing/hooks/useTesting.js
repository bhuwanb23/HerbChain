import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export const useTesting = () => {
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState('results');
  const [selectedBatch, setSelectedBatch] = useState('BT-2024-001');
  const [isOffline, setIsOffline] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [offlineData, setOfflineData] = useState([]);

  const handleTabChange = useCallback((tabId) => {
    setCurrentTab(tabId);
  }, []);

  const handleBatchSelect = useCallback((batchId) => {
    setSelectedBatch(batchId);
  }, []);

  const toggleOfflineMode = useCallback(() => {
    setIsOffline(prev => !prev);
  }, []);

  const handleTestResultChange = useCallback((testId, value) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: value,
    }));
  }, []);

  const handleFileUpload = useCallback((fileType, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file,
    }));
  }, []);

  const handleFileRemove = useCallback((fileType) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  }, []);

  const handleSaveOffline = useCallback(() => {
    const offlineEntry = {
      id: Date.now().toString(),
      batchId: selectedBatch,
      testResults,
      files: Object.keys(uploadedFiles),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    setOfflineData(prev => [...prev, offlineEntry]);
    
    // Clear current form
    setTestResults({});
    setUploadedFiles({});
    
    console.log('Saved offline:', offlineEntry);
  }, [selectedBatch, testResults, uploadedFiles]);

  const handleSubmitResults = useCallback(() => {
    const resultsData = {
      batchId: selectedBatch,
      testResults,
      files: uploadedFiles,
      timestamp: new Date().toISOString(),
    };

    console.log('Results submitted:', resultsData);
    
    // Clear form after submission
    setTestResults({});
    setUploadedFiles({});
  }, [selectedBatch, testResults, uploadedFiles]);

  const handleSyncOfflineData = useCallback((offlineEntryId) => {
    setOfflineData(prev => 
      prev.map(entry => 
        entry.id === offlineEntryId 
          ? { ...entry, status: 'syncing' }
          : entry
      )
    );

    // Simulate sync process
    setTimeout(() => {
      setOfflineData(prev => 
        prev.map(entry => 
          entry.id === offlineEntryId 
            ? { ...entry, status: 'completed' }
            : entry
        )
      );
    }, 2000);
  }, []);

  const handleRetrySync = useCallback((offlineEntryId) => {
    handleSyncOfflineData(offlineEntryId);
  }, [handleSyncOfflineData]);

  const handleDeleteOfflineEntry = useCallback((offlineEntryId) => {
    setOfflineData(prev => prev.filter(entry => entry.id !== offlineEntryId));
  }, []);

  const handleSyncAll = useCallback(() => {
    const pendingEntries = offlineData.filter(entry => entry.status === 'pending');
    
    pendingEntries.forEach(entry => {
      handleSyncOfflineData(entry.id);
    });
  }, [offlineData, handleSyncOfflineData]);

  return {
    // State
    currentTab,
    selectedBatch,
    isOffline,
    testResults,
    uploadedFiles,
    offlineData,
    
    // Actions
    handleTabChange,
    handleBatchSelect,
    toggleOfflineMode,
    handleTestResultChange,
    handleFileUpload,
    handleFileRemove,
    handleSaveOffline,
    handleSubmitResults,
    handleSyncOfflineData,
    handleRetrySync,
    handleDeleteOfflineEntry,
    handleSyncAll,
  };
};
