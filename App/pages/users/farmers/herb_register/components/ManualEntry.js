import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { HERB_SPECIES, CULTIVATION_METHODS } from '../constants';

const ManualEntry = ({ formData, updateFormData }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderPicker = (items, selectedValue, onValueChange, placeholder, icon) => (
    <Animated.View 
      style={[
        styles.pickerContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pickerGradient}
      >
        <View style={styles.pickerIcon}>
          <Icon name={icon} size={20} color="#22c55e" />
        </View>
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
      </LinearGradient>
    </Animated.View>
  );

  const renderInput = (label, value, onChangeText, placeholder, keyboardType, icon, unit) => (
    <Animated.View 
      style={[
        styles.fieldContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.labelContainer}>
        <Icon name={icon} size={18} color="#22c55e" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputGradient}
        >
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboardType}
            placeholderTextColor="#9ca3af"
          />
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </LinearGradient>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.iconContainer}
        >
          <Icon name="edit" size={24} color="white" />
        </LinearGradient>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <Text style={styles.sectionSubtitle}>Fill in the details manually</Text>
        </View>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formFields}>
          {/* Species Selection */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Icon name="eco" size={18} color="#22c55e" />
              <Text style={styles.label}>Species Name</Text>
            </View>
            {renderPicker(
              HERB_SPECIES,
              formData.species,
              (value) => updateFormData('species', value),
              'Select herb species...',
              'eco'
            )}
          </View>

          {/* Weight and Harvest Date */}
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              {renderInput(
                'Weight',
                formData.weight,
                (value) => updateFormData('weight', value),
                '0.0',
                'numeric',
                'scale',
                'kg'
              )}
            </View>

            <View style={styles.halfField}>
              {renderInput(
                'Harvest Date',
                formData.harvestDate,
                (value) => updateFormData('harvestDate', value),
                'YYYY-MM-DD',
                'default',
                'event'
              )}
            </View>
          </View>

          {/* Cultivation Method */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
              <Icon name="agriculture" size={18} color="#22c55e" />
              <Text style={styles.label}>Cultivation Method</Text>
            </View>
            {renderPicker(
              CULTIVATION_METHODS,
              formData.cultivationMethod,
              (value) => updateFormData('cultivationMethod', value),
              'Select cultivation method...',
              'agriculture'
            )}
          </View>

          {/* Additional Notes */}
          <Animated.View 
            style={[
              styles.fieldContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.labelContainer}>
              <Icon name="note" size={18} color="#22c55e" />
              <Text style={styles.label}>Additional Notes (Optional)</Text>
            </View>
            <View style={styles.inputContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputGradient}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(value) => updateFormData('notes', value)}
                  placeholder="Any additional information about the harvest..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </View>
          </Animated.View>
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
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
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pickerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    height: 48,
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default ManualEntry;
