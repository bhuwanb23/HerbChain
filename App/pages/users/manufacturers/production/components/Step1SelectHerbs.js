import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import HerbSelectionCard from './HerbSelectionCard';
import { HERB_OPTIONS } from '../constants/productionConstants';

const Step1SelectHerbs = ({
  selectedHerbs,
  onSelectHerb,
  onNextStep,
}) => {
  const handleContinue = () => {
    if (selectedHerbs.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one herb to continue.');
    } else {
      onNextStep();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Select Certified Herbs</Text>
        <Text style={styles.subtitle}>Choose the herbs for your product formulation</Text>
        <FlatList
          data={HERB_OPTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HerbSelectionCard
              herb={item}
              isSelected={selectedHerbs.some(herb => herb.id === item.id)}
              onSelect={onSelectHerb}
            />
          )}
          contentContainerStyle={styles.herbListContent}
          scrollEnabled={false}
        />
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Formulation</Text>
        </TouchableOpacity>
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
  herbListContent: {
    rowGap: 16, // space-y-4
  },
  continueButton: {
    width: '100%',
    marginTop: 24, // mt-6
    backgroundColor: '#059669', // primary
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Step1SelectHerbs;