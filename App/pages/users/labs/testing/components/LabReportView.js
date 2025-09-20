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

  const renderDetail = (label, value) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{String(value)}</Text>
      </View>
    );
  };

  const renderBooleanDetail = (label, value) => {
    if (value === null || value === undefined) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value ? 'Yes' : 'No'}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButtonTop}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.title}>Lab Report for Batch {report.batch_id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>General Information</Text>
        {renderDetail('Report ID', report.report_id)}
        {renderDetail('Lab ID', report.lab_id)}
        {renderDetail('Test Type', report.test_type)}
        {renderDetail('Test Date', report.test_date ? new Date(report.test_date).toDateString() : '')}
        {renderDetail('Certification Issued', report.certification ? 'Yes' : 'No')}
        {report.certification && renderDetail('Certification Level', report.certification_level)}
        {renderDetail('Report URL', report.report_url)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Results</Text>
        {renderDetail('Purity Percentage', report.purity_percentage ? `${report.purity_percentage}%` : '')}
        {renderDetail('Moisture Content', report.moisture_content ? `${report.moisture_content}%` : '')}
        {renderDetail('Ash Content', report.ash_content ? `${report.ash_content}%` : '')}
        {renderBooleanDetail('Heavy Metals Present', report.heavy_metals_present)}
        {renderBooleanDetail('Pesticides Detected', report.pesticides_detected)}
        {renderDetail('Active Compounds', report.active_compounds)}
        {renderDetail('Potency Rating', report.potency_rating)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary & Notes</Text>
        {renderDetail('Results Summary', report.results_summary)}
        {renderDetail('Notes', report.notes)}
        {renderDetail('Recommendations', report.recommendations)}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButtonTop: {
    position: 'absolute',
    left: 0,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
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
    flex: 1.5,
    textAlign: 'right',
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