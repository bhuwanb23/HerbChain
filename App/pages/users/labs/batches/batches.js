import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  BatchVerification,
  ComplianceApproval,
  DeliveryConfirmation,
} from './components';

const BatchesPage = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState('verification');
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleBatchLoad = (batchId) => {
    setSelectedBatch(batchId);
    setCurrentStep('compliance');
  };

  const handleApproval = (approved) => {
    if (approved) {
      setCurrentStep('delivery');
    } else {
      // Handle rejection
      console.log('Batch rejected');
    }
  };

  const handleDeliveryComplete = () => {
    // Reset to verification step
    setCurrentStep('verification');
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
