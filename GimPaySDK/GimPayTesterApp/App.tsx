/**
 * GimPay Tester App
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import OperationScreen from './src/screens/OperationScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'GimPay Tester' }}
        />
        <Stack.Screen name="Operation" component={OperationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
