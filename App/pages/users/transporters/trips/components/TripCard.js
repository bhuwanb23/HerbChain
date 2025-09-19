import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const TripCard = ({ mode, item, onScan, showQR = true }) => {
  const isPending = mode === 'pending';
  const leftColor = isPending ? '#F59E0B' : '#10B981';
  const iconName = isPending ? 'pending' : 'local-shipping';
  const bubbleBg = `${leftColor}1A`;
  const bubbleBd = `${leftColor}33`;
  return (
    <View style={[styles.card, { borderLeftColor: leftColor }]}> 
      <View style={styles.topRow}>
        <View style={[styles.iconChip, { backgroundColor: bubbleBg, borderColor: bubbleBd }]}> 
          <Icon name={iconName} size={18} color={leftColor} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Batch {item.batch_id}</Text>
          <Text style={styles.subtitle}>{item.species_name} • {item.weight_kg} kg</Text>
          <Text style={styles.meta}>{isPending ? `Farmer: ${item?.farmer?.name || item.farmer_id}` : `Owner: ${item.current_owner}`}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: bubbleBg, borderColor: bubbleBd }]}> 
          <Text style={[styles.badgeText, { color: leftColor }]}>{isPending ? 'Pending' : 'In Transit'}</Text>
        </View>
      </View>

      {!isPending && showQR && (() => {
        const qr = item.new_qr_code || item.active_qr;
        if (!qr) return null;
        return (
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Transporter QR</Text>
            <Image source={{ uri: qr }} style={{ width: 160, height: 160, backgroundColor: '#FFF', borderRadius: 8 }} />
          </View>
        );
      })()}

      {isPending && (
        <View style={{ marginTop: 10, flexDirection: 'row' }}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => onScan && onScan(item)}>
            <Icon name="qr-code-scanner" size={16} color="#FFFFFF" />
            <Text style={styles.scanText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 16,
  },
  topRow: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});


