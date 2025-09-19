import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Row = ({ label, value }) => (
  <View style={styles.rowBetween}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const HerbDetailsScreen = ({ batch, onBack }) => {
  if (!batch) return null;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Herb Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Herb Photo */}
        {batch.image_url && (
          <View style={styles.card}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Herb Photo</Text>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: batch.image_url }} 
                style={styles.herbImage}
                resizeMode="cover"
              />
            </View>
          </View>
        )}

        {/* QR Code */}
        {(batch.qr_code || batch.active_qr) && batch.status !== 'Accepted' && batch.quality_status !== 'testing' && (
          <View style={styles.card}>
            <Text style={[styles.label, { marginBottom: 8 }]}>QR Code</Text>
            <View style={styles.qrContainer}>
              <Image 
                source={{ uri: batch.qr_code || batch.active_qr }} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrText}>Scan this QR code to verify batch authenticity</Text>
          </View>
        )}

        <View style={styles.card}>
          <Row label="Batch ID" value={batch.batch_id} />
          <Row label="Species" value={batch.species_entered || batch.species_detected} />
          <Row label="Weight" value={batch.weight_kg ? `${batch.weight_kg} kg` : ''} />
          <Row label="Harvest Date" value={batch.harvest_date} />
          <Row label="Cultivation" value={batch.cultivation_method} />
          <Row label="Status" value={batch.status} />
          <Row label="Created" value={batch.created_at} />
          <Row label="Updated" value={batch.updated_at} />
          <Row label="Location" value={batch.geo_location} />
        </View>
        {batch.remarks ? (
          <View style={styles.card}>
            <Text style={[styles.label, { marginBottom: 6 }]}>Notes</Text>
            <Text style={styles.value}>{batch.remarks}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
  },
  container: {
    padding: 16,
  },
  card: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  herbImage: {
    width: '100%',
    height: 200,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  qrText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default HerbDetailsScreen;


