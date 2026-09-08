/**
 * AuthenticityBadge — 5-factor verification badge for consumer passport.
 *
 * Factors: QR Validity, Chain Completeness, Lab Certification, Recall Status, Blockchain Proof
 * Badge: AUTHENTIC (5/5), MOSTLY VERIFIED (4/5), PARTIALLY VERIFIED (3/5), SUSPICIOUS (≤2), COUNTERFEIT (0)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const BADGE_LEVELS = {
  5: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', icon: '✅', label: 'AUTHENTIC', scoreLabel: 'Fully Verified' },
  4: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', icon: '⚠️', label: 'MOSTLY VERIFIED', scoreLabel: 'Minor Gaps' },
  3: { bg: '#FED7AA', text: '#9A3412', border: '#FB923C', icon: '⚠️', label: 'PARTIALLY VERIFIED', scoreLabel: 'Some Missing' },
  2: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', icon: '❌', label: 'SUSPICIOUS', scoreLabel: 'Exercise Caution' },
  1: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', icon: '❌', label: 'SUSPICIOUS', scoreLabel: 'Exercise Caution' },
  0: { bg: '#FEE2E2', text: '#7F1D1D', border: '#DC2626', icon: '🚫', label: 'COUNTERFEIT', scoreLabel: 'Not Registered' },
};

const FACTORS = [
  { key: 'qr_valid', label: 'QR Validity', description: 'Product QR is active and valid' },
  { key: 'chain_complete', label: 'Supply Chain Complete', description: 'All batches have full custody chain' },
  { key: 'lab_certified', label: 'Laboratory Certified', description: 'All batches tested and passed' },
  { key: 'no_recall', label: 'No Active Recalls', description: 'Product not subject to any recall' },
  { key: 'blockchain_proof', label: 'Blockchain Verified', description: 'Critical events recorded on ledger' },
];

export default function AuthenticityBadge({ verification, onPress }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate score from verification factors or use provided score
  const factors = verification?.factors || {};
  const score = verification?.score ?? verification?.authenticity_score ?? calculateScore(factors);
  const level = BADGE_LEVELS[Math.min(score, 5)] || BADGE_LEVELS[0];

  return (
    <View>
      {/* Main badge */}
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: level.bg, borderColor: level.border }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.badgeIcon}>{level.icon}</Text>
        <Text style={[styles.badgeLabel, { color: level.text }]}>{level.label}</Text>
        <Text style={[styles.badgeScore, { color: level.text }]}>{score}/5 Checks Passed</Text>
        <Text style={[styles.badgeExpand, { color: level.text }]}>
          {expanded ? '▲ Hide Details' : '▼ Tap for Details'}
        </Text>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          {FACTORS.map((factor) => {
            const passed = factors[factor.key] === true || factors[factor.key] === 'passed';
            return (
              <View key={factor.key} style={styles.factorRow}>
                <Text style={styles.factorIcon}>{passed ? '✅' : '❌'}</Text>
                <View style={styles.factorContent}>
                  <Text style={[styles.factorLabel, !passed && styles.factorFailed]}>{factor.label}</Text>
                  <Text style={styles.factorDesc}>{factor.description}</Text>
                </View>
              </View>
            );
          })}
          <View style={styles.scoreFooter}>
            <Text style={[styles.scoreFooterText, { color: level.text }]}>
              Score: {score}/5 — {level.scoreLabel}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function calculateScore(factors) {
  let score = 0;
  if (factors.qr_valid === true || factors.qr_valid === 'passed') score++;
  if (factors.chain_complete === true || factors.chain_complete === 'passed') score++;
  if (factors.lab_certified === true || factors.lab_certified === 'passed') score++;
  if (factors.no_recall === true || factors.no_recall === 'passed') score++;
  if (factors.blockchain_proof === true || factors.blockchain_proof === 'passed') score++;
  return score;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16, borderWidth: 2, padding: 20, alignItems: 'center', marginHorizontal: 12, marginTop: 12,
  },
  badgeIcon: { fontSize: 40, marginBottom: 4 },
  badgeLabel: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  badgeScore: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  badgeExpand: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  details: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  factorIcon: { fontSize: 18, marginRight: 10, marginTop: 2 },
  factorContent: { flex: 1 },
  factorLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  factorFailed: { color: '#DC2626' },
  factorDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scoreFooter: { paddingTop: 12, alignItems: 'center' },
  scoreFooterText: { fontSize: 14, fontWeight: '800' },
});
