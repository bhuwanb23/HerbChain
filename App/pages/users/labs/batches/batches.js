import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLabBatches } from './hooks/useLabBatches';
import { LabBatchList } from './components';

const BatchesPage = ({ navigation }) => {
  const [tab, setTab] = useState('all'); // 'all' | 'accepted' | 'archived'
  const { all, accepted, archived, loading, refresh, acceptHerb } = useLabBatches();

  const counts = {
    all: Array.isArray(all) ? all.length : 0,
    accepted: Array.isArray(accepted) ? accepted.length : 0,
    archived: Array.isArray(archived) ? archived.length : 0,
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#22c55e", "#16a34a"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Lab Batches</Text>
        <Text style={styles.headerSubtitle}>Browse, accept, and archive incoming herbs</Text>
      </LinearGradient>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'all' && styles.activeTab]} onPress={() => setTab('all')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'all' && styles.activeTabText]}>Batch List</Text>
            <View style={[styles.countPill, tab === 'all' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'all' && styles.countTextActive]}>{counts.all}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'accepted' && styles.activeTab]} onPress={() => setTab('accepted')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'accepted' && styles.activeTabText]}>Accepted</Text>
            <View style={[styles.countPill, tab === 'accepted' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'accepted' && styles.countTextActive]}>{counts.accepted}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'archived' && styles.activeTab]} onPress={() => setTab('archived')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'archived' && styles.activeTabText]}>Archived</Text>
            <View style={[styles.countPill, tab === 'archived' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'archived' && styles.countTextActive]}>{counts.archived}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listWrap}>
        {tab === 'all' ? (
          <LabBatchList data={all} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} />
        ) : tab === 'accepted' ? (
          <LabBatchList data={accepted} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} />
        ) : (
          <LabBatchList data={archived} loading={loading} onRefresh={refresh} />
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
  headerGradient: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  tabsWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#111827',
  },
  tabText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
  },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  countPillActive: {
    backgroundColor: '#1F2937',
  },
  countText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});

export default BatchesPage;
