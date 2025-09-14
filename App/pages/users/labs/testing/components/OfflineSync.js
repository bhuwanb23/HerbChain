import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

const OfflineSync = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingResults, setPendingResults] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Simulate network status check
    const checkNetworkStatus = () => {
      // In real app, this would check actual network connectivity
      const online = Math.random() > 0.3; // 70% chance of being online
      setIsOnline(online);
    };

    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const mockPendingResults = [
    {
      id: 'OFFLINE-001',
      batchId: 'BATCH-001',
      herbType: 'Ashwagandha',
      farmer: 'Rajesh Kumar',
      testResults: {
        moistureContent: 8.5,
        pesticideResidue: 0.02,
        phytochemicalLevel: 95.2,
      },
      timestamp: '2024-01-15 14:30',
      status: 'pending',
    },
    {
      id: 'OFFLINE-002',
      batchId: 'BATCH-002',
      herbType: 'Tulsi',
      farmer: 'Priya Sharma',
      testResults: {
        moistureContent: 7.2,
        pesticideResidue: 0.01,
        phytochemicalLevel: 88.5,
      },
      timestamp: '2024-01-15 16:45',
      status: 'pending',
    },
  ];

  const handleSyncAll = () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    
    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false);
      setPendingResults([]);
      onSyncComplete && onSyncComplete();
      Alert.alert('Success', 'All pending results have been synced successfully!');
    }, 3000);
  };

  const handleSyncIndividual = (resultId) => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    
    // Simulate individual sync
    setTimeout(() => {
      setIsSyncing(false);
      setPendingResults(prev => prev.filter(result => result.id !== resultId));
      Alert.alert('Success', 'Result synced successfully!');
    }, 1500);
  };

  const displayPendingResults = pendingResults.length > 0 ? pendingResults : mockPendingResults;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Sync</Text>
      
      <View style={styles.networkStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusIcon}>{isOnline ? '🟢' : '🔴'}</Text>
        </View>
        <Text style={styles.statusText}>
          {isOnline ? 'Online - Ready to sync' : 'Offline - Results stored locally'}
        </Text>
      </View>

      <View style={styles.syncActions}>
        <TouchableOpacity
          style={[
            styles.syncAllButton,
            (!isOnline || isSyncing || displayPendingResults.length === 0) && styles.syncAllButtonDisabled
          ]}
          onPress={handleSyncAll}
          disabled={!isOnline || isSyncing || displayPendingResults.length === 0}
        >
          <Text style={[
            styles.syncAllButtonText,
            (!isOnline || isSyncing || displayPendingResults.length === 0) && styles.syncAllButtonTextDisabled
          ]}>
            {isSyncing ? '🔄 Syncing...' : '📤 Sync All Results'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.pendingCount}>
          {displayPendingResults.length} pending result{displayPendingResults.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.pendingResultsContainer}>
        <Text style={styles.sectionTitle}>Pending Results</Text>
        
        {displayPendingResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateText}>No pending results</Text>
            <Text style={styles.emptyStateSubtext}>All results have been synced</Text>
          </View>
        ) : (
          displayPendingResults.map((result) => (
            <View key={result.id} style={styles.pendingResultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultId}>{result.id}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>
              
              <Text style={styles.batchId}>Batch: {result.batchId}</Text>
              <Text style={styles.herbType}>{result.herbType}</Text>
              <Text style={styles.farmer}>👨‍🌾 {result.farmer}</Text>
              
              <View style={styles.testResults}>
                <Text style={styles.testResultsTitle}>Test Results:</Text>
                <Text style={styles.testResult}>Moisture: {result.testResults.moistureContent}%</Text>
                <Text style={styles.testResult}>Pesticide: {result.testResults.pesticideResidue}ppm</Text>
                <Text style={styles.testResult}>Phytochemical: {result.testResults.phytochemicalLevel}%</Text>
              </View>
              
              <Text style={styles.timestamp}>📅 {result.timestamp}</Text>
              
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  (!isOnline || isSyncing) && styles.syncButtonDisabled
                ]}
                onPress={() => handleSyncIndividual(result.id)}
                disabled={!isOnline || isSyncing}
              >
                <Text style={[
                  styles.syncButtonText,
                  (!isOnline || isSyncing) && styles.syncButtonTextDisabled
                ]}>
                  {isSyncing ? '🔄' : '📤'} Sync
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  syncActions: {
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
  syncAllButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  syncAllButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  syncAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  syncAllButtonTextDisabled: {
    color: '#6B7280',
  },
  pendingCount: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pendingResultsContainer: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  pendingResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  batchId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  herbType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  farmer: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  testResults: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  testResultsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  testResult: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  syncButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  syncButtonTextDisabled: {
    color: '#6B7280',
  },
});

export default OfflineSync;
