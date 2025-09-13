import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const LoginButton = ({ title, onPress, variant = 'primary' }) => {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.8}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    marginBottom: 25,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    marginBottom: 25,
  },
  primaryText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  secondaryText: {
    color: '#4CAF50',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default LoginButton;
