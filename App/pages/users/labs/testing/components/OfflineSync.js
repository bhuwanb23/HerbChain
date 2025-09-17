import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SYNC_STATUSES, MOCK_OFFLINE_DATA, COLORS } from '../constants';

const SyncStatusBadge = ({ status }) => {
  const statusConfig = SYNC_STATUSES.find(s => s.id === status) || SYNC_STATUSES[0];
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
      <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
      <Text style={[styles.statusText, { color: statusConfig.color }]}>
        {statusConfig.title}
      </Text>
    </View>
  );
};

const OfflineEntryCard = ({ entry, onSync, onRetry, onDelete }) => {
  const getStatusColor = (status) => {
    const statusConfig = SYNC_STATUSES.find(s => s.id === status);
    return statusConfig ? statusConfig.color : '#6B7280';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionButton = () => {
    switch (entry.status) {
      case 'pending':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.syncButton]}
            onPress={() => onSync(entry.id)}
          >
            <Ionicons name="sync-outline" size={16} color="#FFFFFF" />
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        );
      case 'syncing':
        return (
          <View style={[styles.actionButton, styles.syncingButton]}>
            <Ionicons name="sync" size={16} color="#3B82F6" />
            <Text style={styles.syncingButtonText}>Syncing...</Text>
          </View>
        );
      case 'failed':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.retryButton]}
            onPress={() => onRetry(entry.id)}
          >
            <Ionicons name="refresh-outline" size={16} color="#EF4444" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        );
      case 'completed':
        return (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.completedButtonText}>Synced</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <Text style={styles.batchId}>#{entry.batchId}</Text>
          <Text style={styles.batchName}>{entry.batchName}</Text>
        </View>
        <SyncStatusBadge status={entry.status} />
      </View>
      
      <View style={styles.entryDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{formatTimestamp(entry.timestamp)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="flask-outline" size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {Object.keys(entry.testResults).length} test results
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="document-outline" size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {entry.files.length} file(s) attached
          </Text>
        </View>
      </View>

      <View style={styles.entryActions}>
        {getActionButton()}
        
        {entry.status !== 'syncing' && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Entry',
                'Are you sure you want to delete this offline entry?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const SyncSummary = ({ offlineData }) => {
  const pendingCount = offlineData.filter(entry => entry.status === 'pending').length;
  const syncingCount = offlineData.filter(entry => entry.status === 'syncing').length;
  const completedCount = offlineData.filter(entry => entry.status === 'completed').length;
  const failedCount = offlineData.filter(entry => entry.status === 'failed').length;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Sync Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#3B82F6' }]}>{syncingCount}</Text>
          <Text style={styles.summaryLabel}>Syncing</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>{failedCount}</Text>
          <Text style={styles.summaryLabel}>Failed</Text>
        </View>
      </View>
    </View>
  );
};

const OfflineSync = ({ 
  offlineData, 
  onSyncAll, 
  onSyncEntry, 
  onRetrySync, 
  onDeleteEntry 
}) => {
  const hasPendingEntries = offlineData.some(entry => entry.status === 'pending');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Offline Sync</Text>
          <Text style={styles.subtitle}>
            Manage your offline test results and sync them when connected.
          </Text>
        </View>

        <SyncSummary offlineData={offlineData} />

        {hasPendingEntries && (
          <View style={styles.syncAllContainer}>
            <TouchableOpacity 
              style={styles.syncAllButton}
              onPress={onSyncAll}
            >
              <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
              <Text style={styles.syncAllButtonText}>Sync All Pending</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.entriesContainer}>
          <Text style={styles.entriesTitle}>Offline Entries</Text>
          
          {offlineData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Offline Data</Text>
              <Text style={styles.emptyStateText}>
                Test results saved offline will appear here for syncing.
              </Text>
            </View>
          ) : (
            offlineData.map((entry) => (
              <OfflineEntryCard
                key={entry.id}
                entry={entry}
                onSync={onSyncEntry}
                onRetry={onRetrySync}
                onDelete={onDeleteEntry}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncAllContainer: {
    marginBottom: 20,
  },
  syncAllButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  syncAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesContainer: {
    marginBottom: 20,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  batchName: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  syncingButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  syncingButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  retryButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  completedButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});

export default OfflineSync;
