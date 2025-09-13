import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import PerfectLoginScreen from '../pages/login/PerfectLoginScreen';
import { Dashboard } from '../pages/users/farmers';

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
          component={Dashboard}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
