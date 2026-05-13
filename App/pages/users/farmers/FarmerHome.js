/**
 * Farmer v1 home — list of my batches, register a new one, show the active QR.
 *
 * Backed by:
 *     GET  /api/v1/batches/mine
 *     POST /api/v1/batches              (create)
 *     GET  /api/v1/batches/<id>/qr      (re-fetch active QR)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { QrTokenDisplay, RoleHomeShell } from '../../../components';
import { useAuth } from '../../../contexts/AuthContext';
import { BatchesAPI } from '../../../services/apiClient';

const PHASE_LABEL = {
  with_farmer: 'With you',
  in_transit_to_lab: 'In transit to lab',
  at_lab: 'At lab',
  with_farmer_after_lab: 'Returned from lab',
  in_transit_to_manufacturer: 'In transit to manufacturer',
  with_manufacturer: 'With manufacturer',
  consumed: 'Used in product',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function FarmerHome() {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [qrModal, setQrModal] = useState(null); // { batch_id, qr_token, qr_png }

  // Register form state
  const [species, setSpecies] = useState('');
  const [harvestDate, setHarvestDate] = useState(todayIso());
  const [location, setLocation] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await BatchesAPI.listMine(accessToken);
      setBatches(data.batches || []);
    } catch (err) {
      Alert.alert('Could not load batches', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegister = async () => {
    if (!species.trim() || !location.trim() || !weight) {
      Alert.alert('Required', 'Species, location and weight (kg) are required.');
      return;
    }
    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid weight', 'Weight must be a positive number.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await BatchesAPI.create(accessToken, {
        species_name: species.trim(),
        harvest_date: harvestDate,
        location: location.trim(),
        weight_kg: weightNum,
        notes: notes.trim() || undefined,
      });
      setShowRegister(false);
      setSpecies('');
      setLocation('');
      setWeight('');
      setNotes('');
      setNotes('');
      setQrModal({
        batch_id: created.herb.batch_id,
        qr_token: created.qr_token,
        qr_png: created.qr_png,
      });
      await load();
    } catch (err) {
      Alert.alert('Could not register batch', err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const showQrFor = async (batch) => {
    try {
      const data = await BatchesAPI.getQr(accessToken, batch.herb.batch_id);
      setQrModal({
        batch_id: batch.herb.batch_id,
        qr_token: data.qr_token,
        qr_png: data.qr_png,
      });
    } catch (err) {
      Alert.alert('No active QR', err?.message || 'This batch has no active QR.');
    }
  };

  return (
    <RoleHomeShell
      title="My batches"
      subtitle="Register harvest, show QR to transporter"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <TouchableOpacity style={styles.primary} onPress={() => setShowRegister(true)}>
        <Text style={styles.primaryText}>+ Register new batch</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : batches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No batches yet</Text>
          <Text style={styles.emptyText}>
            Register your first harvest to get started.
          </Text>
        </View>
      ) : (
        batches.map((b) => (
          <View key={b.herb.batch_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{b.herb.species_name}</Text>
              <Text style={styles.cardId}>{b.herb.batch_id}</Text>
            </View>
            <Text style={styles.cardMeta}>
              {b.herb.weight_kg} kg · harvested {b.herb.harvest_date} · {b.herb.location}
            </Text>
            <View style={styles.row}>
              <Text style={styles.phaseChip}>{PHASE_LABEL[b.state.phase] || b.state.phase}</Text>
              <Text style={styles.testChip}>
                Test: {b.state.test_result}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondary} onPress={() => showQrFor(b)}>
                <Text style={styles.secondaryText}>Show QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Register modal */}
      <Modal
        visible={showRegister}
        animationType="slide"
        onRequestClose={() => setShowRegister(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Register a harvest</Text>

          <Text style={styles.label}>Species *</Text>
          <TextInput
            style={styles.input}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g. Tulsi (Holy Basil)"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Harvest date</Text>
          <TextInput
            style={styles.input}
            value={harvestDate}
            onChangeText={setHarvestDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Harvest location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Village / district / state"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Optional"
            placeholderTextColor="#9CA3AF"
          />

          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.primary, submitting && styles.busy]}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>Register & mint QR</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRegister(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* QR display modal */}
      <Modal
        visible={Boolean(qrModal)}
        animationType="fade"
        transparent
        onRequestClose={() => setQrModal(null)}
      >
        <View style={styles.qrBackdrop}>
          <View style={styles.qrCard}>
            {qrModal ? (
              <>
                <Text style={styles.qrTitle}>Active QR</Text>
                <Text style={styles.qrSubtitle}>{qrModal.batch_id}</Text>
                <QrTokenDisplay
                  token={qrModal.qr_token}
                  png={qrModal.qr_png}
                  size={240}
                />
                <Text style={styles.qrFootnote}>
                  Show this to the transporter so they can scan it.
                </Text>
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => setQrModal(null)}
                >
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </RoleHomeShell>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  busy: { opacity: 0.7 },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 10,
  },
  secondaryText: { color: '#10B981', fontWeight: '600' },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14 },
  center: { alignItems: 'center', padding: 32 },
  empty: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: '#065F46' },
  emptyText: { color: '#6B7280', marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  cardId: { fontSize: 11, color: '#9CA3AF' },
  cardMeta: { color: '#374151', fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', marginTop: 10, gap: 8 },
  phaseChip: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    marginRight: 6,
  },
  testChip: {
    backgroundColor: '#EEF2FF',
    color: '#3730A3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
  },
  actions: { marginTop: 12, alignItems: 'flex-start' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#065F46', marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    color: '#111827',
  },
  qrBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  qrTitle: { fontSize: 20, fontWeight: '700', color: '#065F46', textAlign: 'center' },
  qrSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  qrFootnote: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
});
