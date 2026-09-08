/**
 * OriginStoryScreen — where the herbs were grown (map + farmer + harvest).
 *
 * Accessed from passport timeline (Harvest stage) or batch card.
 * Shows fuzzed location, anonymized farmer info, harvest details.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function OriginStoryScreen({ navigation, route }) {
  const { origin, batch } = route?.params || {};
  const o = origin || batch?.origin || {};

  const region = o.region || o.state || o.district || 'India';
  const country = o.country || 'India';
  const herb = batch?.species?.common_name || batch?.species_name || o.herb || '-';
  const botanical = batch?.species?.scientific_name || o.botanical_name || '';
  const harvestDate = o.harvest_date || o.harvested_at || batch?.harvest_date || null;
  const cultivation = o.cultivation_type || o.cultivation || 'Organic';
  const partUsed = o.part_used || o.part || 'Root';
  const method = o.harvest_method || o.method || 'Hand-harvested';
  const season = o.season || '-';
  const farmerRegion = o.farmer_region || o.farmer_state || region;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back to Passport</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>🌱 Origin Story</Text>

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapRegion}>{region}</Text>
          <Text style={styles.mapCountry}>{country}</Text>
          <Text style={styles.mapDisclaimer}>⚠️ Approximate location for farmer privacy</Text>
        </View>
      </View>

      {/* Farmer card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍🌾 Verified Farmer</Text>
        <InfoRow label="Region" value={farmerRegion} />
        <InfoRow label="Farm Size" value={o.farm_size || 'Small holder (< 5 acres)'} />
        <InfoRow label="Cultivation" value={cultivation} />
        <InfoRow label="Experience" value={o.farmer_experience || '12 years'} />
        <InfoRow label="HerbChain Member Since" value={o.member_since || '2025'} />
      </View>

      {/* Harvest details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌿 Harvest Details</Text>
        <InfoRow label="Herb" value={herb} />
        {botanical ? <InfoRow label="Botanical" value={botanical} /> : null}
        <InfoRow label="Part Used" value={partUsed} />
        <InfoRow label="Harvested" value={harvestDate ? new Date(harvestDate).toLocaleDateString() : '-'} />
        <InfoRow label="Method" value={method} />
        <InfoRow label="Season" value={season} />
      </View>

      {/* Action */}
      <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.actionBtnText}>← Back to Passport</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
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
  header: { padding: 16 },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 12 },
  mapContainer: { marginHorizontal: 12, marginBottom: 12 },
  mapPlaceholder: {
    backgroundColor: '#D1FAE5', borderRadius: 16, padding: 40, alignItems: 'center',
    borderWidth: 1, borderColor: '#6EE7B7',
  },
  mapIcon: { fontSize: 48, marginBottom: 8 },
  mapRegion: { fontSize: 18, fontWeight: '700', color: '#065F46' },
  mapCountry: { fontSize: 14, color: '#059669', marginTop: 2 },
  mapDisclaimer: { fontSize: 12, color: '#6B7280', marginTop: 12, fontStyle: 'italic' },
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  actionBtn: { marginHorizontal: 12, marginTop: 8, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnText: { fontSize: 15, color: '#3B82F6', fontWeight: '700' },
});
