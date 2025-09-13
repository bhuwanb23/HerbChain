import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SignUpSection = ({ onSignUp }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Don't have an account?{' '}
        <TouchableOpacity onPress={onSignUp}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    color: '#10B981',
    fontWeight: '600',
  },
});

export default SignUpSection;
