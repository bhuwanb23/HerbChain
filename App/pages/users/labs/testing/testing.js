import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import { useTesting } from './hooks';
import { TestingResultsEntry, OfflineSync } from './components';
import HerbChipList from './components/HerbChipList';
import LabReportView from './components/LabReportView';

const TestingPage = ({ navigation }) => {
  const { t } = useGlobalTranslation();
  const {
    selectedBatch,
    isOffline,
    testResults,
    uploadedFiles,
    offlineData,
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
    resetSelection,
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
            title={t.labTesting?.herbsWithNoTestUploaded || 'Herbs with No Test Uploaded'} 
            items={herbs_not_uploaded}
            onPress={(h) => handleBatchSelect(h.batch_id, 'upload')}
          />
          <HerbChipList 
            title={t.labTesting?.testedUploadedHerbs || 'Tested/Uploaded Herbs'} 
            items={herbs_with_reports}
            onPress={(h) => handleBatchSelect(h.batch_id, 'view')}
          />
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
      <Text style={styles.pageTitle}>{t.labTesting?.labTestingDashboard || 'Lab Testing Dashboard'}</Text>
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
});

export default TestingPage;
