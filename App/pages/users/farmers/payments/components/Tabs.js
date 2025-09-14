import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TAB_TYPES } from '../constants';

const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: TAB_TYPES.PENDING, label: 'Pending Payments' },
    { id: TAB_TYPES.COMPLETED, label: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
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
    paddingHorizontal: 16,
    marginTop: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
});

export default Tabs;
