import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import components
import MapSection from './components/MapSection';
import TripStatus from './components/TripStatus';
import TripDetails from './components/TripDetails';
import Timeline from './components/Timeline';
import EmergencyButton from './components/EmergencyButton';
import ActionBar from './components/ActionBar';

// Import constants and hooks
import { MOCK_TRIP_DATA, MOCK_TIMELINE, TRIP_STATUS } from './constants';
import { useTripStatus, useTripTimeline } from './hooks';

const ActiveTripsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { status } = useTripStatus(MOCK_TRIP_DATA.status);
  const { timeline } = useTripTimeline(MOCK_TIMELINE);

  const handleBackPress = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Trip Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report Issue', onPress: () => console.log('Report issue') },
        { text: 'Contact Support', onPress: () => console.log('Contact support') },
        { text: 'End Trip', onPress: () => console.log('End trip'), style: 'destructive' },
      ]
    );
  };

  const handleMapControlPress = (controlType) => {
    console.log(`Map control pressed: ${controlType}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Active Trip</Text>
          <Text style={styles.headerSubtitle}>Trip #{MOCK_TRIP_DATA.tripId}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <Text style={styles.headerIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Map Section */}
        <MapSection 
          tripData={MOCK_TRIP_DATA}
          onMapControlPress={handleMapControlPress}
        />

        {/* Trip Status */}
        <TripStatus currentStatus={status} />

        {/* Trip Details */}
        <TripDetails tripData={MOCK_TRIP_DATA} />

        {/* Timeline */}
        <Timeline timelineData={timeline} />

        {/* Emergency Button */}
        <EmergencyButton />
      </ScrollView>

      {/* Action Bar */}
      <ActionBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ActiveTripsScreen;
