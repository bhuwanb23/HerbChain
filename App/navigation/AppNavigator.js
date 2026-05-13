import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { GlobalTranslationProvider } from '../language/GlobalTranslationContext';
import { useAuth } from '../contexts/AuthContext';

// Auth screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import RegisterScreen from '../pages/login/RegisterScreen';

// v1 role homes — wired to the new backend.
import FarmerHome from '../pages/users/farmers/FarmerHome';
import TransporterHome from '../pages/users/transporters/TransporterHome';
import LabHome from '../pages/users/labs/LabHome';
import ManufacturerHome from '../pages/users/manufacturers/ManufacturerHome';
import ConsumerHome from '../pages/users/consumers/ConsumerHome';
import AdminHome from '../pages/users/admins/AdminHome';

const Stack = createStackNavigator();

// Map role -> the entry screen for that user
const ROLE_HOME = {
  farmer: 'FarmerHome',
  transporter: 'TransporterHome',
  lab: 'LabHome',
  manufacturer: 'ManufacturerHome',
  consumer: 'ConsumerHome',
  admin: 'AdminHome',
};

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, gestureEnabled: true }}
    >
      <Stack.Screen name="Login" component={PerfectLoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute || 'ConsumerHome'}
      screenOptions={{ headerShown: false, gestureEnabled: true }}
    >
      <Stack.Screen name="FarmerHome" component={FarmerHome} />
      <Stack.Screen name="TransporterHome" component={TransporterHome} />
      <Stack.Screen name="LabHome" component={LabHome} />
      <Stack.Screen name="ManufacturerHome" component={ManufacturerHome} />
      <Stack.Screen name="ConsumerHome" component={ConsumerHome} />
      <Stack.Screen name="AdminHome" component={AdminHome} />
    </Stack.Navigator>
  );
}

function AuthGate() {
  const { ready, isLoggedIn, role } = useAuth();

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (isLoggedIn) {
    const initialRoute = ROLE_HOME[role] || 'ConsumerHome';
    return <AppStack initialRoute={initialRoute} />;
  }

  return <AuthStack />;
}

const AppNavigator = () => {
  return (
    <GlobalTranslationProvider>
      <NavigationContainer>
        <AuthGate />
      </NavigationContainer>
    </GlobalTranslationProvider>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
});

export default AppNavigator;
