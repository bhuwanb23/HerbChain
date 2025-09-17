import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { STATUS_CONFIG } from '../constants';

const ReportCard = ({ 
  report, 
  onViewReport, 
  onDownloadReport, 
  onShareReport 
}) => {
  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;

  return (
    <View style={styles.reportItemCard}>
      <View style={styles.reportItemContent}>
        <View style={styles.flex1}>
          <Text style={styles.reportItemTitle}>{report.title}</Text>
          <Text style={styles.reportItemSubtitle}>{report.subtitle}</Text>
          <View style={styles.reportItemStatusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </View>
            <Text style={styles.purityText}>{report.purity}% Purity</Text>
          </View>
        </View>
        <View style={styles.reportItemActions}>
          <TouchableOpacity 
            onPress={() => onViewReport && onViewReport(report.id)}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Icon name="visibility" size={20} color="#00BFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onDownloadReport && onDownloadReport(report.id)}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Icon name="download" size={20} color="#00BFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onShareReport && onShareReport(report.id)}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Icon name="share" size={20} color="#00BFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reportItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  reportItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  reportItemTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
    marginBottom: 4,
  },
  reportItemSubtitle: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
  },
  reportItemStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  purityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#808080',
  },
  reportItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});

export default ReportCard;
