/**
 * Crop calendar — list crop plans grouped by status, add a new plan.
 *
 * Backed by GET/POST /api/v1/crop-plans (+ catalogue lookup for species).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { CatalogueAPI, CropPlansAPI } from '../../../../services/apiClient';

const STATUS_COLORS = {
  planned: '#3B82F6',
  sown: '#F59E0B',
  growing: '#10B981',
  harvested: '#6B7280',
  cancelled: '#EF4444',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntil(dateIso) {
  if (!dateIso) return null;
  const due = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}

export default function CropCalendarScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [catalogue, setCatalogue] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [speciesId, setSpeciesId] = useState('');
  const [area, setArea] = useState('');
  const [plantingDate, setPlantingDate] = useState(todayIso());
  const [harvestDate, setHarvestDate] = useState(plusDaysIso(120));
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [planData, catData] = await Promise.all([
        CropPlansAPI.listMine(accessToken),
        CatalogueAPI.list(accessToken),
      ]);
      setPlans(planData.plans || []);
      setCatalogue(catData.species || []);
    } catch (err) {
      Alert.alert('Could not load crop plans', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!speciesId) {
      Alert.alert('Pick a species', 'Choose one from the catalogue.');
      return;
    }
    setSubmitting(true);
    try {
      await CropPlansAPI.create(accessToken, {
        species_id: speciesId,
        area_acres: area ? Number(area) : null,
        planting_date: plantingDate,
        expected_harvest_date: harvestDate,
        status: 'planned',
        notes: notes.trim() || null,
      });
      setShowAdd(false);
      setSpeciesId('');
      setArea('');
      setNotes('');
      await load();
    } catch (err) {
      Alert.alert('Could not add plan', err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const advance = async (plan) => {
    const next = {
      planned: 'sown',
      sown: 'growing',
      growing: 'harvested',
    }[plan.status];
    if (!next) return;
    try {
      await CropPlansAPI.update(accessToken, plan.plan_id, {
        status: next,
        actual_harvest_date: next === 'harvested' ? todayIso() : null,
      });
      await load();
    } catch (err) {
      Alert.alert('Could not update', err?.message || 'Network error');
    }
  };

  const grouped = useMemo(() => {
    const byStatus = {};
    for (const p of plans) {
      (byStatus[p.status] = byStatus[p.status] || []).push(p);
    }
    return byStatus;
  }, [plans]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crop Planning Calendar</Text>
        <Text style={styles.subtitle}>{plans.length} plans · plant→harvest timeline</Text>
      </View>

      <TouchableOpacity style={styles.primary} onPress={() => setShowAdd(true)}>
        <Text style={styles.primaryText}>+ Add crop plan</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {Object.keys(grouped).length === 0 && (
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>
              No plans yet — add your first crop plan.
            </Text>
          )}
          {['planned', 'sown', 'growing', 'harvested', 'cancelled'].map((status) =>
            (grouped[status] || []).length === 0 ? null : (
              <View key={status} style={{ marginBottom: 16 }}>
                <Text style={[styles.section, { color: STATUS_COLORS[status] }]}>
                  {status.toUpperCase()} · {grouped[status].length}
                </Text>
                {grouped[status].map((p) => {
                  const days = daysUntil(p.expected_harvest_date);
                  return (
                    <View key={p.plan_id} style={styles.card}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>
                          {p.species?.common_name || p.species_id}
                        </Text>
                        <Text style={styles.meta}>
                          {p.area_acres ? `${p.area_acres} ac · ` : ''}
                          planted {p.planting_date} · harvest {p.expected_harvest_date}
                        </Text>
                        {days !== null && status !== 'harvested' && status !== 'cancelled' && (
                          <Text
                            style={[
                              styles.countdown,
                              { color: days < 7 ? '#DC2626' : '#10B981' },
                            ]}
                          >
                            {days >= 0
                              ? `${days} day${days === 1 ? '' : 's'} until harvest`
                              : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`}
                          </Text>
                        )}
                      </View>
                      {STATUS_COLORS[p.status] && status !== 'harvested' && status !== 'cancelled' && (
                        <TouchableOpacity style={styles.advance} onPress={() => advance(p)}>
                          <Text style={styles.advanceText}>Mark next →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ),
          )}
        </ScrollView>
      )}

      <Modal
        visible={showAdd}
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.modalTitle}>New crop plan</Text>

          <Text style={styles.label}>Species *</Text>
          <FlatList
            data={catalogue}
            keyExtractor={(it) => it.species_id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSpeciesId(item.species_id)}
                style={[
                  styles.speciesChip,
                  speciesId === item.species_id && styles.speciesChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.speciesChipText,
                    speciesId === item.species_id && styles.speciesChipTextActive,
                  ]}
                >
                  {item.common_name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
          />

          <Text style={styles.label}>Area (acres)</Text>
          <TextInput value={area} onChangeText={setArea} style={styles.input} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Planting date *</Text>
          <TextInput value={plantingDate} onChangeText={setPlantingDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Expected harvest *</Text>
          <TextInput value={harvestDate} onChangeText={setHarvestDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Notes</Text>
          <TextInput value={notes} onChangeText={setNotes} style={[styles.input, { minHeight: 80 }]} multiline placeholderTextColor="#9CA3AF" />

          <TouchableOpacity onPress={submit} disabled={submitting} style={[styles.primary, submitting && { opacity: 0.7 }]}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Save plan</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(false)}>
            <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 12 }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { padding: 32, alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#065F46' },
  subtitle: { color: '#6B7280', fontSize: 12 },
  primary: {
    backgroundColor: '#10B981',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#FFF', fontWeight: '700' },
  section: { fontWeight: '700', fontSize: 12, marginBottom: 8, letterSpacing: 0.6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  name: { fontWeight: '700', color: '#111827', fontSize: 16 },
  meta: { color: '#374151', fontSize: 12, marginTop: 2 },
  countdown: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  advance: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#ECFDF5' },
  advanceText: { color: '#065F46', fontWeight: '600', fontSize: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#065F46', marginVertical: 8 },
  label: { fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  speciesChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E5E7EB' },
  speciesChipActive: { backgroundColor: '#10B981' },
  speciesChipText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  speciesChipTextActive: { color: '#FFF' },
});
