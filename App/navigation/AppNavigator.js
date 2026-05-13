import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { GlobalTranslationProvider } from '../language/GlobalTranslationContext';
import { useAuth } from '../contexts/AuthContext';

// Auth screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import RegisterScreen from '../pages/login/RegisterScreen';

// Role-specific dashboards
import FarmerMainPage from '../pages/users/farmers/FarmerMainPage';
import TransportersPage from '../pages/users/transporters/transporters';
import LabsPage from '../pages/users/labs/labs';
import AdminDashboard from '../pages/users/admins/dashboard/dashboard';
import { ConsumerMainPage, QRScanScreen, HerbDetailsScreen } from '../pages/users/consumers';
import ManufacturerMainPage from '../pages/users/manufacturers/ManufacturerMainPage';
import QRScannerScreen from '../pages/users/manufacturers/raw_herb_management/QRScannerScreen';
import QRScannerScreenLab from '../pages/users/labs/batches/components/QRScannerScreenLab';

const Stack = createStackNavigator();

// Map role -> the initial dashboard route for that user
const ROLE_HOME = {
  farmer: 'FarmerDashboard',
  transporter: 'TransporterDashboard',
  lab: 'LabBatchesPage',
  manufacturer: 'ManufacturerMainPage',
  consumer: 'ConsumerDashboard',
  admin: 'AdminDashboard',
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
      initialRouteName={initialRoute || 'ConsumerDashboard'}
      screenOptions={{ headerShown: false, gestureEnabled: true }}
    >
      <Stack.Screen name="FarmerDashboard" component={FarmerMainPage} />
      <Stack.Screen name="TransporterDashboard" component={TransportersPage} />
      <Stack.Screen name="LabBatchesPage" component={LabsPage} />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen name="ConsumerDashboard" component={ConsumerMainPage} />
      <Stack.Screen name="ManufacturerMainPage" component={ManufacturerMainPage} />

      <Stack.Screen name="QRScanScreen" component={QRScanScreen} />
      <Stack.Screen name="HerbDetailsScreen" component={HerbDetailsScreen} />
      <Stack.Screen name="QRScannerScreen" component={QRScannerScreen} />
      <Stack.Screen name="QRScannerScreenLab" component={QRScannerScreenLab} />
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
    const initialRoute = ROLE_HOME[role] || 'ConsumerDashboard';
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
