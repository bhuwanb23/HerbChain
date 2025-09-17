import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REGION_FILTERS, DATE_RANGE_FILTERS } from '../constants';

const SearchFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  selectedRegion, 
  setSelectedRegion, 
  selectedDateRange, 
  setSelectedDateRange, 
  onSearch 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Search Records</Text>
      <View style={styles.searchFilterCard}>
        <View style={styles.mb4}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={16} color="#808080" style={styles.searchInputIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by herb type (e.g., Tulsi)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.gridContainerSmall}>
          <View style={styles.selectContainer}>
            <TextInput
              style={styles.selectInput}
              value={selectedRegion}
              onChangeText={setSelectedRegion}
              placeholder="All Regions"
            />
          </View>
          <View style={styles.selectContainer}>
            <TextInput
              style={styles.selectInput}
              value={selectedDateRange}
              onChangeText={setSelectedDateRange}
              placeholder="Date Range"
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => onSearch && onSearch({ searchQuery, selectedRegion, selectedDateRange })}
          style={styles.searchButton}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>Search Archive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  mb4: {
    marginBottom: 16,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    color: '#111827',
    fontSize: 14,
  },
  gridContainerSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  selectContainer: {
    flex: 1,
  },
  selectInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    color: '#111827',
    fontSize: 14,
  },
  searchButton: {
    width: '100%',
    backgroundColor: '#00BFFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default SearchFilters;
