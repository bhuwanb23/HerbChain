import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const BottomNavbar = ({ navigation, activeTab }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: '🏠',
      activeIcon: '🏠',
    },
    {
      id: 'batches',
      label: 'Batches',
      icon: '📦',
      activeIcon: '📦',
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: '🧪',
      activeIcon: '🧪',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📊',
      activeIcon: '📊',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      activeIcon: '👤',
    },
  ];

  const handleTabPress = (tabId) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(tabId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabIcon,
              activeTab === tab.id && styles.activeTabIcon
            ]}>
              {activeTab === tab.id ? tab.activeIcon : tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

export default BottomNavbar;
