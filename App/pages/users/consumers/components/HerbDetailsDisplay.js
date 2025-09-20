import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HerbDetailsDisplay = ({ herbData, ownershipHistory, currentOwner, onShare }) => {
  if (!herbData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>No herb data available</Text>
      </View>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'testing': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'testing': return 'time';
      case 'rejected': return 'close-circle';
      case 'pending': return 'hourglass';
      default: return 'help-circle';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.herbName}>{herbData.species_name || 'Unknown Herb'}</Text>
          <Text style={styles.batchId}>Batch ID: {herbData.batch_id}</Text>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(herbData.quality_status)} 
              size={16} 
              color={getStatusColor(herbData.quality_status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(herbData.quality_status) }]}>
              {herbData.quality_status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Ionicons name="share-outline" size={24} color="#87A96B" />
        </TouchableOpacity>
      </View>

      {/* Basic Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Species:</Text>
          <Text style={styles.infoValue}>{herbData.species_name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weight:</Text>
          <Text style={styles.infoValue}>{herbData.weight_kg ? `${herbData.weight_kg} kg` : 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Harvest Date:</Text>
          <Text style={styles.infoValue}>{formatDate(herbData.harvest_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{herbData.location || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>{formatDate(herbData.created_at)}</Text>
        </View>
      </View>

      {/* Current Owner Card */}
      {currentOwner && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Owner</Text>
          <View style={styles.ownerInfo}>
            <View style={styles.ownerAvatar}>
              <Ionicons name="person" size={24} color="#87A96B" />
            </View>
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{currentOwner.name || 'Unknown'}</Text>
              <Text style={styles.ownerRole}>{currentOwner.role?.toUpperCase() || 'UNKNOWN'}</Text>
              <Text style={styles.ownerLocation}>{currentOwner.location || 'N/A'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ownership History Card */}
      {ownershipHistory && ownershipHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ownership History</Text>
          <View style={styles.timeline}>
            {ownershipHistory.map((transfer, index) => (
              <View key={transfer.transfer_id || index} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Ionicons name="swap-horizontal" size={16} color="#87A96B" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    {transfer.transfer_reason || 'Ownership Transfer'}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(transfer.transfer_date)}
                  </Text>
                  <Text style={styles.timelineLocation}>
                    {transfer.location || 'N/A'}
                  </Text>
                  {transfer.notes && (
                    <Text style={styles.timelineNotes}>{transfer.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quality Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quality Information</Text>
        <View style={styles.qualityGrid}>
          <View style={styles.qualityItem}>
            <Ionicons name="shield-checkmark" size={24} color="#87A96B" />
            <Text style={styles.qualityLabel}>Status</Text>
            <Text style={[styles.qualityValue, { color: getStatusColor(herbData.quality_status) }]}>
              {herbData.quality_status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
          <View style={styles.qualityItem}>
            <Ionicons name="leaf" size={24} color="#87A96B" />
            <Text style={styles.qualityLabel}>Species</Text>
            <Text style={styles.qualityValue}>{herbData.species_name || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Verification Badge */}
      <View style={styles.verificationCard}>
        <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        <Text style={styles.verificationTitle}>Verified Authentic</Text>
        <Text style={styles.verificationSubtitle}>
          This herb batch has been verified through our blockchain traceability system
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleSection: {
    flex: 1,
  },
  herbName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  batchId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ownerRole: {
    fontSize: 12,
    color: '#87A96B',
    fontWeight: '600',
    marginBottom: 2,
  },
  ownerLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: '#87A96B',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  qualityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityItem: {
    alignItems: 'center',
    flex: 1,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  qualityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  verificationCard: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default HerbDetailsDisplay;
