/**
 * UserManagement — admin screen for managing all users across roles.
 * Uses AdminAPI.users from the new backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { AdminAPI } from '../../../services/apiClient';
import { useAuth } from '../../../contexts/AuthContext';

const ROLES = ['All', 'farmer', 'transporter', 'lab', 'manufacturer', 'admin'];
const STATUSES = ['All', 'active', 'suspended', 'pending', 'rejected'];
const STATUS_COLORS = { active: '#10B981', suspended: '#EF4444', pending: '#F59E0B', rejected: '#6B7280' };

export default function UserManagement({ navigation }) {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const opts = { limit: 100 };
      if (roleFilter !== 'All') opts.role = roleFilter;
      if (statusFilter !== 'All') opts.status = statusFilter;
      if (search.trim()) opts.q = search.trim();
      const data = await AdminAPI.users(accessToken, opts);
      setUsers(data?.users || data || []);
    } catch (_) { setUsers([]); }
  }, [accessToken, roleFilter, statusFilter, search]);

  useEffect(() => { setLoading(true); fetchUsers().finally(() => setLoading(false)); }, [fetchUsers]);

  const onRefresh = async () => { setRefreshing(true); await fetchUsers(); setRefreshing(false); };

  const suspendUser = async (userId) => {
    Alert.alert('Suspend User', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: async () => {
        try { await AdminAPI.suspendUser(accessToken, userId); fetchUsers(); } catch (_) {}
      }},
    ]);
  };

  const activateUser = async (userId) => {
    try { await AdminAPI.activateUser(accessToken, userId); fetchUsers(); } catch (_) {}
  };

  // ─── User Detail ───
  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>User Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.detailCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(selected.full_name || 'U').charAt(0)}</Text></View>
          <Text style={styles.detailName}>{selected.full_name || '-'}</Text>
          <Text style={styles.detailEmail}>{selected.email || '-'}</Text>
          <InfoRow label="Role" value={selected.role} />
          <InfoRow label="Status" value={selected.status || 'active'} />
          <InfoRow label="Phone" value={selected.phone || '-'} />
          <InfoRow label="Created" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'} />

          <View style={styles.actionRow}>
            {selected.status !== 'suspended' ? (
              <TouchableOpacity style={styles.dangerBtn} onPress={() => suspendUser(selected.id)}>
                <Text style={styles.dangerBtnText}>Suspend</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.successBtn} onPress={() => activateUser(selected.id)}>
                <Text style={styles.successBtnText}>Activate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ─── User List ───
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
        placeholder="Search by name or email..." />

      <FlatList
        horizontal
        data={ROLES}
        keyExtractor={(r) => r}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filterChip, roleFilter === item && styles.filterChipActive]}
            onPress={() => setRoleFilter(item)}>
            <Text style={[styles.filterText, roleFilter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userCard} onPress={() => setSelected(item)}>
              <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{(item.full_name || 'U').charAt(0)}</Text></View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name || '-'}</Text>
                <Text style={styles.userEmail}>{item.email || item.phone || '-'}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userRole}>{item.role}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }]}>
                    <Text style={styles.statusText}>{item.status || 'active'}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  searchInput: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  filterChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  userRole: { fontSize: 12, color: '#3B82F6', fontWeight: '600', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  detailCard: { backgroundColor: '#FFF', margin: 12, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  detailName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailEmail: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  dangerBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  dangerBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
  successBtn: { flex: 1, backgroundColor: '#D1FAE5', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  successBtnText: { color: '#059669', fontSize: 14, fontWeight: '700' },
});
