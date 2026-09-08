import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Share,
} from 'react-native';
import { DocumentsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const DOC_CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'lab_report', label: 'Lab Reports' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'photo', label: 'Photos' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'identity', label: 'Identity' },
  { key: 'other', label: 'Other' },
];

const CATEGORY_ICONS = {
  lab_report: '🧪',
  certificate: '📜',
  photo: '📷',
  invoice: '🧾',
  identity: '🪪',
  other: '📄',
};

const API_BASE = require('../../services/apiClient').API_BASE_URL;

export default function DocumentsScreen() {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const opts = { limit: 100 };
      if (activeCategory) opts.doc_kind = activeCategory;
      const data = await DocumentsAPI.list(accessToken, opts);
      setDocuments(data?.documents || []);
    } catch (_) {
      setDocuments([]);
    }
  }, [accessToken, activeCategory]);

  useEffect(() => {
    setLoading(true);
    fetchDocs().finally(() => setLoading(false));
  }, [fetchDocs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocs();
    setRefreshing(false);
  };

  const downloadDoc = async (doc) => {
    // In a real app, this would use expo-file-system to download and open
    Alert.alert('Download', `Downloading "${doc.file_name}"...\n\nIn production, this opens the file in your default viewer.`);
  };

  const shareDoc = async (doc) => {
    try {
      // Create a share link if the doc supports it
      if (doc.share_code) {
        await Share.share({
          message: `View document: ${doc.file_name}\n${API_BASE}/api/v1/documents/shares/${doc.share_code}`,
          title: doc.file_name,
        });
      } else {
        await Share.share({
          message: `Document: ${doc.file_name} (${doc.doc_kind || 'file'})`,
          title: doc.file_name,
        });
      }
    } catch (_) {}
  };

  const createShareLink = async (doc) => {
    try {
      const data = await DocumentsAPI.createShare(accessToken, doc.id, { expires_in_hours: 72 });
      const code = data?.share?.code || data?.code;
      if (code) {
        const link = `${API_BASE}/api/v1/documents/shares/${code}`;
        await Share.share({ message: link, title: `Share: ${doc.file_name}` });
        Alert.alert('Share Link Created', `Link valid for 72 hours:\n${link}`);
      }
    } catch (_) {
      Alert.alert('Error', 'Could not create share link.');
    }
  };

  // ─── Document detail modal ───
  if (selectedDoc) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedDoc(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedDoc.file_name}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailIcon}>{CATEGORY_ICONS[selectedDoc.doc_kind] || '📄'}</Text>
          <Text style={styles.detailName}>{selectedDoc.file_name}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{selectedDoc.doc_kind || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{formatSize(selectedDoc.size_bytes)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{selectedDoc.category || selectedDoc.doc_kind || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailValue}>{selectedDoc.visibility || 'RESTRICTED'}</Text>
          </View>
          {selectedDoc.entity_type && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Linked to</Text>
              <Text style={styles.detailValue}>{selectedDoc.entity_type} · {selectedDoc.entity_id?.slice(0, 8)}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{selectedDoc.created_at ? new Date(selectedDoc.created_at).toLocaleDateString() : '-'}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => downloadDoc(selectedDoc)}>
              <Text style={styles.actionBtnText}>📥 Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => createShareLink(selectedDoc)}>
              <Text style={styles.actionBtnText}>🔗 Share Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => shareDoc(selectedDoc)}>
              <Text style={styles.actionBtnText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Main list ───
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      {/* Category tabs */}
      <FlatList
        horizontal
        data={DOC_CATEGORIES}
        keyExtractor={(c) => c.key || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, activeCategory === item.key && styles.catChipActive]}
            onPress={() => setActiveCategory(item.key)}
          >
            <Text style={[styles.catChipText, activeCategory === item.key && styles.catChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : documents.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.icon}>📁</Text>
          <Text style={styles.title}>No documents</Text>
          <Text style={styles.subtitle}>Documents uploaded to your batches and certificates will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.docCard} onPress={() => setSelectedDoc(item)}>
              <Text style={styles.docIcon}>{CATEGORY_ICONS[item.doc_kind] || '📄'}</Text>
              <View style={styles.docContent}>
                <Text style={styles.docName} numberOfLines={1}>{item.file_name}</Text>
                <Text style={styles.docMeta}>
                  {item.doc_kind || 'file'} · {formatSize(item.size_bytes)}
                  {item.entity_type ? ` · ${item.entity_type}` : ''}
                </Text>
              </View>
              <Text style={styles.docArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8,
  },
  catChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  catChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  catChipTextActive: { color: '#FFF' },
  docCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  docIcon: { fontSize: 24, marginRight: 12 },
  docContent: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  docMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  docArrow: { fontSize: 18, color: '#D1D5DB' },
  detailCard: {
    backgroundColor: '#FFF', margin: 12, padding: 20, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  detailIcon: { fontSize: 48, marginBottom: 8 },
  detailName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  actionBtn: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  actionBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },
});
