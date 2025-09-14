import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

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

const ActiveTripsScreen = ({ tripData, batchData, onDeliveryReady, onGoBack }) => {
  const { status } = useTripStatus(MOCK_TRIP_DATA.status);
  const { timeline } = useTripTimeline(MOCK_TIMELINE);

  const handleMapControlPress = (controlType) => {
    console.log(`Map control pressed: ${controlType}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Map Section */}
        <MapSection 
          tripData={tripData || MOCK_TRIP_DATA}
          batchData={batchData}
          onMapControlPress={handleMapControlPress}
        />

        {/* Trip Status */}
        <TripStatus currentStatus={status} />

        {/* Trip Details */}
        <TripDetails tripData={tripData || MOCK_TRIP_DATA} batchData={batchData} />

        {/* Timeline */}
        <Timeline timelineData={timeline} />

        {/* Emergency Button */}
        <EmergencyButton />
      </ScrollView>

      {/* Action Bar */}
      <ActionBar 
        onDeliveryReady={() => onDeliveryReady && onDeliveryReady({
          name: 'Dr. Sarah Chen',
          department: 'Processing Lab',
          id: 'LAB-2024-SC'
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ActiveTripsScreen;
