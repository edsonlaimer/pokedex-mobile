import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PokemonMovesScreen from '../screens/PokemonMovesScreen';
import MoveDetailScreen from '../screens/MoveDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PokemonMoves" component={PokemonMovesScreen} />
      <Stack.Screen name="MoveDetail" component={MoveDetailScreen} />
    </Stack.Navigator>
  );
}