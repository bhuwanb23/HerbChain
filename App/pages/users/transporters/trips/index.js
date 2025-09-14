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

const TripsPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState('trips_overview');
  const [tripFlow, setTripFlow] = useState({
    currentTrip: null,
    tripStatus: 'pending', // pending, active, completed
    batchData: null,
    receiverData: null,
  });

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

  // Trip flow navigation functions
  const navigateToBatchScan = (tripData) => {
    setTripFlow(prev => ({
      ...prev,
      currentTrip: tripData,
      tripStatus: 'pending'
    }));
    setCurrentPage('batch_scan');
  };

  const navigateToActiveTrip = (batchData) => {
    setTripFlow(prev => ({
      ...prev,
      batchData: batchData,
      tripStatus: 'active'
    }));
    setCurrentPage('active_trips');
  };

  const navigateToDeliveryConfirm = (receiverData) => {
    setTripFlow(prev => ({
      ...prev,
      receiverData: receiverData,
      tripStatus: 'active'
    }));
    setCurrentPage('delivery_confirm');
  };

  const completeTrip = () => {
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
              {/* Pending Trips */}
              <TouchableOpacity 
                style={[styles.tripCard, styles.pendingCard]}
                onPress={() => navigateToBatchScan({ id: 'TRIP-001', status: 'pending' })}
              >
                <View style={styles.tripCardHeader}>
                  <Icon name="pending" size={24} color="#F59E0B" />
                  <Text style={styles.tripCardTitle}>Pending Pickup</Text>
                </View>
                <Text style={styles.tripCardSubtitle}>Green Valley Farm → Processing Lab</Text>
                <Text style={styles.tripCardTime}>Ready for pickup</Text>
              </TouchableOpacity>

              {/* Active Trips */}
              <TouchableOpacity 
                style={[styles.tripCard, styles.activeCard]}
                onPress={() => navigateToActiveTrip({ id: 'TRIP-002', status: 'active' })}
              >
                <View style={styles.tripCardHeader}>
                  <Icon name="local-shipping" size={24} color="#10B981" />
                  <Text style={styles.tripCardTitle}>Active Trip</Text>
                </View>
                <Text style={styles.tripCardSubtitle}>Mountain View Farm → Quality Lab</Text>
                <Text style={styles.tripCardTime}>In transit - 15 min remaining</Text>
              </TouchableOpacity>

              {/* Completed Trips */}
              <TouchableOpacity 
                style={[styles.tripCard, styles.completedCard]}
                onPress={() => setCurrentPage('history_reports')}
              >
                <View style={styles.tripCardHeader}>
                  <Icon name="check-circle" size={24} color="#6B7280" />
                  <Text style={styles.tripCardTitle}>Completed Trips</Text>
                </View>
                <Text style={styles.tripCardSubtitle}>View trip history and reports</Text>
                <Text style={styles.tripCardTime}>3 trips completed today</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'batch_scan':
        return (
          <BatchScanScreen 
            tripData={tripFlow.currentTrip}
            onScanSuccess={navigateToActiveTrip}
            onGoBack={goBackToTrips}
          />
        );
      case 'active_trips':
        return (
          <ActiveTripsScreen 
            tripData={tripFlow.currentTrip}
            batchData={tripFlow.batchData}
            onDeliveryReady={navigateToDeliveryConfirm}
            onGoBack={goBackToTrips}
          />
        );
      case 'delivery_confirm':
        return (
          <DeliveryConfirmScreen 
            tripData={tripFlow.currentTrip}
            batchData={tripFlow.batchData}
            receiverData={tripFlow.receiverData}
            onDeliveryComplete={completeTrip}
            onGoBack={goBackToTrips}
          />
        );
      case 'history_reports':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>📜 Trip History & Reports</Text>
            <Text style={styles.placeholderSubtext}>Completed trips, receipts, and analytics</Text>
            <TouchableOpacity 
              style={styles.backToTripsButton}
              onPress={goBackToTrips}
            >
              <Text style={styles.backToTripsText}>Back to Trips</Text>
            </TouchableOpacity>
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
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
});

export default TripsPage;
