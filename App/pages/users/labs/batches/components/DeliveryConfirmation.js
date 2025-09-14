import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const DeliveryConfirmation = ({ batchData, onDeliveryComplete }) => {
  const [deliveryStatus, setDeliveryStatus] = useState('pending');

  const handleDeliveryComplete = () => {
    Alert.alert(
      'Complete Delivery',
      'Mark this batch as complete and forward results to AYUSH/regulator?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            setDeliveryStatus('completed');
            onDeliveryComplete && onDeliveryComplete();
            Alert.alert('Success', 'Batch delivery completed successfully!');
          }
        },
      ]
    );
  };

  const mockBatchData = {
    id: 'BATCH-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    status: 'approved',
    qualityScore: 95,
    testDate: '2024-01-15',
    approvedBy: 'Dr. Priya Sharma',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Confirmation</Text>
      
      <View style={styles.batchSummary}>
        <Text style={styles.sectionTitle}>Batch Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Batch ID:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.id}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Herb Type:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.herbType}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Farmer:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.farmer}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.statusText}>{mockBatchData.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Quality Score:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.qualityScore}%</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Test Date:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.testDate}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Approved By:</Text>
          <Text style={styles.summaryValue}>{mockBatchData.approvedBy}</Text>
        </View>
      </View>

      <View style={styles.deliveryActions}>
        <Text style={styles.sectionTitle}>Delivery Actions</Text>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📋</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Generate Certificate</Text>
            <Text style={styles.actionDescription}>Create AYUSH compliance certificate</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📤</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Forward to AYUSH</Text>
            <Text style={styles.actionDescription}>Send results to regulatory body</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📧</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Notify Farmer</Text>
            <Text style={styles.actionDescription}>Send results to farmer</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Notify</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.completeButton,
          deliveryStatus === 'completed' && styles.completedButton
        ]}
        onPress={handleDeliveryComplete}
        disabled={deliveryStatus === 'completed'}
      >
        <Text style={[
          styles.completeButtonText,
          deliveryStatus === 'completed' && styles.completedButtonText
        ]}>
          {deliveryStatus === 'completed' ? '✅ Delivery Completed' : '🎯 Complete Delivery'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  batchSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deliveryActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completedButton: {
    backgroundColor: '#D1D5DB',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedButtonText: {
    color: '#6B7280',
  },
});

export default DeliveryConfirmation;
