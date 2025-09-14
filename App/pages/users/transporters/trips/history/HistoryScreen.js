import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HistoryScreen = ({ onGoBack }) => {
  
  // Mock completed trips data
  const completedTrips = [
    {
      id: 'TRIP-003',
      date: '2024-01-15',
      time: '2:30 PM',
      from: 'Sunrise Farm',
      to: 'Testing Lab',
      batchId: 'BT-2024-003',
      status: 'completed',
      duration: '45 min',
      distance: '18.2 km',
      driver: 'John Smith',
      rating: 5,
    },
    {
      id: 'TRIP-004',
      date: '2024-01-14',
      time: '10:15 AM',
      from: 'Green Valley Farm',
      to: 'Processing Lab',
      batchId: 'BT-2024-004',
      status: 'completed',
      duration: '32 min',
      distance: '12.8 km',
      driver: 'John Smith',
      rating: 4,
    },
    {
      id: 'TRIP-005',
      date: '2024-01-13',
      time: '4:45 PM',
      from: 'Mountain View Farm',
      to: 'Quality Lab',
      batchId: 'BT-2024-005',
      status: 'completed',
      duration: '28 min',
      distance: '15.6 km',
      driver: 'John Smith',
      rating: 5,
    },
  ];

  const [selectedTrip, setSelectedTrip] = useState(null);

  const renderTripCard = (trip) => (
    <TouchableOpacity
      key={trip.id}
      style={styles.tripCard}
      onPress={() => setSelectedTrip(trip)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripId}>{trip.id}</Text>
          <Text style={styles.tripDate}>{trip.date} at {trip.time}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>{trip.from} → {trip.to}</Text>
          <Text style={styles.batchText}>Batch: {trip.batchId}</Text>
        </View>
        
        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Icon name="schedule" size={14} color="#6B7280" />
            <Text style={styles.statText}>{trip.duration}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="straighten" size={14} color="#6B7280" />
            <Text style={styles.statText}>{trip.distance}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={14} color="#F59E0B" />
            <Text style={styles.statText}>{trip.rating}/5</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTripDetails = (trip) => (
    <View style={styles.detailsModal}>
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
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>{trip.date} at {trip.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Driver:</Text>
            <Text style={styles.detailValue}>{trip.driver}</Text>
          </View>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{trip.from}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>{trip.to}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Batch ID:</Text>
            <Text style={styles.detailValue}>{trip.batchId}</Text>
          </View>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{trip.duration}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{trip.distance}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rating:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= trip.rating ? "star" : "star-border"}
                  size={16}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Trip Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{completedTrips.length}</Text>
                <Text style={styles.summaryLabel}>Total Trips</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {completedTrips.reduce((acc, trip) => acc + trip.rating, 0) / completedTrips.length}
                </Text>
                <Text style={styles.summaryLabel}>Avg Rating</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {completedTrips.reduce((acc, trip) => acc + parseFloat(trip.distance), 0).toFixed(1)} km
                </Text>
                <Text style={styles.summaryLabel}>Total Distance</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripsList}>
            <Text style={styles.listTitle}>Completed Trips</Text>
            {completedTrips.map(renderTripCard)}
          </View>
        </ScrollView>

        {/* Trip Details Modal */}
        {selectedTrip && renderTripDetails(selectedTrip)}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tripsList: {
    paddingBottom: 20,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tripDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  tripDetails: {
    gap: 8,
  },
  routeInfo: {
    gap: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  batchText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tripStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
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
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});

export default HistoryScreen;
