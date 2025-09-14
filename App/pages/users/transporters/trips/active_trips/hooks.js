import { useState, useEffect, useRef } from 'react';
import { Animated, Alert } from 'react-native';

// Hook for managing trip animations
export const useTripAnimations = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const routeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for live tracking
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation for status indicators
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Route animation for progress
    Animated.timing(routeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  return {
    pulseAnim,
    glowAnim,
    routeAnim,
  };
};

// Hook for managing trip status
export const useTripStatus = (initialStatus) => {
  const [status, setStatus] = useState(initialStatus);
  const [isLiveTracking, setIsLiveTracking] = useState(true);

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
  };

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  return {
    status,
    isLiveTracking,
    updateStatus,
    toggleLiveTracking,
  };
};

// Hook for managing emergency actions
export const useEmergencyActions = () => {
  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Help',
      'Calling emergency services...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Emergency call initiated') },
      ]
    );
  };

  const handleContactDispatch = () => {
    Alert.alert(
      'Contact Dispatch',
      'Calling dispatch center...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Dispatch call initiated') },
      ]
    );
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Share Location',
      'Location shared successfully!',
      [{ text: 'OK' }]
    );
  };

  return {
    handleEmergencyCall,
    handleContactDispatch,
    handleShareLocation,
  };
};

// Hook for managing trip timeline
export const useTripTimeline = (timelineData) => {
  const [timeline, setTimeline] = useState(timelineData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateTimeline = (eventId, updates) => {
    setTimeline(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
  };

  const markAsCompleted = (eventId) => {
    updateTimeline(eventId, { completed: true });
  };

  const setCurrentEvent = (eventId) => {
    setTimeline(prev => 
      prev.map(event => ({
        ...event,
        isCurrent: event.id === eventId,
      }))
    );
    setCurrentStep(eventId);
  };

  return {
    timeline,
    currentStep,
    updateTimeline,
    markAsCompleted,
    setCurrentEvent,
  };
};

// Hook for managing map interactions
export const useMapControls = () => {
  const [mapView, setMapView] = useState('standard');
  const [isTrackingLocation, setIsTrackingLocation] = useState(true);

  const toggleMapView = () => {
    setMapView(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

  const centerOnLocation = () => {
    setIsTrackingLocation(true);
    // In a real app, this would center the map on current location
    console.log('Centering on current location');
  };

  const toggleLocationTracking = () => {
    setIsTrackingLocation(!isTrackingLocation);
  };

  return {
    mapView,
    isTrackingLocation,
    toggleMapView,
    centerOnLocation,
    toggleLocationTracking,
  };
};
