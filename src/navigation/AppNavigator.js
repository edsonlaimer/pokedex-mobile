import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen         from '../screens/HomeScreen';
import PokemonDetailScreen from '../screens/PokemonDetailScreen';
import PokemonMovesScreen  from '../screens/PokemonMovesScreen';
import MoveDetailScreen    from '../screens/MoveDetailScreen';
import ItemsScreen         from '../screens/ItemsScreen';
import BerriesScreen       from '../screens/BerriesScreen';
import ComparatorScreen    from '../screens/ComparatorScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home"          component={HomeScreen} />
      <Stack.Screen name="PokemonDetail" component={PokemonDetailScreen} />
      <Stack.Screen name="PokemonMoves"  component={PokemonMovesScreen} />
      <Stack.Screen name="MoveDetail"    component={MoveDetailScreen} />
      <Stack.Screen name="Items"         component={ItemsScreen} />
      <Stack.Screen name="Berries"       component={BerriesScreen} />
      <Stack.Screen name="Comparator"    component={ComparatorScreen} />
    </Stack.Navigator>
  );
}