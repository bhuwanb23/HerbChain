/**
 * ShareJourneySheet — bottom sheet for sharing product journey via multiple channels.
 *
 * Options: WhatsApp, Copy Link, QR Code, Share (native)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Share, Alert, Clipboard } from 'react-native';

const API_BASE = require('../services/apiClient').API_BASE_URL;

export default function ShareJourneySheet({ visible, product, onClose }) {
  if (!product) return null;

  const productName = product.product_name || product.name || product.batch_code || 'Product';
  const productId = product.product_id || product.id || product.batch_code || '';
  const qrToken = product.qr_token || '';

  const shareUrl = qrToken
    ? `${API_BASE}/verify/${encodeURIComponent(qrToken)}`
    : productId
      ? `${API_BASE}/verify/${encodeURIComponent(productId)}`
      : '';

  const shareText = `I just verified my ${productName} on HerbChain! ✅ Authentic | 🌱 Organic | 🔬 Lab Certified\nCheck it yourself: ${shareUrl}`;

  const shareWhatsApp = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    import('react-native').then(({ Linking }) => {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share.');
      });
    });
    onClose();
  };

  const copyLink = async () => {
    try {
      await Clipboard.setString(shareUrl);
      Alert.alert('Copied!', 'Link copied to clipboard.');
    } catch (_) {
      Alert.alert('Error', 'Could not copy link.');
    }
    onClose();
  };

  const shareNative = async () => {
    try {
      await Share.share({ message: shareText, title: `Verify: ${productName}`, url: shareUrl });
    } catch (_) {}
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>📤 Share This Journey</Text>
          <Text style={styles.subtitle}>Share {productName}'s verified journey with others</Text>

          <View style={styles.optionsGrid}>
            <OptionBtn icon="📱" label="WhatsApp" onPress={shareWhatsApp} />
            <OptionBtn icon="🔗" label="Copy Link" onPress={copyLink} />
            <OptionBtn icon="📤" label="Share" onPress={shareNative} />
          </View>

          {shareUrl ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewUrl} numberOfLines={2}>{shareUrl}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function OptionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.optionBtn} onPress={onPress}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  handle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  optionsGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  optionBtn: { alignItems: 'center', width: 80 },
  optionIcon: { fontSize: 32, marginBottom: 4 },
  optionLabel: { fontSize: 12, color: '#374151', fontWeight: '600' },
  previewCard: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginBottom: 16 },
  previewUrl: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
});
