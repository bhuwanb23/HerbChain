import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HerbDetailsItem from './HerbDetailsItem';

const HerbList = ({ data, loading, onRefresh, onAdd, onItemPress }) => {
  useEffect(() => {}, [data]);

  const { pendingPickup, others } = useMemo(() => {
    const pendingPickup = Array.isArray(data) ? data.filter(h => h.quality_status === 'pending_pickup') : [];
    const others = Array.isArray(data) ? data.filter(h => h.quality_status !== 'pending_pickup') : [];
    return { pendingPickup, others };
  }, [data]);

  const [tab, setTab] = useState('pending'); // 'pending' | 'accepted'
  const counts = { pending: pendingPickup.length, accepted: others.length };

  const listData = tab === 'pending' ? pendingPickup : others;
  const header = tab === 'pending' ? (
    <LinearGradient colors={["#059669", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Pending Pickup</Text>
      <Text style={styles.sectionSubtitle}>Ready for transporter pickup</Text>
    </LinearGradient>
  ) : (
    <LinearGradient colors={["#0EA5E9", "#38BDF8"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Accepted</Text>
      <Text style={styles.sectionSubtitle}>Other batches in your list</Text>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}> 
          <TouchableOpacity style={[styles.tab, tab === 'pending' && styles.activeTab]} onPress={() => setTab('pending')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'pending' && styles.activeTabText]}>Pending Pickup</Text>
            <View style={[styles.countPill, tab === 'pending' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'pending' && styles.countTextActive]}>{counts.pending}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'accepted' && styles.activeTab]} onPress={() => setTab('accepted')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'accepted' && styles.activeTabText]}>Accepted</Text>
            <View style={[styles.countPill, tab === 'accepted' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'accepted' && styles.countTextActive]}>{counts.accepted}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.batch_id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListHeaderComponent={header}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>{tab === 'pending' ? 'No herbs awaiting pickup.' : 'No other batches.'}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => onItemPress && onItemPress(item)}>
            <HerbDetailsItem batch={item} />
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      />

      <TouchableOpacity style={styles.fab} onPress={onAdd} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  tabsWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    backgroundColor: '#22c55e',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HerbList;


