/**
 * ShipmentMapScreen — live GPS tracking for a shipment.
 *
 * Shows origin, destination, current location, route polyline, ETA.
 * Auto-refreshes every 30 seconds.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { ShipmentsAPI } from '../../../../services/apiClient';
import { useAuth } from '../../../../contexts/AuthContext';

const POLL_INTERVAL = 30000;

export default function ShipmentMapScreen({ navigation, route }) {
  const { accessToken } = useAuth();
  const { shipmentId, shipment } = route?.params || {};
  const [shipmentData, setShipmentData] = useState(shipment);
  const [locations, setLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    if (!accessToken || !shipmentId) return;
    try {
      const [detail, locs] = await Promise.all([
        ShipmentsAPI.detail(accessToken, shipmentId),
        ShipmentsAPI.locations(accessToken, shipmentId).catch(() => ({ locations: [] })),
      ]);
      setShipmentData(detail?.shipment || detail);
      setLocations(locs?.locations || locs || []);
      setLastUpdate(new Date());
    } catch (_) {}
  }, [accessToken, shipmentId]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, POLL_INTERVAL); return () => clearInterval(t); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const s = shipmentData || {};
  const lastLoc = locations.length > 0 ? locations[locations.length - 1] : null;
  const origin = s.origin || {};
  const destination = s.destination || {};

  // Calculate stats
  const totalStops = locations.filter((l) => l.speed === 0 || l.speed < 1).length;
  const avgSpeed = locations.length > 0 ? Math.round(locations.reduce((sum, l) => sum + (l.speed || 0), 0) / locations.length) : 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ {s.shipment_code || s.id?.slice(0, 12) || 'Shipment'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live Map View</Text>
          {lastLoc && (
            <Text style={styles.mapCoords}>
              📍 {lastLoc.lat?.toFixed(4)}°N, {lastLoc.lng?.toFixed(4)}°E
            </Text>
          )}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Origin</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>Current</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Destination</Text></View>
          </View>
        </View>
      </View>

      {/* Location info */}
      {lastLoc && (
        <View style={styles.infoCard}>
          <InfoRow label="Current Position" value={`${lastLoc.lat?.toFixed(4)}°N, ${lastLoc.lng?.toFixed(4)}°E`} />
          <InfoRow label="Last Update" value={lastUpdate ? `${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago` : '-'} />
          {lastLoc.speed != null && <InfoRow label="Speed" value={`${Math.round(lastLoc.speed)} km/h`} />}
          {lastLoc.heading != null && <InfoRow label="Heading" value={`${lastLoc.heading}°`} />}
          <InfoRow label="GPS Pings" value={String(locations.length)} />
        </View>
      )}

      {/* Route stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{locations.length}</Text>
          <Text style={styles.statLabel}>GPS Pings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgSpeed}</Text>
          <Text style={styles.statLabel}>Avg Speed (km/h)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalStops}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
      </View>

      {/* Origin / Destination */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Route</Text>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.routeLabel}>Origin: {origin.location || origin.state || '-'}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeLabel}>Destination: {destination.location || destination.state || '-'}</Text>
        </View>
      </View>

      {/* GPS ping history */}
      {locations.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>GPS History (Last 10)</Text>
          {locations.slice(-10).reverse().map((loc, i) => (
            <View key={i} style={styles.pingRow}>
              <Text style={styles.pingIcon}>📍</Text>
              <View style={styles.pingContent}>
                <Text style={styles.pingCoords}>{loc.lat?.toFixed(4)}°N, {loc.lng?.toFixed(4)}°E</Text>
                <Text style={styles.pingTime}>{loc.timestamp ? new Date(loc.timestamp).toLocaleTimeString() : '-'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  mapContainer: { margin: 12, borderRadius: 12, overflow: 'hidden' },
  mapPlaceholder: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#6EE7B7' },
  mapIcon: { fontSize: 48, marginBottom: 8 },
  mapText: { fontSize: 16, fontWeight: '700', color: '#065F46' },
  mapCoords: { fontSize: 13, fontFamily: 'monospace', color: '#059669', marginTop: 8 },
  mapLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  infoCard: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 12 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  routeLine: { width: 2, height: 16, backgroundColor: '#D1D5DB', marginLeft: 5, marginVertical: 2 },
  pingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pingIcon: { fontSize: 12, marginRight: 8 },
  pingContent: { flex: 1 },
  pingCoords: { fontSize: 12, fontFamily: 'monospace', color: '#374151' },
  pingTime: { fontSize: 11, color: '#9CA3AF' },
});
