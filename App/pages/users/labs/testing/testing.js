import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTesting } from './hooks';
import {
  TestingResultsEntry,
  OfflineSync,
} from './components';

const TestingPage = ({ navigation }) => {
  const {
    currentTab,
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
  } = useTesting();

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'results':
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
      case 'sync':
        return (
          <OfflineSync 
            offlineData={offlineData}
            onSyncAll={handleSyncAll}
            onSyncEntry={handleSyncOfflineData}
            onRetrySync={handleRetrySync}
            onDeleteEntry={handleDeleteOfflineEntry}
          />
        );
      default:
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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <View
            style={[
              styles.tabButton,
              currentTab === 'results' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'results' && styles.activeTabButtonText
              ]}
              onPress={() => handleTabChange('results')}
            >
              🧪 Results Entry
            </Text>
          </View>
          <View
            style={[
              styles.tabButton,
              currentTab === 'sync' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'sync' && styles.activeTabButtonText
              ]}
              onPress={() => handleTabChange('sync')}
            >
              📱 Offline Sync
            </Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default TestingPage;
