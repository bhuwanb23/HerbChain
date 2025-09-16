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

import BatchScanScreen from './batch_scan/BatchScanScreen';
import DeliveryConfirmScreen from './delivery_confirm/delivery_confirm';
import ActiveTripsScreen from './active_trips/active_trips';
import HistoryScreen from './history/HistoryScreen';

const TripsPage = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState('trips_overview');
  const [tripFlow, setTripFlow] = useState({
    currentTrip: null,
    tripStatus: 'pending', // pending, active, completed
    batchData: null,
    receiverData: null,
  });

  // Mock trip data for demonstration
  const mockTrips = [
    {
      id: 'TRIP-001',
      status: 'pending',
      from: 'Green Valley Farm',
      to: 'Processing Lab',
      batchId: 'BT-2024-001',
      time: 'Ready for pickup',
      icon: 'pending',
      color: '#F59E0B'
    },
    {
      id: 'TRIP-002', 
      status: 'active',
      from: 'Mountain View Farm',
      to: 'Quality Lab',
      batchId: 'BT-2024-002',
      time: 'In transit - 15 min remaining',
      icon: 'local-shipping',
      color: '#10B981'
    },
    {
      id: 'TRIP-003',
      status: 'completed',
      from: 'Sunrise Farm',
      to: 'Testing Lab',
      batchId: 'BT-2024-003',
      time: 'Completed 2 hours ago',
      icon: 'check-circle',
      color: '#6B7280'
    }
  ];

  const getPageTitle = (page) => {
    switch (page) {
      case 'trips_overview':
        return 'Trips Management';
      case 'batch_scan':
        return 'Batch Scanner';
      case 'active_trips':
        return 'Active Trip';
      case 'delivery_confirm':
        return 'Delivery Confirmation';
      case 'history_reports':
        return 'Trip History';
      default:
        return 'Trips';
    }
  };

  // Trip flow navigation functions following the specified flow
  const handleTripSelection = (trip) => {
    if (trip.status === 'pending') {
      // Pending trip → Batch Scan Page
      setTripFlow(prev => ({
        ...prev,
        currentTrip: trip,
        tripStatus: 'pending'
      }));
      setCurrentPage('batch_scan');
    } else if (trip.status === 'active') {
      // Active trip → Active Trip Details Page
      setTripFlow(prev => ({
        ...prev,
        currentTrip: trip,
        tripStatus: 'active'
      }));
      setCurrentPage('active_trips');
    } else if (trip.status === 'completed') {
      // Completed trip → History & Reports Page
      setCurrentPage('history_reports');
    }
  };

  const handleBatchScanSuccess = (batchData) => {
    // After successful pickup → Active Trip Details Page
    setTripFlow(prev => ({
      ...prev,
      batchData: batchData,
      tripStatus: 'active'
    }));
    setCurrentPage('active_trips');
  };

  const handleDeliveryReady = (receiverData) => {
    // When transporter reaches delivery point → Delivery Confirmation Page
    setTripFlow(prev => ({
      ...prev,
      receiverData: receiverData,
      tripStatus: 'active'
    }));
    setCurrentPage('delivery_confirm');
  };

  const handleDeliveryComplete = () => {
    // Trip marked as Completed → History & Reports Page
    setTripFlow(prev => ({
      ...prev,
      tripStatus: 'completed'
    }));
    setCurrentPage('history_reports');
  };

  const goBackToTrips = () => {
    setCurrentPage('trips_overview');
    setTripFlow({
      currentTrip: null,
      tripStatus: 'pending',
      batchData: null,
      receiverData: null,
    });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'trips_overview':
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tripsOverview}>
              <LinearGradient colors={["#059669", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle}>Trips Management</Text>
                  <Text style={styles.headerSubtitle}>Plan, track and complete your deliveries</Text>
                </View>
              </LinearGradient>

              <View style={styles.tripCards}>
                {mockTrips.map((trip) => (
                  <TouchableOpacity 
                    key={trip.id}
                    style={[styles.tripCard, { borderLeftColor: trip.color }]}
                    onPress={() => handleTripSelection(trip)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconChip, { backgroundColor: `${trip.color}1A`, borderColor: `${trip.color}33` }]}> 
                        <Icon name={trip.icon} size={18} color={trip.color} />
                      </View>
                      <View style={styles.titleWrap}>
                        <Text style={styles.tripCardTitle}>
                          {trip.status === 'pending' ? 'Pending Pickup' : 
                           trip.status === 'active' ? 'Active Trip' : 'Completed Trip'}
                        </Text>
                        <Text style={styles.tripCardSubtitle}>{trip.from} → {trip.to}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: `${trip.color}1A`, borderColor: `${trip.color}33` }]}> 
                        <Text style={[styles.badgeText, { color: trip.color }]}>
                          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.tripCardTime}>{trip.time}</Text>

                    <View style={styles.footerHintRow}>
                      {trip.status === 'pending' && (
                        <View style={styles.hintChip}><Text style={styles.hintChipText}>Scan batch QR</Text></View>
                      )}
                      {trip.status === 'active' && (
                        <View style={styles.hintChip}><Text style={styles.hintChipText}>View trip details</Text></View>
                      )}
                      {trip.status === 'completed' && (
                        <View style={styles.hintChip}><Text style={styles.hintChipText}>Open history</Text></View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        );
      case 'batch_scan':
        return (
          <BatchScanScreen 
            tripData={tripFlow.currentTrip}
            onScanSuccess={handleBatchScanSuccess}
            onGoBack={goBackToTrips}
          />
        );
      case 'active_trips':
        return (
          <ActiveTripsScreen 
            tripData={tripFlow.currentTrip}
            batchData={tripFlow.batchData}
            onDeliveryReady={handleDeliveryReady}
            onGoBack={goBackToTrips}
          />
        );
      case 'delivery_confirm':
        return (
          <DeliveryConfirmScreen 
            tripData={tripFlow.currentTrip}
            batchData={tripFlow.batchData}
            receiverData={tripFlow.receiverData}
            onDeliveryComplete={handleDeliveryComplete}
            onGoBack={goBackToTrips}
          />
        );
      case 'history_reports':
        return (
          <HistoryScreen onGoBack={goBackToTrips} />
        );
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Trips Overview</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        {/* Page Content */}
        {renderCurrentPage()}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backToTripsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToTripsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tripsOverview: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sectionHeader: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextWrap: {
    gap: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  tripCards: {
    gap: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  tripCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tripCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  tripCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerHintRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  hintChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hintChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default TripsPage;
