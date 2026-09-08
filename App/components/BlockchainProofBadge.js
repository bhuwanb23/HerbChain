/**
 * BlockchainProofBadge — reusable component for blockchain verification proof.
 *
 * Compact mode: inline badge (✅/❌/⏳)
 * Expanded mode: full hash, block, timestamp, explorer link
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Share } from 'react-native';

export default function BlockchainProofBadge({ event, compact = true, style }) {
  const [expanded, setExpanded] = useState(false);
  if (!event) return null;

  const verified = event.verified || event.status === 'confirmed';
  const pending = event.status === 'pending' || event.status === 'pending_anchor';

  const badgeColor = verified ? '#059669' : pending ? '#F59E0B' : '#DC2626';
  const badgeBg = verified ? '#D1FAE5' : pending ? '#FEF3C7' : '#FEE2E2';
  const badgeIcon = verified ? '✅' : pending ? '⏳' : '❌';
  const badgeText = verified ? 'Blockchain Verified' : pending ? 'Pending Anchoring' : 'Verification Failed';

  if (compact) {
    return (
      <TouchableOpacity style={[styles.compactBadge, { backgroundColor: badgeBg }, style]} onPress={() => setExpanded(true)}>
        <Text style={styles.compactIcon}>⛓️</Text>
        <Text style={[styles.compactText, { color: badgeColor }]}>{badgeIcon} {badgeText}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={[styles.expandedBadge, { borderColor: badgeColor }, style]} onPress={() => setExpanded(true)}>
        <Text style={styles.expandedIcon}>⛓️</Text>
        <View style={styles.expandedContent}>
          <Text style={[styles.expandedLabel, { color: badgeColor }]}>{badgeText}</Text>
          <Text style={styles.expandedSub}>{event.event_type || event.type || 'Event'}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <Modal visible={expanded} transparent animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⛓️ Blockchain Proof</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>

            <InfoRow label="Event" value={event.event_type || event.type || '-'} />
            <InfoRow label="Status" value={verified ? '✅ Verified' : pending ? '⏳ Pending' : '❌ Failed'} />
            {event.tx_hash && <InfoRow label="Tx Hash" value={event.tx_hash} mono />}
            {event.block_number && <InfoRow label="Block" value={`#${event.block_number}`} />}
            {event.confirmed_at && <InfoRow label="Confirmed" value={new Date(event.confirmed_at).toLocaleString()} />}
            {event.network && <InfoRow label="Network" value={event.network} />}

            {event.db_hash && event.chain_hash && (
              <View style={styles.hashCompare}>
                <Text style={styles.hashLabel}>Verification</Text>
                <InfoRow label="DB Hash" value={event.db_hash} mono />
                <InfoRow label="Chain Hash" value={event.chain_hash} mono />
                <Text style={[styles.matchStatus, { color: event.db_hash === event.chain_hash ? '#059669' : '#DC2626' }]}>
                  {event.db_hash === event.chain_hash ? '✅ Hashes Match' : '❌ Hash Mismatch — Possible Tampering'}
                </Text>
              </View>
            )}

            <Text style={styles.disclaimer}>This record is tamper-proof and independently verifiable on the blockchain.</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { if (event.tx_hash) Share.share({ message: `Tx: ${event.tx_hash}` }); }}>
                <Text style={styles.actionBtnText}>📋 Copy Hash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  compactIcon: { fontSize: 12 },
  compactText: { fontSize: 11, fontWeight: '700' },
  expandedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, marginHorizontal: 12, marginTop: 8 },
  expandedIcon: { fontSize: 20, marginRight: 10 },
  expandedContent: { flex: 1 },
  expandedLabel: { fontSize: 14, fontWeight: '700' },
  expandedSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn: { fontSize: 18, color: '#9CA3AF' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  mono: { fontFamily: 'monospace', fontSize: 11 },
  hashCompare: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 12 },
  hashLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  matchStatus: { fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  disclaimer: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },
});
