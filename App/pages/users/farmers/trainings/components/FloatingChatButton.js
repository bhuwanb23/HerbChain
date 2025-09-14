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
    bottom: 20,
    right: 12,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    right: 0,
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  tooltipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default FloatingChatButton;
