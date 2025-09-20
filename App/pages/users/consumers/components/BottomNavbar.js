import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const BottomNavbar = ({ currentPage, onNavigate }) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      id: 'traceability',
      label: 'Trace',
      icon: 'search-outline',
      activeIcon: 'search',
    },
    {
      id: 'history',
      label: 'History',
      icon: 'time-outline',
      activeIcon: 'time',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
    },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavigate(item.id)}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={24}
              color={isActive ? COLORS.sage : COLORS.gray[500]}
            />
            <Text
              style={[
                styles.navLabel,
                { color: isActive ? COLORS.sage : COLORS.gray[500] },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default BottomNavbar;
