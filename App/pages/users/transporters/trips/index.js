import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_BASE_URL } from '../../../../constants/api';

// Removed old sub-screens per requirement; embedding pending pickup + scanner + active list in this page

const TripsPage = ({ navigation }) => {
  const [pendingHerbs, setPendingHerbs] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const transporterId = 'transporter_001';

  const fetchPendingPickup = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/pending_pickup`);
      const json = await res.json();
      setPendingHerbs(Array.isArray(json.herbs) ? json.herbs : []);
    } catch (e) {
      console.log('Failed to load pending pickup herbs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPickup();
  }, []);

  const handleStartScan = async (herb) => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        return;
      }
    }
    setSelectedBatch(herb);
    setScannerVisible(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (!selectedBatch) return;
    setScannerVisible(false);
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch.batch_id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_id: transporterId,
          scanned_qr_text: data,
          pickup_location: selectedBatch.location,
          dropoff_location: 'Lab - TBD',
        })
      });
      const json = await res.json();
      if (!res.ok) {
        console.log('Pickup failed', json);
        return;
      }
      // Move from pending to active with new QR
      setPendingHerbs(prev => prev.filter(h => h.batch_id !== selectedBatch.batch_id));
      setActiveTrips(prev => [{ ...json.herb, new_qr_code: json.new_qr_code }, ...prev]);
      setSelectedBatch(null);
    } catch (e) {
      console.log('Error during pickup', e);
    } finally {
      setLoading(false);
    }
  };

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
          <View key={herb.batch_id} style={[styles.tripCard, { borderLeftColor: '#F59E0B' }]}> 
            <View style={styles.cardTopRow}>
              <View style={[styles.iconChip, { backgroundColor: `#F59E0B1A`, borderColor: `#F59E0B33` }]}> 
                <Icon name="pending" size={18} color="#F59E0B" />
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.tripCardTitle}>Batch {herb.batch_id}</Text>
                <Text style={styles.tripCardSubtitle}>{herb.species_name} • {herb.weight_kg} kg</Text>
                <Text style={styles.tripCardTime}>Farmer: {herb?.farmer?.name || herb.farmer_id}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `#F59E0B1A`, borderColor: `#F59E0B33` }]}> 
                <Text style={[styles.badgeText, { color: '#F59E0B' }]}>Pending</Text>
              </View>
            </View>
            <View style={styles.footerHintRow}>
              <TouchableOpacity style={styles.scanButton} onPress={() => handleStartScan(herb)}>
                <Icon name="qr-code-scanner" size={16} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <View key={trip.batch_id} style={[styles.tripCard, { borderLeftColor: '#10B981' }]}> 
            <View style={styles.cardTopRow}>
              <View style={[styles.iconChip, { backgroundColor: `#10B9811A`, borderColor: `#10B98133` }]}> 
                <Icon name="local-shipping" size={18} color="#10B981" />
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.tripCardTitle}>Batch {trip.batch_id}</Text>
                <Text style={styles.tripCardSubtitle}>{trip.species_name} • {trip.weight_kg} kg</Text>
                <Text style={styles.tripCardTime}>Owner: {trip.current_owner}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `#10B9811A`, borderColor: `#10B98133` }]}> 
                <Text style={[styles.badgeText, { color: '#10B981' }]}>In Transit</Text>
              </View>
            </View>
            {trip.new_qr_code ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Transporter QR</Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8 }}>
                  <Text numberOfLines={2} style={{ fontSize: 12, color: '#111827' }}>{trip.new_qr_code.substring(0, 80)}...</Text>
                </View>
              </View>
            ) : null}
          </View>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderPendingPickup()}
          {renderActiveTrips()}
        </ScrollView>

        {scannerVisible && (
          <View style={styles.scannerOverlay}>
            <CameraView
              style={{ flex: 1, width: '100%' }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr']
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
              <Text style={styles.closeScannerText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  scannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeScannerBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeScannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TripsPage;
