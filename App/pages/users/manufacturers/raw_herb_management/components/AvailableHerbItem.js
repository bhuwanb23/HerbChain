import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AvailableHerbItem = ({ herb, onOrderHerb, getStatusStyle, onPress }) => {
  const statusStyle = getStatusStyle(herb.status);
  const latestLabReport = herb.labReports && herb.labReports.length > 0 ? herb.labReports[0] : null;
  const hasCertification = latestLabReport?.certification === true;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(herb)}>
      <View style={styles.header}>
        <Text style={styles.herbName}>{herb.species_name || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{herb.status}</Text>
        </View>
      </View>
      <Text style={styles.batchId}>Batch ID: {herb.batch_id}</Text>
      <Text style={styles.farmerInfo}>Farmer: {herb.farmer_id}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="fitness-center" size={16} color={'gray'} />
          <Text style={styles.detailText}>{herb.weight_kg} kg</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="event" size={16} color={'gray'} />
          <Text style={styles.detailText}>Harvest: {new Date(herb.harvest_date).toLocaleDateString()}</Text>
        </View>
      </View>

      {latestLabReport && (
        <View style={styles.labReportSection}>
          <View style={styles.labReportHeader}>
            <Icon name="flask" size={18} color={'#006B38'} style={styles.mr2} />
            <Text style={styles.labReportTitle}>Latest Lab Report:</Text>
          </View>
          <View style={styles.labReportDetails}>
            {hasCertification ? (
              <View style={styles.detailItem}>
                <Icon name="verified" size={16} color={'green'} />
                <Text style={[styles.detailText, { color: 'darkgreen' }]}>Certified ({latestLabReport.certification_level || 'Standard'})</Text>
              </View>
            ) : (
              <View style={styles.detailItem}>
                <Icon name="cancel" size={16} color={'red'} />
                <Text style={[styles.detailText, { color: 'darkred' }]}>Not Certified</Text>
              </View>
            )}
            {latestLabReport.purity_percentage && (
              <View style={styles.detailItem}>
                <Icon name="science" size={16} color={'gray'} />
                <Text style={styles.detailText}>Purity: {latestLabReport.purity_percentage}%</Text>
              </View>
            )}
            {latestLabReport.heavy_metals_present && (
              <View style={styles.detailItem}>
                <Icon name="warning" size={16} color={'red'} />
                <Text style={[styles.detailText, { color: 'darkred' }]}>Heavy Metals: Yes</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.orderButton, herb.status !== 'approved' && styles.disabledButton]}
        onPress={() => onOrderHerb(herb.id)}
        disabled={herb.status !== 'approved'}
      >
        <Text style={styles.orderButtonText}>Order Herb</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  herbName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  batchId: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  farmerInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
  },
  labReportSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  labReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labReportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  labReportDetails: {
    marginLeft: 2,
    rowGap: 6,
  },
  orderButton: {
    backgroundColor: '#006B38',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#006B38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mr2: { marginRight: 8 },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default AvailableHerbItem;