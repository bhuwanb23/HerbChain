import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import FarmerMainPage from '../pages/users/farmers/FarmerMainPage';
import TransporterDashboard from '../pages/users/transporters/dashboard/dashboard';
import LabDashboard from '../pages/users/labs/dashboard/dashboard';
import AdminDashboard from '../pages/users/admins/dashboard/dashboard';
import ConsumerDashboard from '../pages/users/consumers/dashboard/dashboard';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={PerfectLoginScreen}
          options={{
            title: 'HerbChain Login',
          }}
        />
        <Stack.Screen 
          name="FarmerDashboard" 
          component={FarmerMainPage}
          options={{
            title: 'Farmer Dashboard',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="TransporterDashboard" 
          component={TransporterDashboard}
          options={{
            title: 'Transporter Dashboard',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#3B82F6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="LabDashboard" 
          component={LabDashboard}
          options={{
            title: 'Lab Dashboard',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#8B5CF6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard}
          options={{
            title: 'Admin Dashboard',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#F59E0B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="ConsumerDashboard" 
          component={ConsumerDashboard}
          options={{
            title: 'Consumer Dashboard',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#22c55e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
