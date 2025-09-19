import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLabBatches } from './hooks/useLabBatches';
import { LabBatchList } from './components';

const BatchesPage = ({ navigation }) => {
  const [tab, setTab] = useState('all'); // 'all' | 'accepted'
  const { all, accepted, loading, refresh, acceptHerb } = useLabBatches();

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.activeTab]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.activeTabText]}>Batch List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'accepted' && styles.activeTab]} onPress={() => setTab('accepted')}>
          <Text style={[styles.tabText, tab === 'accepted' && styles.activeTabText]}>Accepted Batches</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {tab === 'all' ? (
          <LabBatchList data={all} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} />
        ) : (
          <LabBatchList data={accepted} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  tabText: {
    color: '#111827',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#ffffff',
  },
});

export default BatchesPage;
