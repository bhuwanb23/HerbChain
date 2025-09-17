import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useBatchWorkflow } from '../hooks';
import BatchTimeline from './BatchTimeline';

const ComplianceApproval = ({ batchData, onApproval }) => {
  const { currentStep, nextStep } = useBatchWorkflow();

  const [testResults] = React.useState({
    moistureContent: 8.5,
    pesticideResidue: 0.02,
    phytochemicalLevel: 95.2,
    heavyMetals: 0.001,
    microbialCount: 100,
  });

  const [ayushStandards] = React.useState({
    moistureContent: { min: 5, max: 12 },
    pesticideResidue: { max: 0.05 },
    phytochemicalLevel: { min: 80 },
    heavyMetals: { max: 0.01 },
    microbialCount: { max: 1000 },
  });

  const checkCompliance = (test, standard) => {
    if (test <= standard.max && test >= (standard.min || 0)) {
      return { status: 'compliant', color: '#10B981' };
    }
    return { status: 'non-compliant', color: '#EF4444' };
  };

  const handleApproval = (approved) => {
    const action = approved ? 'approve' : 'reject';
    Alert.alert(
      `Batch ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${action} this batch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          onPress: () => {
            onApproval && onApproval(approved);
            if (approved) {
              nextStep();
            }
          }
        },
      ]
    );
  };

  const testItems = [
    {
      name: 'Moisture Content',
      value: testResults.moistureContent,
      unit: '%',
      standard: ayushStandards.moistureContent,
    },
    {
      name: 'Pesticide Residue',
      value: testResults.pesticideResidue,
      unit: 'ppm',
      standard: ayushStandards.pesticideResidue,
    },
    {
      name: 'Phytochemical Level',
      value: testResults.phytochemicalLevel,
      unit: '%',
      standard: ayushStandards.phytochemicalLevel,
    },
    {
      name: 'Heavy Metals',
      value: testResults.heavyMetals,
      unit: 'ppm',
      standard: ayushStandards.heavyMetals,
    },
    {
      name: 'Microbial Count',
      value: testResults.microbialCount,
      unit: 'CFU/g',
      standard: ayushStandards.microbialCount,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <BatchTimeline currentStep="compliance" progress={75} />
        
        <View style={styles.batchInfo}>
          <Text style={styles.batchId}>Batch: {batchData || 'BATCH-001'}</Text>
          <Text style={styles.herbType}>Ashwagandha</Text>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Test Results vs AYUSH Standards</Text>
          
          {testItems.map((item, index) => {
            const compliance = checkCompliance(item.value, item.standard);
            return (
              <View key={index} style={styles.testItem}>
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{item.name}</Text>
                  <View style={[styles.complianceBadge, { backgroundColor: compliance.color }]}>
                    <Text style={styles.complianceText}>{compliance.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.testDetails}>
                  <View style={styles.testValue}>
                    <Text style={styles.valueText}>{item.value}{item.unit}</Text>
                    <Text style={styles.valueLabel}>Test Result</Text>
                  </View>
                  
                  <View style={styles.testStandard}>
                    <Text style={styles.standardText}>
                      {item.standard.min ? `${item.standard.min}-${item.standard.max}` : `≤${item.standard.max}`}{item.unit}
                    </Text>
                    <Text style={styles.standardLabel}>AYUSH Standard</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleApproval(false)}
        >
          <Text style={styles.rejectButtonText}>❌ Reject Batch</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproval(true)}
        >
          <Text style={styles.approveButtonText}>✅ Approve Batch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  batchInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  herbType: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  testItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  complianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complianceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testValue: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  valueLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  testStandard: {
    alignItems: 'center',
  },
  standardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  standardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComplianceApproval;