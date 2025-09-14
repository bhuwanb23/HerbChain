import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TripHistoryList = ({ trips, onExport, onLoadMore }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'in_transit':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_transit':
        return 'schedule';
      case 'rejected':
        return 'error';
      default:
        return 'help';
    }
  };

  const renderTripItem = (trip) => {
    const statusColors = getStatusColor(trip.status);
    const statusIcon = getStatusIcon(trip.status);

    return (
      <TouchableOpacity
        key={trip.id}
        style={styles.tripItem}
        onPress={() => setSelectedTrip(trip)}
        activeOpacity={0.7}
      >
        <View style={styles.tripContent}>
          <View style={styles.tripInfo}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripId}>{trip.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Icon name={statusIcon} size={12} color={statusColors.text} />
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1).replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.routeText}>{trip.route}</Text>
            <Text style={styles.herbText}>{trip.herbType} • {trip.date}</Text>
          </View>
          <View style={styles.tripActions}>
            <Text style={styles.durationText}>{trip.duration}</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Icon 
                name={trip.status === 'completed' ? 'download' : trip.status === 'in_transit' ? 'schedule' : 'info'} 
                size={14} 
                color={trip.status === 'completed' ? '#059669' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTripDetails = (trip) => (
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
              <Text style={styles.detailValue}>{trip.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{trip.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>{trip.status}</Text>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Route:</Text>
              <Text style={styles.detailValue}>{trip.route}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Herb Type:</Text>
              <Text style={styles.detailValue}>{trip.herbType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{trip.duration}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Trips</Text>
          <TouchableOpacity onPress={onExport} style={styles.exportButton}>
            <Icon name="download" size={16} color="#059669" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tripsList}>
          {trips.map(renderTripItem)}
        </View>

        <View style={styles.loadMoreContainer}>
          <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Load More Trips</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Details Modal */}
      {selectedTrip && renderTripDetails(selectedTrip)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  tripsList: {
    // No additional styles needed
  },
  tripItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripInfo: {
    flex: 1,
    marginRight: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  tripId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  herbText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tripActions: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  actionButton: {
    padding: 4,
  },
  loadMoreContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loadMoreButton: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
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
    width: '100%',
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

export default TripHistoryList;
