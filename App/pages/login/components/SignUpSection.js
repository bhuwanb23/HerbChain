import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGlobalTranslation } from '../../../language/GlobalTranslationContext';

const SignUpSection = ({ onSignUp }) => {
  const { t } = useGlobalTranslation();
  
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{t.login.noAccount}</Text>
        <TouchableOpacity onPress={onSignUp}>
          <Text style={styles.signUpLink}>{t.login.signUp}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
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
