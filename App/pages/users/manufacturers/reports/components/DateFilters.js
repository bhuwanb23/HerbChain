import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DATE_FILTER_OPTIONS } from '../constants/reportsConstants';

const DateFilters = ({
  selectedDateFilter,
  onSelectDateFilter,
  currentDateRange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Period</Text>
        <Icon name="calendar_today" size={20} color="#2563eb" />
      </View>
      <View style={styles.filterButtonsContainer}>
        {DATE_FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              selectedDateFilter === option.id && styles.activeFilterButton,
            ]}
            onPress={() => onSelectDateFilter(option.id)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedDateFilter === option.id && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.dateRangeText}>{currentDateRange}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8, // gap-2
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#f3f4f6', // gray-100
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2563eb', // blue-600
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563', // gray-700
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  dateRangeText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default DateFilters;