import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

const SelectedHerbProportion = ({ herb, proportion, onProportionChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.herbName}>{herb.name}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.proportionInput}
          value={String(proportion)}
          onChangeText={(text) => onProportionChange(herb.id, text)}
          keyboardType="numeric"
          maxLength={3} // Max 3 digits for percentage (1-100)
        />
        <Text style={styles.percentageText}>%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12, // p-3
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  herbName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8, // space-x-2
  },
  proportionInput: {
    width: 64, // w-16
    paddingVertical: 8, // p-2
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
  },
  percentageText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SelectedHerbProportion;