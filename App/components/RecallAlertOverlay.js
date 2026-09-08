/**
 * RecallAlertOverlay — full-screen red warning for recalled products.
 *
 * Cannot be dismissed without acknowledgment. Overrides all other passport content.
 * Shows recall reason, date, instructions, and helpline.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export default function RecallAlertOverlay({ recall, onAcknowledge, onGoBack }) {
  if (!recall) return null;

  return (
    <Modal visible={!!recall} transparent animationType="fade" onRequestClose={onGoBack}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Warning icon */}
          <Text style={styles.warningIcon}>⚠️⚠️⚠️</Text>
          <Text style={styles.title}>PRODUCT RECALL</Text>
          <Text style={styles.titleSub}>⚠️⚠️⚠️</Text>

          {/* Product info */}
          <View style={styles.productCard}>
            <Text style={styles.productName}>{recall.product_name || recall.batch_code || 'Product'}</Text>
            {recall.batch_code && <Text style={styles.productBatch}>Batch: {recall.batch_code}</Text>}
          </View>

          {/* Recall details */}
          <View style={styles.detailCard}>
            <DetailRow label="Recall Date" value={recall.recall_date || recall.created_at ? new Date(recall.recall_date || recall.created_at).toLocaleDateString() : '-'} />
            <DetailRow label="Reason" value={recall.reason || recall.description || 'Safety concern detected'} />
            {recall.recall_type && <DetailRow label="Type" value={recall.recall_type} />}
            {recall.affected_batches && <DetailRow label="Affected Batches" value={String(recall.affected_batches)} />}
          </View>

          {/* Safety instruction */}
          <View style={styles.safetyBox}>
            <Text style={styles.safetyTitle}>⛔ DO NOT CONSUME THIS PRODUCT</Text>
            <Text style={styles.safetyText}>If you have this product:</Text>
            <Text style={styles.safetyStep}>1. Stop using it immediately</Text>
            <Text style={styles.safetyStep}>2. Return to point of purchase</Text>
            <Text style={styles.safetyStep}>3. Contact manufacturer helpline</Text>
            {recall.helpline && (
              <Text style={styles.helpline}>📞 {recall.helpline}</Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.goBackBtn} onPress={onGoBack}>
              <Text style={styles.goBackText}>⬅ Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ackBtn} onPress={onAcknowledge}>
              <Text style={styles.ackText}>I Understand ⚠️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  container: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
    borderWidth: 3, borderColor: '#DC2626',
  },
  warningIcon: { fontSize: 28, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#DC2626', textAlign: 'center', letterSpacing: 2 },
  titleSub: { fontSize: 20, textAlign: 'center', marginBottom: 12 },
  productCard: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, marginBottom: 12, alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  productBatch: { fontSize: 13, color: '#B91C1C', marginTop: 2 },
  detailCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  safetyBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  safetyTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B', marginBottom: 8 },
  safetyText: { fontSize: 13, color: '#B91C1C', marginBottom: 4 },
  safetyStep: { fontSize: 13, color: '#991B1B', marginLeft: 8, marginTop: 2 },
  helpline: { fontSize: 15, fontWeight: '700', color: '#DC2626', marginTop: 10, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  goBackBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  goBackText: { fontSize: 15, color: '#374151', fontWeight: '700' },
  ackBtn: { flex: 1, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  ackText: { fontSize: 15, color: '#FFF', fontWeight: '700' },
});
