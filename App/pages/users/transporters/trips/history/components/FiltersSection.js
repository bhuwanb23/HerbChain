import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FiltersSection = ({ filters, onFilterChange, onResetFilters }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const dateRangeOptions = [
    { label: 'Date Range', value: 'all' },
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' },
  ];

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const herbTypeOptions = [
    { label: 'All Herb Types', value: 'all' },
    { label: 'Ginseng', value: 'ginseng' },
    { label: 'Turmeric', value: 'turmeric' },
    { label: 'Ashwagandha', value: 'ashwagandha' },
    { label: 'Ginkgo', value: 'ginkgo' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onResetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersGrid}>
          {/* Date Range Filter */}
          <View style={styles.filterItem}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.dateRange}
                onValueChange={(value) => onFilterChange('dateRange', value)}
                style={styles.picker}
              >
                {dateRangeOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Herb Type Filter */}
          <View style={styles.filterItem}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.herbType}
                onValueChange={(value) => onFilterChange('herbType', value)}
                style={styles.picker}
              >
                {herbTypeOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Status locked to completed - hidden for cleaner UI */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  filtersGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
  },
  fullWidthFilter: {
    width: '100%',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    color: '#111827',
  },
});

export default FiltersSection;
