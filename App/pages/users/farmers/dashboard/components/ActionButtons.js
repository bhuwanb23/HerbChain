import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ActionButtons = ({ onActionPress }) => {
  const actions = [
    {
      id: 'herb-batches',
      icon: '🌱',
      title: 'My Herb Batches',
      iconBg: '#DCFCE7',
      iconColor: '#22c55e',
    },
    {
      id: 'sales-revenue',
      icon: '📈',
      title: 'Sales & Revenue',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
    },
    {
      id: 'harvest-schedule',
      icon: '📅',
      title: 'Harvest Schedule',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      id: 'training-tips',
      icon: '🎓',
      title: 'Training & Tips',
      iconBg: '#F3E8FF',
      iconColor: '#A855F7',
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.button}
          onPress={() => onActionPress && onActionPress(action.id)}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <View style={[styles.iconContainer, { backgroundColor: action.iconBg }]}>
              <Text style={[styles.icon, { color: action.iconColor }]}>{action.icon}</Text>
            </View>
            <Text style={styles.title}>{action.title}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});

export default ActionButtons;
