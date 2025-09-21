import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TabBar } from './components/TabBar';
import { SectionHeader } from './components/SectionHeader';
import { TripCard } from './components/TripCard';
import { ScannerOverlay } from './components/ScannerOverlay';
import { useTrips } from './hooks/useTrips';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Added import for Icon

const TripsPage = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState('pending');
  const {
    loading,
    pendingHerbs,
    activeTrips,
    completedTrips,
    scannerVisible,
    onStartScan,
    onCloseScanner,
    onBarcodeScanned,
    scanMode, // Destructure scanMode from useTrips
  } = useTrips();

  const handleStartScanForPickup = (herb) => onStartScan(herb, 'pickup');
  const handleStartScanForDelivery = (herb) => onStartScan(herb, 'deliver_to_manufacturer');

  const handleBarCodeScanned = ({ data }) => onBarcodeScanned(data);

  const renderPendingPickup = () => (
    <View style={styles.tripsOverview}>
      <LinearGradient colors={["#059669", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Pending Pickup</Text>
          <Text style={styles.headerSubtitle}>Scan farmer QR to start trip</Text>
        </View>
      </LinearGradient>

      {loading && (
        <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 8 }}>Loading...</Text>
      )}

      <View style={styles.tripCards}>
        {pendingHerbs.map((herb) => (
          <TripCard key={herb.batch_id} mode="pending" item={herb} onScan={handleStartScanForPickup} />
        ))}
      </View>
    </View>
  );

  const renderActiveTrips = () => (
    <View style={styles.tripsOverview}>
      <LinearGradient colors={["#0EA5E9", "#38BDF8"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Active Trips</Text>
          <Text style={styles.headerSubtitle}>In Transit</Text>
        </View>
      </LinearGradient>

      <View style={styles.tripCards}>
        {activeTrips.map((trip) => (
          <TripCard key={trip.batch_id} mode="active" item={trip} onScan={handleStartScanForDelivery} />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        <TabBar current={currentTab} onChange={setCurrentTab} tabs={[{ key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }]} />

        {/* Replaced ScrollView with a View to fix FlatList nesting warning */}
        <View style={styles.contentContainerWrapper}>
          {currentTab === 'pending' && (
            <View style={styles.tripsOverview}>
              <SectionHeader colors={["#059669", "#10B981"]} title="Pending Pickup" subtitle="Scan farmer QR to start trip" />
              <View style={styles.tripCards}>
                {pendingHerbs.map((herb) => (
                  <TripCard key={herb.batch_id} mode="pending" item={herb} onScan={handleStartScanForPickup} />
                ))}
              </View>
            </View>
          )}
          {currentTab === 'active' && (
            <View style={styles.tripsOverview}>
              <SectionHeader colors={["#0EA5E9", "#38BDF8"]} title="Active Trips" subtitle="In Transit" />
              <View style={styles.tripCards}>
                {activeTrips.map((trip) => (
                  <TripCard key={trip.batch_id} mode="active" item={trip} onScan={handleStartScanForDelivery} />
                ))}
              </View>
            </View>
          )}
          {currentTab === 'completed' && (
            <View style={styles.tripsOverview}>
              <LinearGradient colors={["#6B7280", "#9CA3AF"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sectionHeader}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle}>Completed Trips</Text>
                  <Text style={styles.headerSubtitle}>Delivered batches history</Text>
                </View>
              </LinearGradient>
              <View style={styles.tripCards}>
                {completedTrips.length === 0 ? (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>No completed trips yet.</Text>
                    <Text style={styles.placeholderSubtext}>Deliver batches to see them here.</Text>
                  </View>
                ) : (
                  completedTrips.map((trip) => (
                    <TripCard key={trip.batch_id} mode="active" item={trip} showQR={false} />
                  ))
                )}
              </View>
            </View>
          )}
        </View>

        <ScannerOverlay visible={scannerVisible} onClose={() => onCloseScanner()} onScanned={handleBarCodeScanned} />
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
  contentContainerWrapper: {
    flex: 1,
  },
});

export default TripsPage;
