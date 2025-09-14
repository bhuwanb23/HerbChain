import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QuickActions = ({ quickActions, onActionPress }) => {
  const getActionIcon = (icon) => {
    switch (icon) {
      case '▶️': return 'play-arrow';
      case '📱': return 'qr-code-scanner';
      case '🚨': return 'emergency';
      case '⛽': return 'local-gas-station';
      default: return 'info';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { backgroundColor: `${action.color}15` }]}
            onPress={() => onActionPress(action.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
              <Icon name={getActionIcon(action.icon)} size={18} color="white" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6, // Reduced gap to give more space for text
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10, // Reduced padding to give more space for text
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 70, // Added minimum height to ensure consistent button sizes
  },
  actionIconContainer: {
    width: 28, // Slightly reduced icon size
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // Reduced margin
  },
  actionTitle: {
    fontSize: 9, // Reduced font size to prevent wrapping
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 11, // Added line height for better text display
  },
});

export default QuickActions;
