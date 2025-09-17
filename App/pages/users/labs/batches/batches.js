import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useBatchWorkflow } from './hooks';
import {
  BatchVerification,
  ComplianceApproval,
  DeliveryConfirmation,
} from './components';

const BatchesPage = ({ navigation }) => {
  const { currentStep, goToStep, resetWorkflow } = useBatchWorkflow();
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleBatchLoad = (batchId) => {
    setSelectedBatch(batchId);
    goToStep('compliance');
  };

  const handleApproval = (approved) => {
    if (approved) {
      goToStep('delivery');
    } else {
      // Handle rejection - go back to verification
      goToStep('verification');
      setSelectedBatch(null);
    }
  };

  const handleDeliveryComplete = () => {
    // Reset to verification step
    resetWorkflow();
    setSelectedBatch(null);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'verification':
        return <BatchVerification onBatchLoad={handleBatchLoad} />;
      case 'compliance':
        return (
          <ComplianceApproval 
            batchData={selectedBatch}
            onApproval={handleApproval}
          />
        );
      case 'delivery':
        return (
          <DeliveryConfirmation 
            batchData={selectedBatch}
            onDeliveryComplete={handleDeliveryComplete}
          />
        );
      default:
        return <BatchVerification onBatchLoad={handleBatchLoad} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default BatchesPage;
