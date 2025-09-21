import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const LinkedBatchItem = ({ herbName, batchId }) => {
  const { t } = useGlobalTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.herbName}>{herbName || ''}:</Text>
      <Text style={styles.batchId}>{batchId || ''}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14, // text-sm
  },
  herbName: {
    color: '#4b5563', // gray-600
  },
  batchId: {
    fontWeight: '500', // font-medium
    color: '#111827', // gray-900
  },
});

export default LinkedBatchItem;