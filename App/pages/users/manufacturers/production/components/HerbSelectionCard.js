import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const HerbSelectionCard = ({ herb, isSelected, onSelect }) => {
  const { t } = useGlobalTranslation();
  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        isSelected && styles.selectedCard,
      ]}
      onPress={() => onSelect(herb.id, !isSelected)}
    >
      <View style={styles.contentWrapper}>
        <Checkbox
          value={isSelected}
          onValueChange={(newValue) => onSelect(herb.id, newValue)}
          style={styles.checkbox}
          color={isSelected ? '#059669' : '#d1d5db'} // primary or gray-300
        />
        <View style={styles.textContainer}>
          <Text style={styles.herbName}>{herb.name || ''}</Text>
          <Text style={styles.batchInfo}>
            {`${t.production?.batch || 'Batch'}: ${herb.batch || ''} • ${herb.certified ? (t.production?.certified || 'Certified') : (t.production?.notCertified || 'Not Certified')}`}
          </Text>
        </View>
      </View>
      {herb.certified && <Icon name="verified" size={20} color="#059669" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 8,
    backgroundColor: '#fff',
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
  },
  selectedCard: {
    borderColor: '#059669', // primary
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12, // space-x-3
  },
  checkbox: {
    width: 20, // w-5
    height: 20, // h-5
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
  },
  textContainer: {
    // No specific styles for now, let content dictate width
  },
  herbName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  batchInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default HerbSelectionCard;