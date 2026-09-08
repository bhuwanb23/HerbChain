/**
 * ShipmentDetail — full detail view for a single shipment.
 *
 * Shows batch info, origin/destination, status, timeline events,
 * and context-sensitive action buttons based on shipment phase.
 *
 * Backend: GET /api/v1/shipments/:id, GET /api/v1/shipments/:id/timeline
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ShipmentsAPI } from '../../../services/apiClient';

const STATUS_COLORS = {
  pending_assigned: '#F59E0B',
  accepted: '#3B82F6',
  arrived_at_origin: '#8B5CF6',
  picked_up: '#0EA5E9',
  in_transit: '#0EA5E9',
  arrived_at_destination: '#8B5CF6',
  delivered: '#10B981',
  failed: '#EF4444',
  cancelled: '#9CA3AF',
};

const STATUS_LABELS = {
  pending_assigned: 'Pending Acceptance',
  accepted: 'Accepted',
  arrived_at_origin: 'Arrived at Origin',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  arrived_at_destination: 'Arrived at Destination',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export default function ShipmentDetail({ route, navigation }) {
  const { accessToken } = useAuth();
  const shipmentId = route?.params?.shipmentId;
  const [shipment, setShipment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!shipmentId || !accessToken) return;
    try {
      setLoading(true);
      const [s, t] = await Promise.all([
        ShipmentsAPI.get(accessToken, shipmentId),
        ShipmentsAPI.timeline(accessToken, shipmentId).catch(() => ({ timeline: [] })),
      ]);
      setShipment(s?.shipment || s);
      setTimeline(t?.timeline || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  }, [shipmentId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const act = async (actionFn, successMsg) => {
    setActing(true);
    try {
      await actionFn();
      Alert.alert('Success', successMsg);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const handleAccept = () => act(
    () => ShipmentsAPI.accept(accessToken, shipmentId),
    'Shipment accepted!',
  );

  const handleDecline = () => {
    Alert.prompt?.('Decline', 'Reason for declining:', (reason) => {
      if (reason) act(() => ShipmentsAPI.decline(accessToken, shipmentId, { reason }), 'Shipment declined');
    }) || act(() => ShipmentsAPI.decline(accessToken, shipmentId, { reason: 'Not available' }), 'Shipment declined');
  };

  const handlePickup = () => navigation?.navigate?.('PickupCapture', { shipmentId });

  const handleDeliver = () => navigation?.navigate?.('DeliveryConfirm', { shipmentId });

  const handleFail = () => navigation?.navigate?.('DeliveryFailure', { shipmentId });

  const handleStartTransit = () => act(
    () => ShipmentsAPI.location(accessToken, shipmentId, { gps_lat: 0, gps_lng: 0 }),
    'Transit started!',
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0EA5E9" /></View>;
  }

  if (!shipment) {
    return <View style={styles.center}><Text style={styles.empty}>Shipment not found</Text></View>;
  }

  const status = shipment.status || 'pending_assigned';
  const color = STATUS_COLORS[status] || '#6B7280';
  const batch = shipment.batch || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.statusBanner, { backgroundColor: `${color}15` }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[status] || status}</Text>
      </View>

      {/* Batch Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Batch Information</Text>
        <InfoRow label="Batch Code" value={batch.code || shipment.ref_id} />
        <InfoRow label="Species" value={batch.species?.common_name || batch.species_name || '—'} />
        <InfoRow label="Phase" value={batch.phase || '—'} />
        <InfoRow label="Current Holder" value={batch.current_holder_user_id || '—'} />
      </View>

      {/* Route */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <InfoRow label="Origin" value={shipment.origin_location || '—'} />
        <InfoRow label="Destination" value={shipment.destination_location || '—'} />
        <InfoRow label="Shipment Type" value={shipment.shipment_type || '—'} />
        <InfoRow label="Priority" value={shipment.priority || 'normal'} />
        {shipment.transporter_user_id && (
          <InfoRow label="Transporter" value={shipment.transporter_user_id} />
        )}
      </View>

      {/* Timeline */}
      {timeline.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          {timeline.map((event, i) => (
            <View key={event.id || i} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: color }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineEvent}>{event.event_type || event.type}</Text>
                <Text style={styles.timelineTime}>
                  {event.created_at ? new Date(event.created_at).toLocaleString() : ''}
                </Text>
                {event.remarks && <Text style={styles.timelineRemarks}>{event.remarks}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {status === 'pending_assigned' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleAccept} disabled={acting}>
              <Text style={styles.btnText}>Accept Shipment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDecline} disabled={acting}>
              <Text style={[styles.btnText, { color: '#EF4444' }]}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'accepted' && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handlePickup} disabled={acting}>
            <Text style={styles.btnText}>Go to Pickup</Text>
          </TouchableOpacity>
        )}
        {(status === 'picked_up' || status === 'in_transit') && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleDeliver} disabled={acting}>
              <Text style={styles.btnText}>Deliver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleFail} disabled={acting}>
              <Text style={[styles.btnText, { color: '#EF4444' }]}>Report Failure</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'delivered' && (
          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredText}>✅ Delivery Complete</Text>
          </View>
        )}
        {/* Map & Route buttons */}
        <View style={[styles.actionRow, { marginTop: 12 }]}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]} onPress={() => navigation?.navigate?.('ShipmentMap', { shipmentId, shipment })}>
            <Text style={[styles.btnText, { color: '#3B82F6' }]}>🗺️ Track on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' }]} onPress={() => navigation?.navigate?.('RouteHistory', { shipmentId })}>
            <Text style={[styles.btnText, { color: '#374151' }]}>📍 Route History</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#6B7280', fontSize: 14 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, marginBottom: 16,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  timelineContent: { flex: 1 },
  timelineEvent: { fontSize: 13, fontWeight: '600', color: '#111827' },
  timelineTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  timelineRemarks: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  actions: { marginTop: 8, gap: 10 },
  btn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#0EA5E9' },
  btnDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  deliveredBadge: {
    backgroundColor: '#D1FAE5', padding: 14, borderRadius: 12, alignItems: 'center',
  },
  deliveredText: { color: '#065F46', fontWeight: '700', fontSize: 15 },
});
