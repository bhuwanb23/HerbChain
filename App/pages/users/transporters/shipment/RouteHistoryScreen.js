/**
 * RouteHistoryScreen — historical route view for completed shipments.
 * Shows full GPS history, timeline, stats, and route summary.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShipmentsAPI } from '../../../../services/apiClient';
import { useAuth } from '../../../../contexts/AuthContext';

export default function RouteHistoryScreen({ navigation, route }) {
  const { accessToken } = useAuth();
  const { shipmentId } = route?.params || {};
  const [shipment, setShipment] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !shipmentId) return;
    Promise.all([
      ShipmentsAPI.detail(accessToken, shipmentId),
      ShipmentsAPI.locations(accessToken, shipmentId).catch(() => ({ locations: [] })),
    ]).then(([detail, locs]) => {
      setShipment(detail?.shipment || detail);
      setLocations(locs?.locations || locs || []);
    }).finally(() => setLoading(false));
  }, [accessToken, shipmentId]);

  const s = shipment || {};
  const origin = s.origin || {};
  const destination = s.destination || {};

  // Calculate stats
  const totalDistance = locations.reduce((sum, l, i) => {
    if (i === 0) return 0;
    const prev = locations[i - 1];
    const dist = Math.sqrt(Math.pow((l.lat - prev.lat) * 111, 2) + Math.pow((l.lng - prev.lng) * 111, 2));
    return sum + dist;
  }, 0);

  const avgSpeed = locations.length > 1 ? Math.round(locations.slice(1).reduce((s, l) => s + (l.speed || 0), 0) / (locations.length - 1)) : 0;
  const stops = locations.filter((l) => l.speed === 0 || l.speed < 1);

  const startTime = locations[0]?.timestamp ? new Date(locations[0].timestamp) : null;
  const endTime = locations.length > 1 ? new Date(locations[locations.length - 1].timestamp) : null;
  const duration = startTime && endTime ? Math.round((endTime - startTime) / 60000) : 0;

  // Detect unscheduled stops (>5 min with speed ≈ 0)
  const unscheduledStops = [];
  let stopStart = null;
  locations.forEach((l, i) => {
    if (l.speed === 0 || l.speed < 1) {
      if (!stopStart) stopStart = i;
    } else {
      if (stopStart !== null && (i - stopStart) > 2) {
        unscheduledStops.push({ startIdx: stopStart, endIdx: i, location: locations[stopStart] });
      }
      stopStart = null;
    }
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Route History</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Route summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{s.shipment_code || s.id?.slice(0, 12) || 'Shipment'}</Text>
        <Text style={styles.cardStatus}>Status: {s.status || '-'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={totalDistance.toFixed(0)} unit="km" label="Distance" />
        <StatCard value={String(duration)} unit="min" label="Duration" />
        <StatCard value={String(avgSpeed)} unit="km/h" label="Avg Speed" />
        <StatCard value={String(stops.length)} unit="stops" label="Stops" />
      </View>

      {/* Route visualization */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <View style={styles.routeVisual}>
          <View style={[styles.routeNode, { backgroundColor: '#10B981' }]}>
            <Text style={styles.routeNodeIcon}>🌱</Text>
            <Text style={styles.routeNodeLabel}>Farm</Text>
            <Text style={styles.routeNodeSub}>{origin.location || origin.state || 'Origin'}</Text>
          </View>
          <View style={styles.routeArrow}>
            {locations.map((_, i) => <View key={i} style={styles.routeDot} />)}
          </View>
          <View style={[styles.routeNode, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.routeNodeIcon}>🏭</Text>
            <Text style={styles.routeNodeLabel}>Destination</Text>
            <Text style={styles.routeNodeSub}>{destination.location || destination.state || 'End'}</Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        {locations.length === 0 ? (
          <Text style={styles.noData}>No GPS data available for this shipment.</Text>
        ) : (
          locations.map((loc, i) => {
            const isStop = loc.speed === 0 || loc.speed < 1;
            const isFirst = i === 0;
            const isLast = i === locations.length - 1;
            return (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: isFirst ? '#10B981' : isLast ? '#EF4444' : isStop ? '#F59E0B' : '#3B82F6' }]} />
                  {i < locations.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>{loc.timestamp ? new Date(loc.timestamp).toLocaleTimeString() : '-'}</Text>
                  <Text style={styles.timelineDesc}>
                    {isFirst ? '🟢 Departed' : isLast ? '🔴 Arrived' : isStop ? '🟡 Stopped' : `📍 ${Math.round(loc.speed || 0)} km/h`}
                  </Text>
                  <Text style={styles.timelineCoords}>{loc.lat?.toFixed(4)}°N, {loc.lng?.toFixed(4)}°E</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Unscheduled stops warning */}
      {unscheduledStops.length > 0 && (
        <View style={[styles.card, { borderColor: '#FDE68A' }]}>
          <Text style={styles.cardTitle}>⚠️ Unscheduled Stops ({unscheduledStops.length})</Text>
          {unscheduledStops.map((stop, i) => (
            <Text key={i} style={styles.stopText}>
              Stop at {stop.location?.lat?.toFixed(2)}°N, {stop.location?.lng?.toFixed(2)}°E
              {stop.location?.timestamp ? ` — ${new Date(stop.location.timestamp).toLocaleTimeString()}` : ''}
            </Text>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function StatCard({ value, unit, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardStatus: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 12 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statUnit: { fontSize: 11, color: '#6B7280' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  routeVisual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  routeNode: { width: 80, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routeNodeIcon: { fontSize: 20 },
  routeNodeLabel: { fontSize: 10, fontWeight: '700', color: '#FFF', marginTop: 2 },
  routeNodeSub: { fontSize: 9, color: '#FFF', opacity: 0.8 },
  routeArrow: { flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, paddingHorizontal: 8 },
  routeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 20, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: 10, paddingLeft: 8 },
  timelineTime: { fontSize: 12, fontWeight: '700', color: '#374151' },
  timelineDesc: { fontSize: 13, color: '#111827', marginTop: 2 },
  timelineCoords: { fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF', marginTop: 2 },
  noData: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  stopText: { fontSize: 13, color: '#92400E', marginTop: 4 },
});
