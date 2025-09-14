import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import FarmerDashboard from '../pages/users/farmers/dashboard/dashboard';
import HerbRegisterScreen from '../pages/users/farmers/herb_register/HerbRegisterScreen';
import PaymentsScreen from '../pages/users/farmers/payments/payements';
import TrainingScreen from '../pages/users/farmers/trainings/training';
import ProfileScreen from '../pages/users/farmers/profile/profile';
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
          component={FarmerDashboard}
          options={{
            title: 'Farmer Dashboard',
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
        <Stack.Screen 
          name="HerbRegister" 
          component={HerbRegisterScreen}
          options={{
            title: 'Register Herb',
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
        <Stack.Screen 
          name="PaymentsScreen" 
          component={PaymentsScreen}
          options={{
            title: 'Payments',
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
        <Stack.Screen 
          name="TrainingScreen" 
          component={TrainingScreen}
          options={{
            title: 'Training',
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
        <Stack.Screen 
          name="ProfileScreen" 
          component={ProfileScreen}
          options={{
            title: 'Profile',
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
