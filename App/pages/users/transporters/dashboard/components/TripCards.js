import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const TripCards = ({ onTripPress }) => {
  const { t } = useGlobalTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered animation for cards
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const trips = [
    {
      id: 'TR-8847',
      status: t.transporterDashboard.tripActive,
      statusColor: '#10B981',
      borderColor: '#10B981',
      icon: 'local-shipping',
      iconColor: '#10B981',
      route: 'Downtown Warehouse → Mall Center',
      details: `${t.transporterDashboard.eta}: 14:30 • 8.2 ${t.transporterDashboard.kmRemaining}`,
      progress: 75,
      progressColor: '#10B981',
      progressLabel: t.transporterDashboard.progress,
      progressValue: '75%',
    },
    {
      id: 'TR-8848',
      status: t.transporterDashboard.tripPending,
      statusColor: '#F59E0B',
      borderColor: '#F59E0B',
      icon: 'schedule',
      iconColor: '#F59E0B',
      route: 'Central Hub → Riverside District',
      details: `${t.transporterDashboard.scheduled}: 15:00 • 12.5 km`,
      progress: 100,
      progressColor: '#F59E0B',
      progressLabel: t.transporterDashboard.preparation,
      progressValue: t.transporterDashboard.ready,
    },
    {
      id: 'TR-8845',
      status: t.transporterDashboard.tripCompleted,
      statusColor: '#6B7280',
      borderColor: '#D1D5DB',
      icon: 'check-circle',
      iconColor: '#9CA3AF',
      route: 'North Station → Business Park',
      details: `${t.transporterDashboard.delivered}: 12:45 • ${t.transporterDashboard.customer}: J. Smith`,
      progress: 100,
      progressColor: '#10B981',
      progressLabel: t.transporterDashboard.status,
      progressValue: t.transporterDashboard.tripCompleted,
    },
  ];

  const getStatusIcon = (status) => {
    if (status === t.transporterDashboard.tripActive) {
      return 'local-shipping';
    } else if (status === t.transporterDashboard.tripPending) {
      return 'schedule';
    } else if (status === t.transporterDashboard.tripCompleted) {
      return 'check-circle';
    } else {
      return 'help';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>{t.transporterDashboard.activeTrips}</Text>
      
      {trips.map((trip, index) => (
        <Animated.View
          key={trip.id}
          style={[
            styles.tripCard,
            {
              borderLeftColor: trip.borderColor,
              borderLeftWidth: 4,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.tripContent}
            onPress={() => onTripPress && onTripPress(trip.id)}
            activeOpacity={0.7}
          >
            <View style={styles.tripHeader}>
              <View style={styles.tripInfo}>
                <View style={styles.statusContainer}>
                  <LinearGradient
                    colors={[trip.statusColor, trip.statusColor]}
                    style={styles.statusBadge}
                  >
                    <Text style={styles.statusText}>{trip.status}</Text>
                  </LinearGradient>
                  <Text style={styles.tripId}>#{trip.id}</Text>
                </View>
              </View>
              <Icon name={getStatusIcon(trip.status)} size={20} color={trip.iconColor} />
            </View>

            <View style={styles.tripDetails}>
              <View style={styles.detailRow}>
                <Icon name="location-on" size={16} color="#3B82F6" />
                <Text style={styles.detailText}>{trip.route}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={16} color="#F59E0B" />
                <Text style={styles.detailText}>{trip.details}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{trip.progressLabel}</Text>
                <Text style={styles.progressValue}>{trip.progressValue}</Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${trip.progress}%`,
                      backgroundColor: trip.progressColor,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tripContent: {
    padding: 16,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tripId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tripDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default TripCards;
