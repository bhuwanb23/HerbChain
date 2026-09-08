/**
 * ConsumerPortal — the complete consumer trust experience.
 *
 * Integrates: AuthenticityBadge, JourneyTimeline, RecallAlertOverlay,
 * ShareJourneySheet, OriginStory navigation, LabCertificate navigation.
 *
 * Flow: Scan → Passport (badge + timeline + actions) → Origin / Lab / Share
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Share,
} from 'react-native';
import { VerifyAPI } from '../../../services/apiClient';
import AuthenticityBadge from '../../../components/AuthenticityBadge';
import JourneyTimeline from '../../../components/JourneyTimeline';
import RecallAlertOverlay from '../../../components/RecallAlertOverlay';
import ShareJourneySheet from '../../../components/ShareJourneySheet';

export default function ConsumerPortal({ navigation }) {
  const [view, setView] = useState('scan'); // scan | passport | alerts | feedback | report
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState(null);
  const [journey, setJourney] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [verification, setVerification] = useState(null);
  const [recall, setRecall] = useState(null);
  const [recallAcknowledged, setRecallAcknowledged] = useState(false);
  const [scanOutcome, setScanOutcome] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [showShare, setShowShare] = useState(false);

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
      setScanOutcome(scan.outcome || scan.verification?.outcome || 'verified');
      setPassport(scan.passport || scan.product || scan);
      setJourney(scan.journey || scan.timeline || null);
      setCertificate(scan.certificate || null);
      setVerification(scan.verification || scan.verification_result || null);

      // Check recall status
      if (scan.recall || scan.recall_status === 'active' || scan.product?.recall_status === 'active') {
        setRecall(scan.recall || { reason: scan.recall_reason || 'Product under recall', product_name: scan.product?.product_name });
      }

      setView('passport');
    } catch (err) {
      Alert.alert('Scan Failed', err?.message || 'Could not verify this QR code.');
      setScanOutcome('invalid');
      setView('passport');
    }
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!fbMessage.trim()) { Alert.alert('Required', 'Please enter your feedback.'); return; }
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
      setFbMessage(''); setFbRating(0); setFbEmail('');
      setView('passport');
    } catch (_) { Alert.alert('Error', 'Failed to submit feedback.'); }
    setFbSubmitting(false);
  };

  const submitReport = async () => {
    if (!rfMessage.trim()) { Alert.alert('Required', 'Please describe the suspected counterfeit.'); return; }
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
      Alert.alert('Report Submitted', 'Thank you for helping keep the supply chain safe.');
      setRfMessage(''); setRfEmail(''); setRfPhone('');
      setView('passport');
    } catch (_) { Alert.alert('Error', 'Failed to submit report.'); }
    setRfSubmitting(false);
  };

  const resetScanner = () => {
    setView('scan'); setPassport(null); setJourney(null); setCertificate(null);
    setVerification(null); setRecall(null); setRecallAcknowledged(false);
    setScanOutcome(null); setManualToken('');
  };

  // ─── Scan view ───
  if (view === 'scan') {
    return (
      <View style={styles.container}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanIcon}>📱</Text>
          <Text style={styles.scanTitle}>Verify Product</Text>
          <Text style={styles.scanSub}>Scan the QR code on any HerbChain product to see its full verified journey</Text>
        </View>
        <View style={styles.manualSection}>
          <Text style={styles.manualLabel}>Or enter code manually</Text>
          <View style={styles.manualRow}>
            <TextInput style={styles.manualInput} value={manualToken} onChangeText={setManualToken}
              placeholder="QR token or batch code" autoCapitalize="characters" />
            <TouchableOpacity style={[styles.manualBtn, loading && styles.btnDisabled]}
              onPress={() => doScan(manualToken)} disabled={loading}>
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
    const p = passport || {};

    return (
      <View style={{ flex: 1 }}>
        {/* Recall overlay */}
        {recall && !recallAcknowledged && (
          <RecallAlertOverlay
            recall={recall}
            onAcknowledge={() => setRecallAcknowledged(true)}
            onGoBack={resetScanner}
          />
        )}

        {/* Share sheet */}
        <ShareJourneySheet visible={showShare} product={p} onClose={() => setShowShare(false)} />

        <ScrollView style={styles.container}>
          {/* Recall banner (if acknowledged) */}
          {recall && recallAcknowledged && (
            <View style={styles.recallBanner}>
              <Text style={styles.recallBannerText}>⚠️ This product is under recall. See details below.</Text>
            </View>
          )}

          {/* Authenticity Badge */}
          <AuthenticityBadge verification={verification} />

          {/* Product header */}
          <View style={styles.card}>
            <Text style={styles.productName}>{p.product_name || p.name || p.batch_code || 'Product'}</Text>
            {p.manufacturer && (
              <Text style={styles.productManufacturer}>
                by {typeof p.manufacturer === 'string' ? p.manufacturer : p.manufacturer.name || 'Manufacturer'}
              </Text>
            )}
            {p.manufacturer?.license && <Text style={styles.productLicense}>AYUSH: {p.manufacturer.license}</Text>}
            {p.batch_code && <Text style={styles.productCode}>Batch: {p.batch_code}</Text>}
            {p.species && <Text style={styles.productCode}>Species: {p.species}</Text>}
          </View>

          {/* Journey Timeline */}
          <View style={styles.card}>
            <JourneyTimeline journey={journey} />
          </View>

          {/* Origin shortcut */}
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('OriginStory', { origin: p.origin || journey?.[0]?.data, batch: p })}
          >
            <Text style={styles.navCardIcon}>🌱</Text>
            <View style={styles.navCardContent}>
              <Text style={styles.navCardTitle}>View Origin Story</Text>
              <Text style={styles.navCardSub}>Where these herbs were grown</Text>
            </View>
            <Text style={styles.navCardArrow}>›</Text>
          </TouchableOpacity>

          {/* Lab certificate shortcut */}
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('LabCertificate', { certificate: certificate || p.certificate, batch: p })}
          >
            <Text style={styles.navCardIcon}>🔬</Text>
            <View style={styles.navCardContent}>
              <Text style={styles.navCardTitle}>Lab Certificate</Text>
              <Text style={styles.navCardSub}>Test results and certification</Text>
            </View>
            <Text style={styles.navCardArrow}>›</Text>
          </TouchableOpacity>

          {/* Blockchain proof */}
          {p.blockchain_hash && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🔗 Blockchain Verified</Text>
              <Text style={styles.blockchainHash}>{p.blockchain_hash}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>
              <Text style={styles.actionBtnText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setView('feedback')}>
              <Text style={styles.actionBtnText}>💬 Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => setView('report')}>
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>🚨 Report Fake</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backLink} onPress={resetScanner}>
            <Text style={styles.backLinkText}>← Scan Another Product</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Alerts view ───
  if (view === 'alerts') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('scan')}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Alerts</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>📢</Text>
          <Text style={styles.title}>Safety & Recall Alerts</Text>
          <Text style={styles.subtitle}>Active safety notices and product recalls.</Text>
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
          <TouchableOpacity onPress={() => setView('passport')}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.formLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setFbRating(s)}>
                <Text style={[styles.star, fbRating >= s && styles.starActive]}>{fbRating >= s ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.formLabel}>Your Feedback</Text>
          <TextInput style={[styles.input, styles.textArea]} value={fbMessage} onChangeText={setFbMessage}
            placeholder="Share your experience..." multiline numberOfLines={4} />
          <Text style={styles.formLabel}>Email (optional)</Text>
          <TextInput style={styles.input} value={fbEmail} onChangeText={setFbEmail}
            placeholder="your@email.com" keyboardType="email-address" />
          <TouchableOpacity style={[styles.submitBtn, fbSubmitting && styles.btnDisabled]}
            onPress={submitFeedback} disabled={fbSubmitting}>
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
          <TouchableOpacity onPress={() => setView('passport')}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Report Counterfeit</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ If you believe this product is counterfeit, please describe the issue below. Our compliance team will review this report.</Text>
          </View>
          <Text style={styles.formLabel}>Description *</Text>
          <TextInput style={[styles.input, styles.textArea]} value={rfMessage} onChangeText={setRfMessage}
            placeholder="Describe why you suspect this product is counterfeit..." multiline numberOfLines={5} />
          <Text style={styles.formLabel}>Email (optional)</Text>
          <TextInput style={styles.input} value={rfEmail} onChangeText={setRfEmail}
            placeholder="your@email.com" keyboardType="email-address" />
          <Text style={styles.formLabel}>Phone (optional)</Text>
          <TextInput style={styles.input} value={rfPhone} onChangeText={setRfPhone}
            placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
          <TouchableOpacity style={[styles.submitBtn, styles.reportSubmitBtn, rfSubmitting && styles.btnDisabled]}
            onPress={submitReport} disabled={rfSubmitting}>
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
  cardSub: { fontSize: 13, color: '#6B7280' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF' },
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
  manualInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15 },
  manualBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  manualBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  alertLink: { marginTop: 24, alignItems: 'center' },
  alertLinkText: { fontSize: 15, color: '#3B82F6', fontWeight: '600' },
  // Passport
  recallBanner: { backgroundColor: '#FEE2E2', padding: 12, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  recallBannerText: { fontSize: 14, fontWeight: '700', color: '#991B1B', textAlign: 'center' },
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  productName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  productManufacturer: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  productLicense: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  productCode: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 },
  navCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  navCardIcon: { fontSize: 24, marginRight: 12 },
  navCardContent: { flex: 1 },
  navCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  navCardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  navCardArrow: { fontSize: 18, color: '#D1D5DB' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  blockchainHash: { fontSize: 12, fontFamily: 'monospace', color: '#6B7280', marginTop: 4 },
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
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  warningBanner: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
});
