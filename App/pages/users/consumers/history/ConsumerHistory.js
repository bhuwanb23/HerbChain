import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const ConsumerHistory = ({ navigation, onNavigate }) => {
  const { t } = useGlobalTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const scanHistory = [
    {
      id: 1,
      herbName: 'Ashwagandha',
      batchId: 'HERB-ASH-001',
      scanDate: '2024-10-20',
      scanTime: '2:30 PM',
      status: 'Verified',
      farmer: 'Rajesh Kumar',
      location: 'Rajasthan, India',
      icon: 'leaf',
      statusColor: COLORS.sage
    },
    {
      id: 2,
      herbName: 'Turmeric Powder',
      batchId: 'HERB-TUR-003',
      scanDate: '2024-10-19',
      scanTime: '10:15 AM',
      status: 'Verified',
      farmer: 'Priya Sharma',
      location: 'Kerala, India',
      icon: 'leaf',
      statusColor: COLORS.sage
    },
    {
      id: 3,
      herbName: 'Ginger Root',
      batchId: 'HERB-GIN-002',
      scanDate: '2024-10-17',
      scanTime: '4:45 PM',
      status: 'Verified',
      farmer: 'Amit Patel',
      location: 'Gujarat, India',
      icon: 'leaf',
      statusColor: COLORS.sage
    },
    {
      id: 4,
      herbName: 'Holy Basil',
      batchId: 'HERB-HB-005',
      scanDate: '2024-10-15',
      scanTime: '11:20 AM',
      status: 'Pending',
      farmer: 'Sunita Devi',
      location: 'Uttarakhand, India',
      icon: 'leaf',
      statusColor: COLORS.earthBrown
    },
    {
      id: 5,
      herbName: 'Neem Leaves',
      batchId: 'HERB-NEM-001',
      scanDate: '2024-10-12',
      scanTime: '3:10 PM',
      status: 'Verified',
      farmer: 'Ravi Kumar',
      location: 'Tamil Nadu, India',
      icon: 'leaf',
      statusColor: COLORS.sage
    },
    {
      id: 6,
      herbName: 'Brahmi',
      batchId: 'HERB-BRA-004',
      scanDate: '2024-10-10',
      scanTime: '9:30 AM',
      status: 'Verified',
      farmer: 'Meera Singh',
      location: 'Madhya Pradesh, India',
      icon: 'leaf',
      statusColor: COLORS.sage
    }
  ];

  const filters = [
    { id: 'all', label: t.consumer?.all || 'All', count: scanHistory.length },
    { id: 'verified', label: t.consumer?.verified || 'Verified', count: scanHistory.filter(item => item.status === 'Verified').length },
    { id: 'pending', label: t.consumer?.pending || 'Pending', count: scanHistory.filter(item => item.status === 'Pending').length },
    { id: 'recent', label: t.consumer?.recent || 'Recent', count: scanHistory.filter(item => new Date(item.scanDate) > new Date('2024-10-18')).length }
  ];

  const getFilteredHistory = () => {
    let filtered = scanHistory;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.herbName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'verified':
        filtered = filtered.filter(item => item.status === 'Verified');
        break;
      case 'pending':
        filtered = filtered.filter(item => item.status === 'Pending');
        break;
      case 'recent':
        filtered = filtered.filter(item => new Date(item.scanDate) > new Date('2024-10-18'));
        break;
      default:
        break;
    }

    return filtered;
  };

  const handleItemPress = (item) => {
    // Navigate to traceability screen with the specific batch
    onNavigate('traceability');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredHistory = getFilteredHistory();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.consumer?.scanHistory || 'Scan History'}</Text>
        <Text style={styles.headerSubtitle}>{t.consumer?.trackAllVerifications || 'Track all your herb verifications'}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.consumer?.searchPlaceholder || "Search herbs, batches, or farmers..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray[500]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              selectedFilter === filter.id && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter.id && styles.activeFilterTabText
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History List */}
      <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.historyItemHeader}>
                <View style={styles.herbInfo}>
                  <View style={[styles.herbIcon, { backgroundColor: `${item.statusColor}20` }]}>
                    <Ionicons name={item.icon} size={24} color={item.statusColor} />
                  </View>
                  <View style={styles.herbDetails}>
                    <Text style={styles.herbName}>{item.herbName}</Text>
                    <Text style={styles.batchId}>Batch: {item.batchId}</Text>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${item.statusColor}20` }
                  ]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.historyItemDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.detailText}>Farmer: {item.farmer}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.detailText}>
                    {formatDate(item.scanDate)} at {item.scanTime}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye" size={16} color={COLORS.sage} />
                  <Text style={styles.actionButtonText}>{t.consumer?.viewDetails || 'View Details'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share" size={16} color={COLORS.gray[500]} />
                  <Text style={[styles.actionButtonText, { color: COLORS.gray[500] }]}>{t.consumer?.share || 'Share'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.gray[500]} />
            <Text style={styles.emptyStateTitle}>{t.consumer?.noScanHistoryFound || 'No scan history found'}</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? (t.consumer?.adjustSearchTerms || 'Try adjusting your search terms') : (t.consumer?.startScanningHerbs || 'Start scanning herbs to see your history here')}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => onNavigate('scan')}
              >
                <Text style={styles.scanButtonText}>{t.consumer?.scanYourFirstHerb || 'Scan Your First Herb'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  activeFilterTab: {
    backgroundColor: COLORS.sage,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  activeFilterTabText: {
    color: COLORS.white,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  herbInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  herbIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  herbDetails: {
    flex: 1,
  },
  herbName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  batchId: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.sage,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ConsumerHistory;
