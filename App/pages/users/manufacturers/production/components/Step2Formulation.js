import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SelectedHerbProportion from './SelectedHerbProportion';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const Step2Formulation = ({
  selectedHerbs,
  herbProportions,
  onProportionChange,
  processingMethods,
  processingMethod,
  onSelectProcessingMethod,
  processingNotes,
  onProcessingNotesChange,
  onPreviousStep,
  onNextStep,
}) => {
  const { t } = useGlobalTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>{t.production?.productFormulation || 'Product Formulation'}</Text>
        <Text style={styles.subtitle}>{t.production?.defineProportionsAndProcessing || 'Define proportions and processing details'}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>{t.production?.herbProportions || 'Herb Proportions'}</Text>
          <FlatList
            data={selectedHerbs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SelectedHerbProportion
                herb={item}
                proportion={herbProportions[item.id]}
                onProportionChange={onProportionChange}
              />
            )}
            contentContainerStyle={styles.herbProportionsList}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t.production?.processingMethod || 'Processing Method'}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={processingMethod}
              onValueChange={(itemValue) => onSelectProcessingMethod(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {processingMethods.map((method, index) => (
                <Picker.Item key={index} label={method} value={method} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t.production?.processingNotes || 'Processing Notes'}</Text>
          <TextInput
            style={styles.textAreaInput}
            value={processingNotes}
            onChangeText={onProcessingNotesChange}
            multiline
            numberOfLines={3}
            placeholder={t.production?.addProcessingNotes || 'Add any specific processing notes or instructions...'}
          />
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={onPreviousStep}>
            <Text style={styles.backButtonText}>{t.production?.previous || 'Previous'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNextStep}>
            <Text style={styles.nextButtonText}>{t.production?.continueToLinkBatches || 'Continue to Link Batches'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Flex properties should be handled by the parent container that renders the steps
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24, // p-6
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    color: '#111827', // gray-900
    marginBottom: 8, // mb-2
  },
  subtitle: {
    fontSize: 14, // text-sm
    color: '#4b5563', // gray-600
    marginBottom: 24, // mb-6
  },
  section: {
    marginBottom: 24, // space-y-6 equivalent before last section
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 12, // mb-3 or mb-2
  },
  herbProportionsList: {
    rowGap: 12, // space-y-3
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48, // approximate height for p-3
    width: '100%',
    color: '#111827',
  },
  pickerItem: {
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12, // p-3
    fontSize: 16,
    color: '#111827',
    height: 96, // h-24
    textAlignVertical: 'top',
  },
  navigationButtons: {
    flexDirection: 'row',
    columnGap: 12, // space-x-3
    marginTop: 24, // mt-6
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButtonText: {
    color: '#4b5563', // gray-700
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#059669', // primary
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Step2Formulation;