import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QUICK_ACTIONS } from '../constants';

const ActionButton = ({ action, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.quickActionButton,
        {
          backgroundColor: action.backgroundColor,
          borderColor: action.borderColor,
        }
      ]}
      onPress={() => onPress(action.navigateTo)}
      activeOpacity={0.8}
    >
      <Ionicons name={action.icon} size={24} color={action.iconColor} />
      <Text style={[styles.quickActionButtonText, { color: action.textColor }]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );
};

const QuickActions = ({ onActionPress }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <ActionButton 
            key={action.id} 
            action={action} 
            onPress={onActionPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default QuickActions;
