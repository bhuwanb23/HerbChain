import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Share, Linking,
} from 'react-native';
import { VerifyAPI } from '../../../services/apiClient';

const STATUS_CONFIG = {
  verified: { bg: '#D1FAE5', text: '#065F46', icon: '✅', label: 'Verified Authentic' },
  pending: { bg: '#FEF3C7', text: '#92400E', icon: '⏳', label: 'Verification Pending' },
  counterfeit: { bg: '#FEE2E2', text: '#991B1B', icon: '🚨', label: 'Suspected Counterfeit' },
  recall: { bg: '#FEE2E2', text: '#991B1B', icon: '⚠️', label: 'UNDER RECALL' },
  invalid: { bg: '#FEE2E2', text: '#991B1B', icon: '❌', label: 'Invalid QR Code' },
};

export default function ConsumerPortal({ navigation }) {
  const [view, setView] = useState('scan'); // scan | passport | alerts | feedback | report
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState(null);
  const [journey, setJourney] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [scanOutcome, setScanOutcome] = useState(null);
  const [manualToken, setManualToken] = useState('');

  // Feedback form
  const [fbRating, setFbRating] = useState(0);
  const [fbMessage, setFbMessage] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  // Report fake form
  const [rfMessage, setRfMessage] = useState('');
  const [rfEmail, setRfEmail] = useState('');
  const [rfPhone, setRfPhone] = useState('');
  const [rfSubmitting, setRfSubmitting] = useState(false);

  const doScan = async (token) => {
    if (!token?.trim()) return;
    setLoading(true);
    try {
      const res = await VerifyAPI.scan(token.trim());
      const scan = res?.scan || res;
      setScanOutcome(scan.outcome || 'verified');
      setPassport(scan.passport || scan.product || scan);
      setJourney(scan.journey || null);
      setCertificate(scan.certificate || null);
      setView('passport');
    } catch (err) {
      Alert.alert('Scan Failed', err?.message || 'Could not verify this QR code.');
      setScanOutcome('invalid');
      setView('passport');
    }
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!fbMessage.trim()) {
      Alert.alert('Required', 'Please enter your feedback.');
      return;
    }
    setFbSubmitting(true);
    try {
      await VerifyAPI.feedback({
        product_id: passport?.product_id || passport?.id,
        batch_id: passport?.batch_id,
        qr_token: passport?.qr_token,
        rating: fbRating || undefined,
        message: fbMessage.trim(),
        contact_email: fbEmail.trim() || undefined,
      });
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
      setFbMessage('');
      setFbRating(0);
      setFbEmail('');
      setView('passport');
    } catch (_) {
      Alert.alert('Error', 'Failed to submit feedback.');
    }
    setFbSubmitting(false);
  };

  const submitReport = async () => {
    if (!rfMessage.trim()) {
      Alert.alert('Required', 'Please describe the suspected counterfeit.');
      return;
    }
    setRfSubmitting(true);
    try {
      await VerifyAPI.reportFake({
        product_id: passport?.product_id || passport?.id,
        batch_id: passport?.batch_id,
        qr_token: passport?.qr_token,
        message: rfMessage.trim(),
        contact_email: rfEmail.trim() || undefined,
        contact_phone: rfPhone.trim() || undefined,
      });
      Alert.alert('Report Submitted', 'Thank you for helping keep the supply chain safe. Our team will review this report.');
      setRfMessage('');
      setRfEmail('');
      setRfPhone('');
      setView('passport');
    } catch (_) {
      Alert.alert('Error', 'Failed to submit report.');
    }
    setRfSubmitting(false);
  };

  const sharePassport = async () => {
    const name = passport?.product_name || passport?.name || passport?.batch_code || 'Product';
    const qr = passport?.qr_token || passport?.batch_code || '';
    try {
      await Share.share({
        message: `HerbChain Verification: ${name}\nQR: ${qr}\n\nVerified authentic product from India's Ayurvedic supply chain.`,
        title: `Verify: ${name}`,
      });
    } catch (_) {}
  };

  // ─── Scan view ───
  if (view === 'scan') {
    return (
      <View style={styles.container}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanIcon}>📱</Text>
          <Text style={styles.scanTitle}>Scan Product QR</Text>
          <Text style={styles.scanSub}>Point your camera at the QR code on any HerbChain product</Text>
        </View>

        <View style={styles.manualSection}>
          <Text style={styles.manualLabel}>Or enter code manually</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualToken}
              onChangeText={setManualToken}
              placeholder="Enter QR token or batch code"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.manualBtn, loading && styles.btnDisabled]}
              onPress={() => doScan(manualToken)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.manualBtnText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.alertLink} onPress={() => setView('alerts')}>
          <Text style={styles.alertLinkText}>📢 View Safety Alerts</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Passport view ───
  if (view === 'passport') {
    const status = STATUS_CONFIG[scanOutcome] || STATUS_CONFIG.verified;
    const p = passport || {};

    return (
      <ScrollView style={styles.container}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={[styles.statusLabel, { color: status.text }]}>{status.label}</Text>
        </View>

        {/* Product info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{p.product_name || p.name || p.batch_code || 'Product'}</Text>
          {p.species && <Text style={styles.cardSub}>Species: {p.species}</Text>}
          {p.batch_code && <Text style={styles.cardCode}>Batch: {p.batch_code}</Text>}
          {p.qr_token && <Text style={styles.cardCode}>QR: {p.qr_token}</Text>}
        </View>

        {/* Authenticity score */}
        {p.authenticity_score != null && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Authenticity Score</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: p.authenticity_score >= 80 ? '#059669' : p.authenticity_score >= 50 ? '#D97706' : '#DC2626' }]}>
                {p.authenticity_score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
        )}

        {/* Manufacturer */}
        {p.manufacturer && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manufacturer</Text>
            <Text style={styles.cardText}>{typeof p.manufacturer === 'string' ? p.manufacturer : p.manufacturer.name || '-'}</Text>
            {p.manufacturer?.location && <Text style={styles.cardSub}>{p.manufacturer.location}</Text>}
          </View>
        )}

        {/* Ingredients / lineage */}
        {p.ingredients?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {p.ingredients.map((ing, i) => (
              <Text key={i} style={styles.cardText}>• {typeof ing === 'string' ? ing : ing.species || ing.name}</Text>
            ))}
          </View>
        )}

        {/* Origin */}
        {p.origin && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Origin</Text>
            <Text style={styles.cardText}>{typeof p.origin === 'string' ? p.origin : `${p.origin.state || ''}, ${p.origin.country || 'India'}`}</Text>
          </View>
        )}

        {/* Lab certification */}
        {(certificate || p.certificate) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Certification</Text>
            {const C = certificate || p.certificate; (
              <>
                <Text style={styles.cardText}>Level: {C.level || C.certification_level || '-'}</Text>
                <Text style={styles.cardSub}>Status: {C.status || 'certified'}</Text>
                {C.issued_at && <Text style={styles.cardSub}>Issued: {new Date(C.issued_at).toLocaleDateString()}</Text>}
              </>
            )}
          </View>
        )}

        {/* Journey timeline */}
        {journey?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Supply Chain Journey</Text>
            {journey.map((step, i) => (
              <View key={i} style={styles.journeyStep}>
                <View style={[styles.journeyDot, { backgroundColor: i === 0 ? '#059669' : '#3B82F6' }]} />
                <View style={styles.journeyContent}>
                  <Text style={styles.journeyTitle}>{step.title || step.event_type || step.action}</Text>
                  <Text style={styles.journeyDate}>{step.date || step.created_at ? new Date(step.created_at || step.date).toLocaleDateString() : ''}</Text>
                  {step.description && <Text style={styles.journeyDesc}>{step.description}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sustainability */}
        {p.sustainability && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sustainability</Text>
            <Text style={styles.cardText}>{typeof p.sustainability === 'string' ? p.sustainability : JSON.stringify(p.sustainability)}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={sharePassport}>
            <Text style={styles.actionBtnText}>📤 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setView('feedback')}>
            <Text style={styles.actionBtnText}>💬 Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => setView('report')}>
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>🚨 Report Fake</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backLink} onPress={() => { setView('scan'); setPassport(null); setJourney(null); setCertificate(null); setScanOutcome(null); }}>
          <Text style={styles.backLinkText}>← Scan Another</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─── Alerts view ───
  if (view === 'alerts') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('scan')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Alerts</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>📢</Text>
          <Text style={styles.title}>Safety & Recall Alerts</Text>
          <Text style={styles.subtitle}>Active safety notices and product recalls will appear here.</Text>
          <Text style={[styles.cardSub, { marginTop: 16 }]}>No active alerts at this time.</Text>
        </View>
      </View>
    );
  }

  // ─── Feedback view ───
  if (view === 'feedback') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('passport')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.formLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setFbRating(star)}>
                <Text style={[styles.star, fbRating >= star && styles.starActive]}>{fbRating >= star ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Your Feedback</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={fbMessage}
            onChangeText={setFbMessage}
            placeholder="Share your experience with this product..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.formLabel}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={fbEmail}
            onChangeText={setFbEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.submitBtn, fbSubmitting && styles.btnDisabled]}
            onPress={submitFeedback}
            disabled={fbSubmitting}
          >
            {fbSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Feedback</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Report fake view ───
  if (view === 'report') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('passport')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Counterfeit</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ If you believe this product is counterfeit or tampered with, please describe the issue below. Your report will be reviewed by our compliance team.</Text>
          </View>

          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={rfMessage}
            onChangeText={setRfMessage}
            placeholder="Describe why you suspect this product is counterfeit (min 5 characters)..."
            multiline
            numberOfLines={5}
          />

          <Text style={styles.formLabel}>Your Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={rfEmail}
            onChangeText={setRfEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
          />

          <Text style={styles.formLabel}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            value={rfPhone}
            onChangeText={setRfPhone}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.submitBtn, styles.reportSubmitBtn, rfSubmitting && styles.btnDisabled]}
            onPress={submitReport}
            disabled={rfSubmitting}
          >
            {rfSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  // Scan
  scanHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  scanIcon: { fontSize: 64, marginBottom: 16 },
  scanTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  scanSub: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  manualSection: { paddingHorizontal: 20, marginTop: 20 },
  manualLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: {
    flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 15,
  },
  manualBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  manualBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  alertLink: { marginTop: 24, alignItems: 'center' },
  alertLinkText: { fontSize: 15, color: '#3B82F6', fontWeight: '600' },
  // Status
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  statusIcon: { fontSize: 24 },
  statusLabel: { fontSize: 16, fontWeight: '800' },
  // Cards
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardCode: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 },
  cardText: { fontSize: 14, color: '#374151', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  // Score
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 36, fontWeight: '800' },
  scoreMax: { fontSize: 16, color: '#9CA3AF', marginLeft: 4 },
  // Journey
  journeyStep: { flexDirection: 'row', marginBottom: 12 },
  journeyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 10 },
  journeyContent: { flex: 1 },
  journeyTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  journeyDate: { fontSize: 12, color: '#9CA3AF' },
  journeyDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
  reportBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  backLink: { marginTop: 20, alignItems: 'center' },
  backLinkText: { fontSize: 15, color: '#3B82F6', fontWeight: '600' },
  // Form
  form: { padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: '#D1D5DB' },
  starActive: { color: '#F59E0B' },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  reportSubmitBtn: { backgroundColor: '#DC2626' },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  warningBanner: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
});
