import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabButtons}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.id && styles.activeTabButtonText
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  tabButtons: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 16,
    marginRight: 24,
  },
  tabButtonText: {
    fontSize: 16,
    color: '#808080',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#00BFFF',
  },
  activeTabButtonText: {
    color: '#00BFFF',
    fontWeight: '600',
  },
});

export default TabNavigation;
