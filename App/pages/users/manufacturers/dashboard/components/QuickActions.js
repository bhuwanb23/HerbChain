import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const QuickActions = ({ navigation }) => {
  const { t } = useGlobalTranslation();
  const handleHerbInventoryPress = () => {
    console.log('Navigate to Herb Inventory');
    // navigation.navigate('RawHerbManagement'); // Assuming this is the correct page
  };

  const handleCreateProductPress = () => {
    console.log('Navigate to Create Product');
    // navigation.navigate('Production'); // Assuming this is the correct page
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.manufacturerDashboard?.quickActions || 'Quick Actions'}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#7C9885' }]} onPress={handleHerbInventoryPress}>
          <Icon name="boxes-stacked" size={20} color="white" />
          <Text style={styles.buttonText}>{t.manufacturerDashboard?.herbInventory || 'Herb Inventory'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#9CAF88' }]} onPress={handleCreateProductPress}>
          <Icon name="plus" size={20} color="white" />
          <Text style={styles.buttonText}>{t.manufacturerDashboard?.createProduct || 'Create Product'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10, // Add some horizontal padding
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  button: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5, // Add horizontal margin to create gap between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});

export default QuickActions;