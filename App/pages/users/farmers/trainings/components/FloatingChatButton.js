import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FloatingChatButton = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Icon name="headset-mic" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>Need Help?</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltip: {
    position: 'absolute',
    top: -32,
    right: 0,
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FloatingChatButton;
