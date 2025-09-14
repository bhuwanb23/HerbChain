import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AdminBottomNavbar = ({ currentPage, onPageChange }) => {
  const insets = useSafeAreaInsets();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      page: 'dashboard',
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'people',
      page: 'users',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'verified-user',
      page: 'compliance',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'assessment',
      page: 'reports',
    },
    {
      id: 'integration',
      label: 'Integration',
      icon: 'api',
      page: 'integration',
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.navContent}>
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.activeNavItem]}
                onPress={() => onPageChange(item.page)}
                activeOpacity={0.7}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  color={isActive ? '#059669' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.activeNavLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  gradient: {
    paddingTop: 8,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  activeNavItem: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  navLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#059669',
    fontWeight: '600',
  },
});

export default AdminBottomNavbar;
