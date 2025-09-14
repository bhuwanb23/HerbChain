import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapWidget = ({ mapData, isExpanded, onToggleExpanded }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={onToggleExpanded}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F8FAFC', '#E2E8F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapGradient}
        >
          <View style={styles.mapHeader}>
            <View style={styles.mapTitleSection}>
              <Icon name="map" size={18} color="#3B82F6" />
              <Text style={styles.mapTitle}>Live Route</Text>
            </View>
            <Icon 
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={20} 
              color="#6B7280" 
            />
          </View>
          
          <View style={styles.mapContent}>
            <View style={styles.locationInfo}>
              <View style={styles.currentLocation}>
                <Icon name="my-location" size={16} color="#22c55e" />
                <Text style={styles.locationText}>{mapData.currentLocation.address}</Text>
              </View>
              
              <View style={styles.routeProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${mapData.routeProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{mapData.routeProgress}% Complete</Text>
              </View>
              
              <View style={styles.nextStop}>
                <Icon name="place" size={16} color="#3B82F6" />
                <View style={styles.nextStopInfo}>
                  <Text style={styles.nextStopAddress}>{mapData.nextStop.address}</Text>
                  <Text style={styles.nextStopDetails}>
                    {mapData.nextStop.distance} • ETA: {mapData.nextStop.eta}
                  </Text>
                </View>
              </View>
            </View>
            
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.mapPlaceholder}>
                  <Icon name="map" size={40} color="#CBD5E1" />
                  <Text style={styles.mapPlaceholderText}>Interactive Map View</Text>
                  <Text style={styles.mapPlaceholderSubtext}>Tap to open full map</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapGradient: {
    padding: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  mapContent: {
    flex: 1,
  },
  locationInfo: {
    gap: 8,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  routeProgress: {
    marginVertical: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextStop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextStopInfo: {
    marginLeft: 6,
    flex: 1,
  },
  nextStopAddress: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 1,
  },
  nextStopDetails: {
    fontSize: 10,
    color: '#6B7280',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default MapWidget;
