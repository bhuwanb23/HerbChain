import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const StaffItem = ({ staff, onRemoveStaff }) => {
  return (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Image source={{ uri: staff.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.staffName}>{staff.name}</Text>
          <Text style={styles.staffRole}>{staff.role}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => onRemoveStaff(staff.id)} style={styles.removeButton}>
        <Icon name="delete" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
    padding: 12,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  staffRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeButton: {
    padding: 8,
  },
});

export default StaffItem;