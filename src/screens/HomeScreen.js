import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPokemons } from '../services/pokeapi';

export default function HomeScreen({ navigation }) {
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPokemons();
  }, []);

  async function loadPokemons() {
    try {
      const data = await fetchPokemons(20);
      setPokemons(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = pokemons.filter(
    (pokemon) =>
      pokemon.name.toLowerCase().includes(search.toLowerCase()) ||
      String(pokemon.id).padStart(3, '0').includes(search)
  );

  function renderPokemon({ item }) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => navigation.navigate('PokemonMoves', { pokemon: item })}
      >
        <View style={styles.leftContent}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.sprites.front_default }}
              style={styles.image}
            />
          </View>

          <View>
            <Text style={styles.name}>
              {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>
            <Text style={styles.number}>
              #{String(item.id).padStart(3, '0')}
            </Text>
          </View>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pokédex</Text>
          <Text style={styles.subtitle}>Explore Pokémons e movimentos</Text>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nome ou número"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando Pokémons...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPokemon}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },
  searchBox: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 36,
    paddingRight: 14,
    fontSize: 15,
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  image: {
    width: 46,
    height: 46,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  number: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
});