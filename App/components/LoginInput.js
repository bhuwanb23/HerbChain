import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const LoginInput = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  showPassword = false, 
  onEyePress,
  keyboardType = 'default'
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={onEyePress} style={styles.eyeButton}>
          <Text style={styles.eyeIcon}>
            {showPassword ? '👁️' : '🙈'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 15,
    fontSize: 22,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#333',
    paddingVertical: 18,
  },
  eyeButton: {
    padding: 10,
  },
  eyeIcon: {
    fontSize: 22,
  },
});

export default LoginInput;
