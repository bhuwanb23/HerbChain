import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GenerateReportButtons = ({ generateOptions, onGenerateReport }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Report</Text>
        <Icon name="import_export" size={20} color="#ea580c" />
      </View>
      <View style={styles.buttonGrid}>
        {generateOptions.slice(0, 2).map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.reportButton, { backgroundColor: option.bgColor }]}
            onPress={() => onGenerateReport(option.id)}
          >
            <Icon name={option.icon} size={20} color="#fff" />
            <Text style={styles.reportButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {generateOptions.length > 2 && (
        <TouchableOpacity
          style={[styles.fullWidthButton, { backgroundColor: generateOptions[2].bgColor }]}
          onPress={() => onGenerateReport(generateOptions[2].id)}
        >
          <Icon name={generateOptions[2].icon} size={20} color="#fff" />
          <Text style={styles.reportButtonText}>{generateOptions[2].label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 12, // gap-3
    marginBottom: 12,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    columnGap: 8, // space-x-2
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    columnGap: 8, // space-x-2
  },
});

export default GenerateReportButtons;