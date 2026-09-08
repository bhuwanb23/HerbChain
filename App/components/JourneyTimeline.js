/**
 * JourneyTimeline — vertical timeline showing product journey from farm to shelf.
 *
 * Stages: Harvest → Collect → Lab Test → Deliver → Manufacture → Verified
 * Each stage is color-coded: green=verified, yellow=partial, gray=unknown
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DEFAULT_STAGES = [
  { key: 'harvest', icon: '🌱', label: 'Harvested', color: '#059669' },
  { key: 'collect', icon: '🚛', label: 'Collected', color: '#3B82F6' },
  { key: 'lab', icon: '🔬', label: 'Lab Certified', color: '#8B5CF6' },
  { key: 'deliver', icon: '🚛', label: 'Delivered', color: '#3B82F6' },
  { key: 'manufacture', icon: '🏭', label: 'Manufactured', color: '#F59E0B' },
  { key: 'verified', icon: '📦', label: 'Verified', color: '#059669' },
];

export default function JourneyTimeline({ journey, stages }) {
  const [expandedStage, setExpandedStage] = useState(null);

  // Map backend journey data to stages
  const timelineStages = (stages || DEFAULT_STAGES).map((stage) => {
    const data = journey?.find?.((j) => j.stage === stage.key || j.type === stage.key || j.action?.includes(stage.key));
    return { ...stage, data };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supply Chain Journey</Text>
      <View style={styles.timeline}>
        {timelineStages.map((stage, index) => {
          const hasData = !!stage.data;
          const isExpanded = expandedStage === stage.key;
          const isLast = index === timelineStages.length - 1;

          return (
            <TouchableOpacity
              key={stage.key}
              style={styles.stageRow}
              onPress={() => setExpandedStage(isExpanded ? null : stage.key)}
              activeOpacity={0.7}
            >
              {/* Left: dot + line */}
              <View style={styles.stageLeft}>
                <View style={[styles.dot, { backgroundColor: hasData ? stage.color : '#D1D5DB' }]}>
                  <Text style={styles.dotIcon}>{stage.icon}</Text>
                </View>
                {!isLast && <View style={[styles.line, { backgroundColor: hasData ? stage.color : '#E5E7EB' }]} />}
              </View>

              {/* Right: content */}
              <View style={[styles.stageRight, isLast && styles.stageRightLast]}>
                <Text style={[styles.stageLabel, hasData && { color: '#111827' }]}>{stage.label}</Text>

                {stage.data && (
                  <>
                    <Text style={styles.stageDate}>{stage.data.date || stage.data.created_at ? new Date(stage.data.created_at || stage.data.date).toLocaleDateString() : ''}</Text>
                    <Text style={styles.stageDesc} numberOfLines={isExpanded ? 10 : 2}>
                      {stage.data.description || stage.data.summary || stage.data.title || ''}
                    </Text>
                  </>
                )}

                {!stage.data && (
                  <Text style={styles.stageUnavailable}>Information not available</Text>
                )}

                {/* Expanded details */}
                {isExpanded && stage.data && (
                  <View style={styles.stageDetails}>
                    {stage.data.location && <Text style={styles.detailRow}>📍 {stage.data.location}</Text>}
                    {stage.data.actor && <Text style={styles.detailRow}>👤 {stage.data.actor}</Text>}
                    {stage.data.entity_type && <Text style={styles.detailRow}>📋 {stage.data.entity_type}</Text>}
                    {stage.data.tests && (
                      <View style={styles.testsGrid}>
                        {stage.data.tests.map((t, i) => (
                          <Text key={i} style={styles.testItem}>
                            {t.result === 'PASSED' || t.status === 'PASSED' ? '✅' : '❌'} {t.name || t.category || `Test ${i + 1}`}
                          </Text>
                        ))}
                      </View>
                    )}
                    {stage.data.blockchain_hash && (
                      <Text style={styles.blockchainHash}>🔗 {stage.data.blockchain_hash.slice(0, 20)}...</Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 12, marginTop: 16 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  timeline: {},
  stageRow: { flexDirection: 'row', marginBottom: 0 },
  stageLeft: { width: 40, alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotIcon: { fontSize: 16 },
  line: { width: 2, flex: 1, minHeight: 20 },
  stageRight: { flex: 1, paddingBottom: 16, paddingLeft: 8 },
  stageRightLast: { paddingBottom: 0 },
  stageLabel: { fontSize: 15, fontWeight: '700', color: '#9CA3AF' },
  stageDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stageDesc: { fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 18 },
  stageUnavailable: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 },
  stageDetails: { marginTop: 8, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  detailRow: { fontSize: 13, color: '#374151', marginTop: 4 },
  testsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  testItem: { fontSize: 12, color: '#374151', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  blockchainHash: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace', marginTop: 6 },
});
