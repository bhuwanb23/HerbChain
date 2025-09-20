import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTesting } from './hooks';
import { TestingResultsEntry, OfflineSync } from './components';
import HerbChipList from './components/HerbChipList';
import UploadedResults from './components/UploadedResults';
import LabReportView from './components/LabReportView';

const TestingPage = ({ navigation }) => {
  const {
    currentTab,
    archived,
    selectedBatch,
    isOffline,
    testResults,
    uploadedFiles,
    offlineData,
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
    herbs_not_uploaded,
    herbs_with_reports,
    currentMode,
    selectedReport,
    handleViewReport,
    resetSelection, // New function to reset selected batch and mode
  } = useTesting();

  const renderCurrentView = () => {
    if (currentMode === 'upload' && selectedBatch) {
      return (
        <TestingResultsEntry 
          batchId={selectedBatch}
          isOffline={isOffline}
          testResults={testResults}
          uploadedFiles={uploadedFiles}
          onToggleOffline={toggleOfflineMode}
          onTestResultChange={handleTestResultChange}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          onSaveOffline={handleSaveOffline}
          onSubmitResults={handleSubmitResults}
        />
      );
    } else if (currentMode === 'view' && selectedReport) {
      return <LabReportView report={selectedReport} onBack={resetSelection} />;
    } else {
      return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <HerbChipList 
            title="Herbs with No Test Uploaded" 
            items={herbs_not_uploaded}
            onPress={(h) => handleBatchSelect(h.batch_id, 'upload')}
          />
          <HerbChipList 
            title="Tested/Uploaded Herbs" 
            items={herbs_with_reports}
            onPress={(h) => handleBatchSelect(h.batch_id, 'view')}
          />
          {/* Optionally add the OfflineSync component here if needed for general lab overview */}
          {isOffline && <OfflineSync 
            offlineData={offlineData}
            onSync={handleSyncOfflineData}
            onRetry={handleRetrySync}
            onDelete={handleDeleteOfflineEntry}
            onSyncAll={handleSyncAll}
          />}
        </ScrollView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Simplified header or title if needed */}
      <Text style={styles.pageTitle}>Lab Testing Dashboard</Text>
      {renderCurrentView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Remove old tab-related styles if no longer needed
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

export default TestingPage;
