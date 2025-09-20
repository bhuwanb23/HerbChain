import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StaffItem from './StaffItem';

const AuthorizedStaffTab = ({ staffData, onRemoveStaff }) => {
  const handleAddStaff = () => {
    Alert.alert('Add Staff', 'Functionality to add new staff will be implemented here.');
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Authorized Staff</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
          <Icon name="add" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={staffData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StaffItem staff={item} onRemoveStaff={onRemoveStaff} />}
        contentContainerStyle={styles.staffListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669', // primary
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  staffListContent: {
    rowGap: 12, // space-y-3
  },
});

export default AuthorizedStaffTab;