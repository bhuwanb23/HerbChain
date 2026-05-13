/**
 * Common chrome for v1 role home screens: header with the user's name + role,
 * a logout button, and a scrollable content area.
 */
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import SafeAreaWrapper from './SafeAreaWrapper';

const ROLE_COLOR = {
  farmer: '#10B981',
  transporter: '#0EA5E9',
  lab: '#8B5CF6',
  manufacturer: '#F97316',
  consumer: '#22C55E',
  admin: '#F59E0B',
};

export default function RoleHomeShell({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  children,
}) {
  const { user, logout } = useAuth();
  const color = ROLE_COLOR[user?.role] || '#10B981';

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaWrapper style={styles.container} includeBottom>
      <View style={[styles.header, { backgroundColor: color }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.role}>
            {user?.role ? user.role.toUpperCase() : ''}
          </Text>
          <Text style={styles.title}>{title || `Hi, ${user?.name || ''}`}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  role: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.85,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#FFFFFF', fontSize: 13, marginTop: 2, opacity: 0.9 },
  logout: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 999,
  },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 64 },
});
