import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PerfectLoginScreen from './pages/login/PerfectLoginScreen';

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <PerfectLoginScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
