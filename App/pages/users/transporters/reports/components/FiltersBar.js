import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const FiltersBar = ({ options = [], active, onChange }) => {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = opt.id === active;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => onChange && onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, isActive && styles.activeChipText]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeChip: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});

export default FiltersBar;


