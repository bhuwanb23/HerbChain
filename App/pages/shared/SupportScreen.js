import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SupportAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const FAQ_ITEMS = [
  { q: 'How do I register a new batch?', a: 'Go to Batches → Register Batch. Fill in species, weight, harvest date, and GPS location. The system will generate a QR token for tracking.' },
  { q: 'How do I accept a transfer request?', a: 'Go to Requests tab. You will see pending transfer requests from transporters. Tap Approve to accept or Reject to decline.' },
  { q: 'How do I scan a QR code?', a: 'Tap the Scanner tab and point your camera at the QR code on any batch. The app will show full traceability information.' },
  { q: 'What do I do if my batch is rejected by the lab?', a: 'Check the rejection reason in your batch details. You can re-register the batch after addressing the issue, or contact support for help.' },
  { q: 'How do I track my shipment?', a: 'Go to the Trips tab (transporter) or Batches tab (farmer) to see shipment status. Real-time GPS tracking is available for in-transit shipments.' },
];

const STATUS_COLORS = {
  open: '#F59E0B',
  in_progress: '#3B82F6',
  resolved: '#10B981',
  closed: '#6B7280',
};

export default function SupportScreen() {
  const { accessToken } = useAuth();
  const [view, setView] = useState('main'); // main | faq | tickets | create | detail
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Create form state
  const [formCategory, setFormCategory] = useState('general');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await SupportAPI.list(accessToken);
      setTickets(data?.tickets || []);
    } catch (_) {
      setTickets([]);
    }
  }, [accessToken]);

  const fetchTicketDetail = async (id) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await SupportAPI.get(accessToken, id);
      setSelectedTicket(data?.ticket);
      setView('detail');
    } catch (_) {}
    setLoading(false);
  };

  const submitTicket = async () => {
    if (!formSubject.trim() || !formDescription.trim()) {
      Alert.alert('Required', 'Please fill in subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      await SupportAPI.create(accessToken, {
        category: formCategory,
        subject: formSubject.trim(),
        description: formDescription.trim(),
      });
      Alert.alert('Submitted', 'Your support ticket has been created.');
      setFormSubject('');
      setFormDescription('');
      setFormCategory('general');
      setView('tickets');
      fetchTickets();
    } catch (e) {
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    }
    setSubmitting(false);
  };

  // ─── Main menu ───
  if (view === 'main') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => setView('faq')}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuTitle}>FAQ</Text>
            <Text style={styles.menuSub}>Common questions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => { setView('tickets'); fetchTickets(); }}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={styles.menuTitle}>My Tickets</Text>
            <Text style={styles.menuSub}>{tickets.length} tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuCard} onPress={() => setView('create')}>
            <Text style={styles.menuIcon}>✉️</Text>
            <Text style={styles.menuTitle}>New Ticket</Text>
            <Text style={styles.menuSub}>Report an issue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── FAQ view ───
  if (view === 'faq') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={{ width: 60 }} />
        </View>
        <FlatList
          data={FAQ_ITEMS}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.faqCard}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqRow}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqArrow}>{expandedFaq === index ? '▼' : '▶'}</Text>
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqA}>{item.a}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ─── Create ticket ───
  if (view === 'create') {
    const categories = ['general', 'bug', 'feature', 'account', 'compliance', 'other'];
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Ticket</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, formCategory === c && styles.chipActive]}
                onPress={() => setFormCategory(c)}
              >
                <Text style={[styles.chipText, formCategory === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            value={formSubject}
            onChangeText={setFormSubject}
            placeholder="Brief summary of your issue"
            maxLength={200}
          />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formDescription}
            onChangeText={setFormDescription}
            placeholder="Describe your issue in detail (min 10 characters)"
            multiline
            numberOfLines={5}
            maxLength={5000}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submitTicket}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Ticket detail ───
  if (view === 'detail' && selectedTicket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('tickets')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedTicket.ticket_no}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailSubject}>{selectedTicket.subject}</Text>
          <View style={styles.detailMeta}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedTicket.status] || '#6B7280' }]}>
              <Text style={styles.statusText}>{selectedTicket.status?.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.detailCategory}>{selectedTicket.category}</Text>
          </View>
          <Text style={styles.detailBody}>{selectedTicket.body}</Text>
          <Text style={styles.detailTime}>
            Created: {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString() : ''}
          </Text>
          {selectedTicket.assignee && (
            <Text style={styles.detailAssignee}>
              Assigned to: {selectedTicket.assignee.full_name}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ─── Ticket list ───
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('main')}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity onPress={() => setView('create')}>
          <Text style={styles.createBtn}>+ New</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : tickets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.icon}>🎫</Text>
          <Text style={styles.title}>No tickets yet</Text>
          <Text style={styles.subtitle}>Tap "+ New" to create a support ticket</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchTickets(); setRefreshing(false); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.ticketCard} onPress={() => fetchTicketDetail(item.id)}>
              <View style={styles.ticketRow}>
                <Text style={styles.ticketNo}>{item.ticket_no}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }]}>
                  <Text style={styles.statusText}>{item.status?.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.ticketTime}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                {item.category ? ` · ${item.category}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  createBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '700' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  menuCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  menuSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  faqCard: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  faqArrow: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  faqA: { fontSize: 14, color: '#6B7280', marginTop: 10, lineHeight: 20 },
  form: { padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#111827',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ticketCard: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketNo: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 6 },
  ticketTime: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  detailCard: { backgroundColor: '#FFF', margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailSubject: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  detailCategory: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  detailBody: { fontSize: 15, color: '#374151', marginTop: 14, lineHeight: 22 },
  detailTime: { fontSize: 12, color: '#9CA3AF', marginTop: 12 },
  detailAssignee: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
