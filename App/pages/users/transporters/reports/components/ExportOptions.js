import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ExportCard = ({ icon, color, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconBox, { backgroundColor: color + '1A' }]}> 
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const ExportOptions = () => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.header}>Export Reports</Text>
      <View style={styles.row}>
        <ExportCard icon="file-pdf-box" color="#EF4444" title="PDF Report" subtitle="Detailed summary" />
        <ExportCard icon="file-delimited" color="#10B981" title="CSV Data" subtitle="Raw data export" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { padding: 16 },
  header: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 11, color: '#6B7280' },
});

export default ExportOptions;


