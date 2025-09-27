import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import { useLabBatches } from './hooks/useLabBatches';
import { LabBatchList } from './components';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../../../constants/api';

const BatchesPage = ({ navigation }) => {
  const { t } = useGlobalTranslation();
  const [tab, setTab] = useState('all'); // 'all' | 'accepted' | 'archived'
  const [detail, setDetail] = useState(null);
  const { all, accepted, archived, loading, refresh, acceptHerb } = useLabBatches();

  const counts = {
    all: Array.isArray(all) ? all.length : 0,
    accepted: Array.isArray(accepted) ? accepted.length : 0,
    archived: Array.isArray(archived) ? archived.length : 0,
  };

  const route = useRoute();
  const { scannedData, batchId } = route.params || {};

  useEffect(() => {
    const handleDelivery = async () => {
      if (scannedData && batchId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/deliver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lab_id: 'lab_001',
              scanned_qr_text: scannedData,
              delivery_location: 'Lab Facility'
            })
          });
          const json = await res.json();
          if (!res.ok) {
            Alert.alert(t.labBatches?.deliveryFailed || 'Delivery Failed', json.error || (t.labBatches?.unableToValidateQR || 'Unable to validate QR'));
            return;
          }
          Alert.alert(t.labBatches?.deliverySuccess || 'Delivery Success', t.labBatches?.ownershipTransferred || 'Ownership transferred to lab.');
          refresh(); // Refresh the list after successful delivery
        } catch (e) {
          Alert.alert(t.labBatches?.error || 'Error', t.labBatches?.failedToCompleteDelivery || 'Failed to complete delivery');
        }
      }
    };
    handleDelivery();
  }, [scannedData, batchId, refresh]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#22c55e", "#16a34a"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>{t.labBatches?.labBatches || 'Lab Batches'}</Text>
        <Text style={styles.headerSubtitle}>{t.labBatches?.browseAcceptArchive || 'Browse, accept, and archive incoming herbs'}</Text>
      </LinearGradient>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'all' && styles.activeTab]} onPress={() => setTab('all')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'all' && styles.activeTabText]}>{t.labBatches?.batchList || 'Batch List'}</Text>
            <View style={[styles.countPill, tab === 'all' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'all' && styles.countTextActive]}>{counts.all}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'accepted' && styles.activeTab]} onPress={() => setTab('accepted')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'accepted' && styles.activeTabText]}>{t.labBatches?.accepted || 'Accepted'}</Text>
            <View style={[styles.countPill, tab === 'accepted' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'accepted' && styles.countTextActive]}>{counts.accepted}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'archived' && styles.activeTab]} onPress={() => setTab('archived')} activeOpacity={0.9}>
            <Text style={[styles.tabText, tab === 'archived' && styles.activeTabText]}>{t.labBatches?.archived || 'Archived'}</Text>
            <View style={[styles.countPill, tab === 'archived' && styles.countPillActive]}>
              <Text style={[styles.countText, tab === 'archived' && styles.countTextActive]}>{counts.archived}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listWrap}>
        {tab === 'all' ? (
          <LabBatchList data={all} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} variant="all" />
        ) : tab === 'accepted' ? (
          <LabBatchList data={accepted} loading={loading} onRefresh={refresh} acceptHerb={acceptHerb} variant="accepted" />
        ) : (
          <LabBatchList data={archived} loading={loading} onRefresh={refresh} variant="archived" onOpenDetails={setDetail} />
        )}
      </View>

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{t.labBatches?.herbDetails || 'Herb Details'}</Text>
            <TouchableOpacity onPress={() => setDetail(null)} style={{ position: 'absolute', right: 12, top: 12 }}>
              <Text style={{ color: '#3B82F6', fontWeight: '700' }}>{t.labBatches?.close || 'Close'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {detail?.image_url ? (
              <View style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Image source={{ uri: detail.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
              </View>
            ) : null}
            {detail?.active_qr ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{t.labBatches?.labQR || 'Lab QR'}</Text>
                {
                  (() => {
                    const raw = detail.active_qr;
                    const uri = (raw && raw.startsWith && raw.startsWith('data:')) ? raw : `${API_BASE_URL}/api/v1/herbs/${detail.batch_id}/qr_image`;
                    return <Image source={{ uri }} style={{ width: 180, height: 180, backgroundColor: '#FFF', borderRadius: 12 }} />;
                  })()
                }
              </View>
            ) : null}
            <View style={{ backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12 }}>
              {[
                [t.labBatches?.batchId || 'Batch ID', detail?.batch_id],
                [t.labBatches?.species || 'Species', detail?.species_name],
                [t.labBatches?.weight || 'Weight', detail?.weight_kg ? `${detail.weight_kg} kg` : '-'],
                [t.labBatches?.harvest || 'Harvest', detail?.harvest_date],
                [t.labBatches?.location || 'Location', detail?.location],
                [t.labBatches?.status || 'Status', detail?.quality_status],
              ].map(([k,v]) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>{k}</Text>
                  <Text style={{ color: '#111827', fontSize: 13, fontWeight: '600' }}>{v || '-'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  tabsWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#111827',
  },
  tabText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
  },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  countPillActive: {
    backgroundColor: '#1F2937',
  },
  countText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});

export default BatchesPage;
