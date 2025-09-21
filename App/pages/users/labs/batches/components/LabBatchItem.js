import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';
import { API_BASE_URL } from '../../../../../constants/api';

const LabBatchItem = ({ item, onAccepted, acceptHerb, variant = 'all', onOpenDetails }) => {
  const { t } = useGlobalTranslation();
  const [isAccepting, setIsAccepting] = useState(false);
  const navigation = useNavigation();

  const accept = async () => {
    try {
      setIsAccepting(true);
      console.log('[LabBatchItem] Accepting batch:', item.batch_id);
      
      if (acceptHerb) {
        await acceptHerb(item.batch_id);
        Alert.alert(t.labBatches?.success || 'Success', t.labBatches?.herbAcceptedSuccess || 'Herb accepted for testing successfully!');
        onAccepted && onAccepted();
      } else {
        // Fallback to dummy call
        setTimeout(() => {
          console.log('[LabBatchItem] Accept successful (dummy)');
          onAccepted && onAccepted();
        }, 1000);
      }
      
    } catch (e) {
      console.log('[LabBatchItem] accept failed', e);
      Alert.alert(t.labBatches?.error || 'Error', e.message || (t.labBatches?.failedToAcceptHerb || 'Failed to accept herb'));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleStartScan = () => {
    navigation.navigate('QRScannerScreenLab', { batchId: item.batch_id });
  };
  const CardWrapper = variant === 'archived' && onOpenDetails ? TouchableOpacity : View;
  const wrapperProps = variant === 'archived' && onOpenDetails ? { activeOpacity: 0.85, onPress: () => onOpenDetails(item) } : {};

  return (
    <CardWrapper style={styles.card} {...wrapperProps}>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.batchId || 'Batch ID'}</Text>
        <Text style={styles.value}>{item.batch_id}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.farmer || 'Farmer'}</Text>
        <Text style={styles.value}>{item.farmer_id}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.species || 'Species'}</Text>
        <Text style={styles.value}>{item.species_entered || item.species_detected || '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.weight || 'Weight'}</Text>
        <Text style={styles.value}>{item.weight_kg ? `${item.weight_kg} kg` : '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.harvest || 'Harvest'}</Text>
        <Text style={styles.value}>{item.harvest_date || '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t.labBatches?.status || 'Status'}</Text>
        <Text style={styles.value}>{item.accepted ? (t.labBatches?.acceptedStatus || 'Accepted') : (item.status || (t.labBatches?.pending || 'Pending'))}</Text>
      </View>
      {variant !== 'archived' && !item.accepted && (
        <TouchableOpacity 
          style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]} 
          onPress={accept} 
          activeOpacity={0.85}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.acceptText}>{t.labBatches?.accepting || 'Accepting...'}</Text>
            </View>
          ) : (
            <Text style={styles.acceptText}>{t.labBatches?.acceptForTesting || 'Accept for Testing'}</Text>
          )}
        </TouchableOpacity>
      )}
      {variant === 'accepted' && item.accepted && (
        <TouchableOpacity 
          style={[styles.acceptBtn]}
          onPress={handleStartScan}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptText}>{t.labBatches?.scanTransporterQR || 'Scan Transporter QR'}</Text>
        </TouchableOpacity>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  acceptBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default LabBatchItem;


