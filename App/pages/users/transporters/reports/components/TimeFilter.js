import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TimeFilter = ({ options, active, onChange, onCustomPress }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Time Period</Text>
        <TouchableOpacity onPress={onCustomPress}>
          <Text style={styles.customText}>Custom</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {options.map((opt) => {
          const isActive = opt.id === active;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => onChange && onChange(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, isActive && styles.btnTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  customText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#2563EB',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
});

export default TimeFilter;


