import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SupportItem = ({ supportLink, onPress }) => {
  return (
    <TouchableOpacity style={styles.supportCard} onPress={() => onPress(supportLink.id)}>
      <View style={styles.iconTextWrapper}>
        <View style={[styles.iconWrapper, { backgroundColor: supportLink.bgColor }]}>
          <Icon name={supportLink.icon} size={20} color={supportLink.iconColor} />
        </View>
        <Text style={styles.labelText}>{supportLink.label}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
    padding: 12,
  },
  iconTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default SupportItem;