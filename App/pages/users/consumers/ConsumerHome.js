/**
 * Consumer v1 home — scan a product/batch QR and see its full journey.
 *
 * Public, unauthenticated reads:
 *     POST /api/v1/traceability/resolve     { qr_token }
 *     GET  /api/v1/traceability/batch/<id>
 *     GET  /api/v1/traceability/product/<id>
 */
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RoleHomeShell, ScanQrSheet } from '../../../components';
import { ApiError, TraceabilityAPI } from '../../../services/apiClient';

const PHASE_LABEL = {
  with_farmer: 'With farmer',
  in_transit_to_lab: 'In transit to lab',
  at_lab: 'At lab',
  with_farmer_after_lab: 'Returned from lab',
  in_transit_to_manufacturer: 'In transit to manufacturer',
  with_manufacturer: 'With manufacturer',
  consumed: 'Packaged into product',
};

export default function ConsumerHome() {
  const [scanOpen, setScanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [journey, setJourney] = useState(null);
  const [manualId, setManualId] = useState('');

  const handleScan = async (token) => {
    setBusy(true);
    try {
      const resp = await TraceabilityAPI.resolve(token);
      setJourney(resp);
      setScanOpen(false);
    } catch (err) {
      Alert.alert(
        'Could not resolve QR',
        err instanceof ApiError ? err.message : err?.message || 'Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const lookupManual = async () => {
    const id = manualId.trim();
    if (!id) {
      Alert.alert('Empty', 'Enter a batch or product ID.');
      return;
    }
    setBusy(true);
    try {
      if (id.startsWith('PROD-')) {
        const data = await TraceabilityAPI.product(id);
        setJourney({ kind: 'product', journey: data });
      } else {
        const data = await TraceabilityAPI.batch(id);
        setJourney({ kind: 'batch', journey: data });
      }
      setManualId('');
    } catch (err) {
      Alert.alert('Not found', err?.message || 'No record for that id.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <RoleHomeShell title="Trace your herbs" subtitle="Scan or look up any HerbChain QR">
      <TouchableOpacity style={styles.primary} onPress={() => setScanOpen(true)}>
        <Text style={styles.primaryText}>Scan product QR</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Or look up by ID</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={manualId}
          onChangeText={setManualId}
          placeholder="PROD-… or HERB-…"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={lookupManual} style={styles.lookup} disabled={busy}>
          <Text style={styles.lookupText}>Look up</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <ScanQrSheet
          title="Scan a HerbChain QR"
          onScanned={handleScan}
          onCancel={() => setScanOpen(false)}
          busy={busy}
        />
      </Modal>

      <Modal
        visible={Boolean(journey)}
        animationType="slide"
        onRequestClose={() => setJourney(null)}
      >
        {journey ? (
          <JourneyView data={journey} onClose={() => setJourney(null)} />
        ) : (
          <View />
        )}
      </Modal>
    </RoleHomeShell>
  );
}

function JourneyView({ data, onClose }) {
  if (data.kind === 'product') {
    const j = data.journey;
    return (
      <ScrollView style={styles.journeyContainer}>
        <View style={styles.journeyHeader}>
          <Text style={styles.journeyTitle}>{j.product.name}</Text>
          <Text style={styles.journeySub}>{j.product.product_id}</Text>
        </View>
        <SummaryCard
          chips={[
            `${j.summary.total_source_batches} source batches`,
            j.summary.all_certified ? '✓ All certified' : '⚠ Not all certified',
          ]}
        />
        {(j.source_batches || []).map((src) => (
          <View key={src.batch_id} style={styles.sectionBox}>
            <Text style={styles.sectionTitle2}>Source batch — {src.batch_id}</Text>
            <Text style={styles.sectionMeta}>
              {src.quantity_kg} kg · {src.journey.herb.species_name}
            </Text>
            <Timeline events={src.journey.journey} />
          </View>
        ))}
        <TouchableOpacity style={styles.primary} onPress={onClose}>
          <Text style={styles.primaryText}>Close</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  }

  const j = data.journey;
  return (
    <ScrollView style={styles.journeyContainer}>
      <View style={styles.journeyHeader}>
        <Text style={styles.journeyTitle}>{j.herb.species_name}</Text>
        <Text style={styles.journeySub}>{j.batch_id}</Text>
      </View>
      <SummaryCard
        chips={[
          `${j.summary.total_steps} steps`,
          `${j.summary.total_days} days`,
          j.summary.quality_certified ? '✓ Lab-approved' : 'No lab approval',
          `Phase: ${PHASE_LABEL[j.summary.current_phase] || j.summary.current_phase}`,
        ]}
      />
      <Timeline events={j.journey} />
      <TouchableOpacity style={styles.primary} onPress={onClose}>
        <Text style={styles.primaryText}>Close</Text>
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function SummaryCard({ chips = [] }) {
  return (
    <View style={styles.summary}>
      {chips.map((c) => (
        <Text key={c} style={styles.summaryChip}>
          {c}
        </Text>
      ))}
    </View>
  );
}

function Timeline({ events = [] }) {
  return (
    <View style={{ marginTop: 12 }}>
      {events.map((step) => (
        <View key={step.event_id} style={styles.step}>
          <View style={styles.dot} />
          <View style={styles.stepBody}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepMeta}>
              {step.occurred_at ? step.occurred_at.slice(0, 19).replace('T', ' ') : ''}
              {step.location ? ` · ${step.location}` : ''}
            </Text>
            {step.actor ? (
              <Text style={styles.stepActor}>
                {step.actor.role} — {step.actor.name}
              </Text>
            ) : null}
            {step.lab_report ? (
              <Text style={styles.stepReport}>
                Lab outcome: {step.lab_report.outcome.toUpperCase()}
                {step.lab_report.certification_level
                  ? ` · ${step.lab_report.certification_level}`
                  : ''}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  lookup: {
    marginLeft: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  lookupText: { color: '#FFF', fontWeight: '700' },

  journeyContainer: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  journeyHeader: { marginTop: 8 },
  journeyTitle: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  journeySub: { color: '#6B7280', marginBottom: 12 },

  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    marginVertical: 12,
  },
  summaryChip: {
    backgroundColor: '#FFF',
    color: '#065F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    marginRight: 6,
    marginBottom: 6,
  },

  sectionBox: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle2: { fontWeight: '800', color: '#111827' },
  sectionMeta: { color: '#374151', marginTop: 4 },
  step: { flexDirection: 'row', marginBottom: 14 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginTop: 4,
    marginRight: 12,
  },
  stepBody: { flex: 1 },
  stepLabel: { fontWeight: '700', color: '#111827' },
  stepMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  stepActor: { color: '#374151', fontSize: 12, marginTop: 2 },
  stepReport: { color: '#065F46', fontWeight: '700', marginTop: 4 },
});
