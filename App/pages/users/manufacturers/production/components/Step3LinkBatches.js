import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinkedBatchItem from './LinkedBatchItem';

const Step3LinkBatches = ({
  linkedBatches,
  productId,
  onPreviousStep,
  onNextStep,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Linked Batch IDs</Text>
        <Text style={styles.subtitle}>Automatically generated batch linkages</Text>

        <View style={styles.masterBatchCard}>
          <View>
            <Text style={styles.masterBatchTitle}>Master Batch ID</Text>
            <Text style={styles.masterBatchId}>{productId}</Text>
          </View>
          <Icon name="link" size={20} color="#059669" />
        </View>

        <View style={styles.sourceBatchesCard}>
          <Text style={styles.sourceBatchesTitle}>Source Batches</Text>
          <FlatList
            data={linkedBatches}
            keyExtractor={item => item.batchId}
            renderItem={({ item }) => <LinkedBatchItem herbName={item.herbName} batchId={item.batchId} />}
            contentContainerStyle={styles.linkedBatchesList}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.infoCard}>
          <Icon name="info" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>All batch linkages have been verified and recorded in the blockchain</Text>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={onPreviousStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNextStep}>
            <Text style={styles.nextButtonText}>Generate QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Flex properties handled by parent
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24, // p-6
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    color: '#111827', // gray-900
    marginBottom: 8, // mb-2
  },
  subtitle: {
    fontSize: 14, // text-sm
    color: '#4b5563', // gray-600
    marginBottom: 24, // mb-6
  },
  masterBatchCard: {
    backgroundColor: '#f0fdf4', // green-50
    borderColor: '#bbe8d0', // green-200 (approx)
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  masterBatchTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  masterBatchId: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  sourceBatchesCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sourceBatchesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12, // mb-3
  },
  linkedBatchesList: {
    rowGap: 8, // space-y-2
  },
  infoCard: {
    backgroundColor: '#eef2ff', // blue-50
    borderColor: '#bfdbfe', // blue-200
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8, // space-x-2
    marginBottom: 24, // mb-6
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1d4ed8', // blue-700
  },
  navigationButtons: {
    flexDirection: 'row',
    columnGap: 12, // space-x-3
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButtonText: {
    color: '#4b5563', // gray-700
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#059669', // primary
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Step3LinkBatches;