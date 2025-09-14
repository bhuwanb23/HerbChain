import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

const HistoryRecords = ({ onRecordSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockRecords = [
    {
      id: 'REC-001',
      batchId: 'BATCH-001',
      herbType: 'Ashwagandha',
      farmer: 'Rajesh Kumar',
      region: 'Madhya Pradesh',
      testDate: '2024-01-15',
      status: 'approved',
      qualityScore: 95,
    },
    {
      id: 'REC-002',
      batchId: 'BATCH-002',
      herbType: 'Tulsi',
      farmer: 'Priya Sharma',
      region: 'Uttar Pradesh',
      testDate: '2024-01-14',
      status: 'approved',
      qualityScore: 88,
    },
    {
      id: 'REC-003',
      batchId: 'BATCH-003',
      herbType: 'Neem',
      farmer: 'Amit Singh',
      region: 'Rajasthan',
      testDate: '2024-01-13',
      status: 'rejected',
      qualityScore: 65,
    },
    {
      id: 'REC-004',
      batchId: 'BATCH-004',
      herbType: 'Turmeric',
      farmer: 'Suresh Patel',
      region: 'Gujarat',
      testDate: '2024-01-12',
      status: 'approved',
      qualityScore: 92,
    },
    {
      id: 'REC-005',
      batchId: 'BATCH-005',
      herbType: 'Ginger',
      farmer: 'Meera Devi',
      region: 'Karnataka',
      testDate: '2024-01-11',
      status: 'approved',
      qualityScore: 89,
    },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'ashwagandha', label: 'Ashwagandha' },
    { id: 'tulsi', label: 'Tulsi' },
    { id: 'neem', label: 'Neem' },
  ];

  const filteredRecords = mockRecords.filter(record => {
    const matchesSearch = record.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.herbType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.region.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         record.status === selectedFilter ||
                         record.herbType.toLowerCase() === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History & Records</Text>
      
      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by batch ID, herb type, farmer, or region..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView 
          horizontal 
          style={styles.filterContainer}
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.activeFilterButton
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.activeFilterButtonText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records List */}
      <ScrollView style={styles.recordsContainer}>
        <Text style={styles.resultsCount}>
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
        </Text>
        
        {filteredRecords.map((record) => (
          <TouchableOpacity
            key={record.id}
            style={styles.recordCard}
            onPress={() => onRecordSelect && onRecordSelect(record)}
            activeOpacity={0.7}
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordId}>{record.batchId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.herbType}>{record.herbType}</Text>
            
            <View style={styles.recordDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>👨‍🌾 Farmer:</Text>
                <Text style={styles.detailValue}>{record.farmer}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Region:</Text>
                <Text style={styles.detailValue}>{record.region}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Test Date:</Text>
                <Text style={styles.detailValue}>{record.testDate}</Text>
              </View>
            </View>
            
            <View style={styles.qualitySection}>
              <Text style={styles.qualityLabel}>Quality Score:</Text>
              <Text style={[styles.qualityScore, { color: getQualityColor(record.qualityScore) }]}>
                {record.qualityScore}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {filteredRecords.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No records found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filter criteria</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  recordsContainer: {
    maxHeight: 500,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  herbType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  qualitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  qualityScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default HistoryRecords;
