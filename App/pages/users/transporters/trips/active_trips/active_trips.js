import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onGoBack}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={18} color="#FFFFFF" />
      </TouchableOpacity>

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
  backButton: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ActiveTripsScreen;
