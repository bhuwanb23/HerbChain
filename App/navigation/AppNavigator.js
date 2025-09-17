import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import FarmerMainPage from '../pages/users/farmers/FarmerMainPage';
import TransportersPage from '../pages/users/transporters/transporters';
import LabsPage from '../pages/users/labs/labs';
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
          component={TransportersPage}
          options={{
            title: 'Transporter Dashboard',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="LabDashboard" 
          component={LabsPage}
          options={{
            title: 'Lab Dashboard',
            headerShown: false,
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
