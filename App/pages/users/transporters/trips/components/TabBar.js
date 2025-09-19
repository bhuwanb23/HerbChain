import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const TabBar = ({ current, onChange, tabs }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {tabs.map(tab => {
          const isActive = current === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tab, isActive && styles.activeTab]} onPress={() => onChange(tab.key)}>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});


