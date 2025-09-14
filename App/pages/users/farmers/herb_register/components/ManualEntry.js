import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { HERB_SPECIES, CULTIVATION_METHODS } from '../constants';

const ManualEntry = ({ formData, updateFormData }) => {
  const renderPicker = (items, selectedValue, onValueChange, placeholder) => (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label={placeholder} value="" />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Icon name="edit" size={20} color="#16a34a" />
        <Text style={styles.sectionTitle}>Manual Entry</Text>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formFields}>
          {/* Species Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>🌱 Species Name</Text>
            {renderPicker(
              HERB_SPECIES,
              formData.species,
              (value) => updateFormData('species', value),
              'Select herb species...'
            )}
          </View>

          {/* Weight and Harvest Date */}
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              <Text style={styles.label}>⚖️ Weight</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(value) => updateFormData('weight', value)}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>📅 Harvest Date</Text>
              <TextInput
                style={styles.input}
                value={formData.harvestDate}
                onChangeText={(value) => updateFormData('harvestDate', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          {/* Cultivation Method */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>🚜 Cultivation Method</Text>
            {renderPicker(
              CULTIVATION_METHODS,
              formData.cultivationMethod,
              (value) => updateFormData('cultivationMethod', value),
              'Select cultivation method...'
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>📝 Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="Any additional information about the harvest..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
  },
  formFields: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  unit: {
    position: 'absolute',
    right: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
  },
});

export default ManualEntry;
