import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GENERATE_REPORT_OPTIONS } from '../constants';

const GenerateReports = ({ onGenerateChart, onGenerateReport, onViewHeatmap }) => {
  const handleAction = (option) => {
    switch (option.type) {
      case 'chart':
        onGenerateChart && onGenerateChart(option.title);
        break;
      case 'report':
        onGenerateReport && onGenerateReport(option.title);
        break;
      case 'heatmap':
        onViewHeatmap && onViewHeatmap();
        break;
      default:
        console.log(`Action for ${option.title} not implemented`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Generate Reports</Text>
      <View style={styles.gridContainer}>
        {GENERATE_REPORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.reportCard}
            onPress={() => handleAction(option)}
            activeOpacity={0.8}
          >
            <View style={styles.reportCardHeader}>
              <Text style={styles.reportCardTitle}>{option.title}</Text>
              <Icon name={option.icon} size={20} color="#00BFFF" />
            </View>
            <Text style={styles.reportCardDescription}>{option.description}</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => handleAction(option)}
              activeOpacity={0.8}
            >
              <Text style={styles.generateButtonText}>
                {option.type === 'chart' ? 'Generate Chart' : 
                 option.type === 'heatmap' ? 'View Heatmap' : 'Generate Report'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flex: 1,
    minWidth: '48%',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportCardTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  reportCardDescription: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 12,
  },
  generateButton: {
    width: '100%',
    backgroundColor: '#00BFFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default GenerateReports;
