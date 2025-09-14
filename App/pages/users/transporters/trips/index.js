import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import BatchScanScreen from './batch_scan/BatchScanScreen';
import DeliveryConfirmScreen from './delivery_confirm/delivery_confirm';
import ActiveTripsScreen from './active_trips/active_trips';
import HistoryScreen from './history/HistoryScreen';

const TripsPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
          <View style={styles.tripsOverview}>
            <View style={styles.tripCards}>
              {mockTrips.map((trip) => (
                <TouchableOpacity 
                  key={trip.id}
                  style={[styles.tripCard, { borderLeftColor: trip.color }]}
                  onPress={() => handleTripSelection(trip)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tripCardHeader}>
                    <Icon name={trip.icon} size={24} color={trip.color} />
                    <Text style={styles.tripCardTitle}>
                      {trip.status === 'pending' ? 'Pending Pickup' : 
                       trip.status === 'active' ? 'Active Trip' : 'Completed Trip'}
                    </Text>
                  </View>
                  <Text style={styles.tripCardSubtitle}>{trip.from} → {trip.to}</Text>
                  <Text style={styles.tripCardTime}>{trip.time}</Text>
                  {trip.status === 'pending' && (
                    <View style={styles.actionHint}>
                      <Text style={styles.actionHintText}>Tap to scan batch QR</Text>
                    </View>
                  )}
                  {trip.status === 'active' && (
                    <View style={styles.actionHint}>
                      <Text style={styles.actionHintText}>Tap to view trip details</Text>
                    </View>
                  )}
                  {trip.status === 'completed' && (
                    <View style={styles.actionHint}>
                      <Text style={styles.actionHintText}>Tap to view history</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        {/* Page Content */}
        {renderCurrentPage()}
      </LinearGradient>
    </SafeAreaView>
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
    paddingTop: 16,
    paddingBottom: 24,
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  tripCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  tripCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionHintText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TripsPage;
