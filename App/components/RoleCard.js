import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RoleCard = ({ role, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.roleButton,
        isSelected && styles.selectedRoleButton,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.roleIconContainer, { backgroundColor: role.color + '20' }]}>
        <Text style={styles.roleIcon}>{role.icon}</Text>
      </View>
      <Text
        style={[
          styles.roleText,
          isSelected && styles.selectedRoleText,
        ]}
      >
        {role.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  roleButton: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRoleButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
    transform: [{ scale: 1.05 }],
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  roleIcon: {
    fontSize: 30,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedRoleText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default RoleCard;
