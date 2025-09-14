import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import components
import {
  PerformanceSummary,
  ChartsSection,
  FiltersSection,
  TripHistoryList,
} from './components';

// Import hooks and constants
import { useHistoryData } from './hooks';
import { PERFORMANCE_STATS, WEEKLY_DATA, SUCCESS_RATE } from './constants';

const HistoryScreen = ({ onGoBack }) => {
  const {
    trips,
    filters,
    statistics,
    isLoading,
    handleFilterChange,
    resetFilters,
    loadMoreTrips,
    exportData,
  } = useHistoryData();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Performance Summary Cards */}
          <PerformanceSummary stats={PERFORMANCE_STATS} />

          {/* Charts Section */}
          <ChartsSection 
            weeklyData={WEEKLY_DATA} 
            successRate={SUCCESS_RATE} 
          />

          {/* Filters Section */}
          <FiltersSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
          />

          {/* Trip History List */}
          <TripHistoryList
            trips={trips}
            onExport={exportData}
            onLoadMore={loadMoreTrips}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for bottom navbar
  },
});

export default HistoryScreen;
