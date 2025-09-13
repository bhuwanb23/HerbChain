import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RoleSelection = ({ onRoleSelect, selectedRole }) => {
  const roles = [
    { id: 'farmer', name: 'Farmer', icon: '🌱' },
    { id: 'transporter', name: 'Transporter', icon: '🚚' },
    { id: 'lab', name: 'Lab', icon: '🔬' },
    { id: 'ayush', name: 'AYUSH/Admin', icon: '🏛️' },
    { id: 'consumer', name: 'Consumer', icon: '👥' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your role</Text>
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedRoleCard,
            ]}
            onPress={() => onRoleSelect(role.id)}
          >
            <View
              style={[
                styles.roleIcon,
                selectedRole === role.id && styles.selectedRoleIcon,
              ]}
            >
              <Text style={styles.roleEmoji}>{role.icon}</Text>
            </View>
            <Text
              style={[
                styles.roleName,
                selectedRole === role.id && styles.selectedRoleName,
              ]}
            >
              {role.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 384,
    marginTop: 32,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  roleCard: {
    alignItems: 'center',
    minWidth: 80,
  },
  selectedRoleCard: {
    transform: [{ scale: 1.05 }],
  },
  roleIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedRoleIcon: {
    backgroundColor: '#E8F5E8',
    borderColor: '#10B981',
    borderWidth: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedRoleName: {
    color: '#10B981',
    fontWeight: '600',
  },
});

export default RoleSelection;
