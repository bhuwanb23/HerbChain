import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const LabReportView = ({ report, onBack }) => {
  if (!report) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No lab report selected.</Text>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          <Text style={styles.backButtonText}>Back to List</Text>
        </Pressable>
      </View>
    );
  }

  const renderDetail = (label, value, iconName = null, valueColor = COLORS.gray[600]) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <View style={styles.detailRow}>
        {iconName && <Ionicons name={iconName} size={16} color={COLORS.gray[500]} style={styles.detailIcon} />}
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={[styles.detailValue, { color: valueColor }]}>{String(value)}</Text>
      </View>
    );
  };

  const renderBooleanDetail = (label, value, iconNameTrue = null, iconNameFalse = null) => {
    if (value === null || value === undefined) return null;
    const icon = value ? iconNameTrue || "checkmark-circle" : iconNameFalse || "close-circle";
    const color = value ? COLORS.success : COLORS.error;
    const textValue = value ? 'Yes' : 'No';

    return (
      <View style={styles.detailRow}>
        <Ionicons name={icon} size={16} color={color} style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={[styles.detailValue, { color }]}>{textValue}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButtonTop}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </Pressable>
        <Text style={styles.title}>Lab Report</Text>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusBadgeContainer}>
          <Ionicons 
            name={report.certification ? "shield-checkmark" : "alert-circle"}
            size={22}
            color={report.certification ? COLORS.success : COLORS.error}
            style={styles.statusMainIcon}
          />
          <Text style={[styles.statusText, { color: report.certification ? COLORS.success : COLORS.error }]}>
            {report.certification ? 'CERTIFIED' : ''}
          </Text>
        </View>
        {report.certification && renderDetail('Certification Level', report.certification_level, "star")} 
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>General Information</Text>
        {renderDetail('Batch ID', report.batch_id, "cube-outline")}
        {renderDetail('Report ID', report.report_id, "receipt-outline")}
        {renderDetail('Lab ID', report.lab_id, "flask-outline")}
        {renderDetail('Test Type', report.test_type, "build-outline")}
        {renderDetail('Test Date', report.test_date ? new Date(report.test_date).toDateString() : '', "calendar-outline")}
        {renderDetail('Report URL', report.report_url, "link-outline")}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detailed Test Results</Text>
        {renderDetail('Purity Percentage', report.purity_percentage ? `${report.purity_percentage}%` : '', "color-fill-outline")}
        {renderDetail('Moisture Content', report.moisture_content ? `${report.moisture_content}%` : '', "water-outline")}
        {renderDetail('Ash Content', report.ash_content ? `${report.ash_content}%` : '', "thermometer-outline")}
        {renderBooleanDetail('Heavy Metals Present', report.heavy_metals_present, "radio-button-on", "close-circle")}
        {renderBooleanDetail('Pesticides Detected', report.pesticides_detected, "bug-outline", "close-circle")}
        {renderDetail('Active Compounds', report.active_compounds, "leaf-outline")}
        {renderDetail('Potency Rating', report.potency_rating, "flash-outline")}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary & Recommendations</Text>
        {renderDetail('Results Summary', report.results_summary, "text-outline")}
        {renderDetail('Notes', report.notes, "document-text-outline")}
        {renderDetail('Recommendations', report.recommendations, "bulb-outline")}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonTop: {
    position: 'relative',
    left: -10,
    padding: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    flex: 1,
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusMainIcon: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[700],
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.gray[600],
    textAlign: 'right',
    flex: 2,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.error,
    fontSize: 16,
    marginTop: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
  },
  backButtonText: {
    color: COLORS.white,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LabReportView;