import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'payment', label: 'Payments', icon: '💰' },
    { id: 'lab', label: 'Lab Tests', icon: '🧪' },
    { id: 'logistics', label: 'Logistics', icon: '🚚' },
    { id: 'policy', label: 'AYUSH', icon: '📢' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.activeFilterButton,
            ]}
            onPress={() => onFilterChange(filter.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.activeFilterText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#2563EB',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterText: {
    color: 'white',
  },
});

export default FilterTabs;
