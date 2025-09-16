import { useState, useEffect, useMemo } from 'react';
import { MOCK_TRIPS, DEFAULT_FILTERS } from '../constants';

export const useHistoryData = () => {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, status: 'completed' });
  const [isLoading, setIsLoading] = useState(false);

  // Filter trips based on current filters
  const filteredTrips = useMemo(() => {
    let filtered = [...MOCK_TRIPS];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(trip => trip.status === filters.status);
    }

    // Filter by herb type
    if (filters.herbType !== 'all') {
      filtered = filtered.filter(trip => 
        trip.herbType.toLowerCase() === filters.herbType.toLowerCase()
      );
    }

    // Filter by date range (simplified implementation)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let daysBack = 0;
      
      switch (filters.dateRange) {
        case '7days':
          daysBack = 7;
          break;
        case '30days':
          daysBack = 30;
          break;
        case '90days':
          daysBack = 90;
          break;
        default:
          daysBack = 0;
      }

      if (daysBack > 0) {
        const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.date);
          return tripDate >= cutoffDate;
        });
      }
    }

    return filtered;
  }, [filters]);

  // Calculate statistics from filtered trips
  const statistics = useMemo(() => {
    const total = filteredTrips.length;
    const completed = filteredTrips.filter(trip => trip.status === 'completed').length;
    const inTransit = filteredTrips.filter(trip => trip.status === 'in_transit').length;
    const rejected = filteredTrips.filter(trip => trip.status === 'rejected').length;
    
    const avgRating = filteredTrips.length > 0 
      ? (filteredTrips.reduce((sum, trip) => sum + trip.rating, 0) / filteredTrips.length).toFixed(1)
      : 0;

    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return {
      total,
      completed,
      inTransit,
      rejected,
      avgRating,
      successRate: parseFloat(successRate),
    };
  }, [filteredTrips]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Simulate data loading
  const loadMoreTrips = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In a real app, you would fetch more data here
  };

  // Export data (simplified)
  const exportData = () => {
    // In a real app, you would generate and download a CSV/PDF
    console.log('Exporting trip data:', filteredTrips);
    alert('Export functionality would be implemented here');
  };

  return {
    trips: filteredTrips,
    filters,
    statistics,
    isLoading,
    handleFilterChange,
    resetFilters,
    loadMoreTrips,
    exportData,
  };
};
