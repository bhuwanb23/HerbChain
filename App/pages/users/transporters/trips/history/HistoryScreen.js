import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import components
import {
  FiltersSection,
  TripHistoryList,
} from './components';

// Import hooks and constants
import { useHistoryData } from './hooks';

const HistoryScreen = ({ onGoBack }) => {
  const {
    trips,
    filters,
    isLoading,
    handleFilterChange,
    resetFilters,
    loadMoreTrips,
    exportData,
  } = useHistoryData();
  const [selectedTrip, setSelectedTrip] = React.useState(null);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onGoBack && onGoBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#111827" />
            <Text style={styles.headerTitle}>History & Reports</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filters Section */}
          <FiltersSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
          />

          {/* Trip History List (Completed only) */}
          <TripHistoryList
            trips={trips.filter(t => t.status === 'completed')}
            onExport={exportData}
            onLoadMore={loadMoreTrips}
            onSelectTrip={setSelectedTrip}
          />

          {selectedTrip && (
            <View style={styles.detailsModal}>
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <Text style={styles.detailsTitle}>Trip Details</Text>
                  <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                    <Icon name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.detailsContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Trip Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Trip ID:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.status}</Text>
                    </View>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Route Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Route:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.route}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Herb Type:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.herbType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>{selectedTrip.duration}</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for bottom navbar
  },
  detailsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  detailsContent: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});

export default HistoryScreen;
