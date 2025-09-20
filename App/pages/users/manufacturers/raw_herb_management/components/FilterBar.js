import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FILTER_OPTIONS } from '../constants/rawHerbConstants';

const FilterBar = ({ selectedFilter, onSelectFilter }) => {
  return (
    <View style={styles.filterBarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.filterButton, selectedFilter === option.id && styles.selectedFilterButton]}
            onPress={() => onSelectFilter(option.id)}
          >
            <Text style={[styles.filterButtonText, selectedFilter === option.id && styles.selectedFilterButtonText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    columnGap: 8, // space-x-2 equivalent
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 9999, // rounded-full
  },
  selectedFilterButton: {
    backgroundColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
});

export default FilterBar;