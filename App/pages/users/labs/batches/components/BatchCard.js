import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { STATUS_CONFIG } from '../constants';

const BatchCard = ({ 
  batch, 
  onStartVerification, 
  onContinueTesting, 
  onMarkDelivered, 
  onViewDetails, 
  onDownloadReport 
}) => {
  const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.pending;

  const getActionButton = () => {
    switch (batch.status) {
      case 'pending':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryBg]}
            onPress={() => onStartVerification && onStartVerification(batch.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Start Verification</Text>
          </TouchableOpacity>
        );
      case 'testing':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryBg]}
            onPress={() => onContinueTesting && onContinueTesting(batch.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Continue Testing</Text>
          </TouchableOpacity>
        );
      case 'approved':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.greenBg]}
            onPress={() => onMarkDelivered && onMarkDelivered(batch.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const getSecondaryAction = () => {
    switch (batch.status) {
      case 'pending':
        return (
          <TouchableOpacity 
            style={[styles.iconButton, styles.cardBorder]}
            onPress={() => onViewDetails && onViewDetails(batch.id)}
            activeOpacity={0.8}
          >
            <Icon name="info" size={20} color="#808080" />
          </TouchableOpacity>
        );
      case 'testing':
        return (
          <TouchableOpacity 
            style={[styles.iconButton, styles.cardBorder]}
            onPress={() => onViewDetails && onViewDetails(batch.id)}
            activeOpacity={0.8}
          >
            <Icon name="visibility" size={20} color="#808080" />
          </TouchableOpacity>
        );
      case 'approved':
        return (
          <TouchableOpacity 
            style={[styles.iconButton, styles.cardBorder]}
            onPress={() => onDownloadReport && onDownloadReport(batch.id)}
            activeOpacity={0.8}
          >
            <Icon name="download" size={20} color="#808080" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.batchCard, styles.cardBorder]}>
      <View style={styles.batchCardHeader}>
        <Image 
          source={{ uri: batch.image }}
          style={styles.batchImage}
        />
        <View style={styles.batchInfo}>
          <Text style={styles.batchName}>{batch.name}</Text>
          <Text style={styles.batchType}>{batch.type}</Text>
        </View>
      </View>
      
      <View style={[styles.batchStatus, { backgroundColor: statusConfig.backgroundColor }]}>
        <Text style={[styles.batchStatusText, { color: statusConfig.textColor }]}>
          {statusConfig.label}
        </Text>
      </View>
      
      <View style={styles.batchDetails}>
        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Farmer:</Text>
          <Text style={styles.batchDetailValue}>{batch.farmer}</Text>
        </View>
        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Region:</Text>
          <Text style={styles.batchDetailValue}>{batch.region}</Text>
        </View>
        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>
            {batch.status === 'approved' ? 'Completed:' : 'Received:'}
          </Text>
          <Text style={styles.batchDetailValue}>{batch.received}</Text>
        </View>
      </View>
      
      <View style={styles.batchActions}>
        {getActionButton()}
        {getSecondaryAction()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 12,
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  batchCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  batchType: {
    fontSize: 14,
    color: '#4B5563',
  },
  batchStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  batchDetails: {
    marginBottom: 12,
  },
  batchDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchDetailLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  batchDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBg: {
    backgroundColor: '#00BFFF',
  },
  greenBg: {
    backgroundColor: '#22C55E',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BatchCard;
