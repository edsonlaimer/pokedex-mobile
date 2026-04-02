import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { fetchPokemons, fetchAllPokemonIndex, fetchPokemonByName } from '../services/pokeapi';

const PAGE_SIZE = 20;

export default function HomeScreen({ navigation }) {
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState(null); // null = not searching

  const allIndexRef = useRef(null);
  const searchTimerRef = useRef(null);
  const isSearchMode = search.trim().length > 0;

  // Initial load
  useEffect(() => {
    loadInitial();
    fetchAllPokemonIndex().then((idx) => {
      allIndexRef.current = idx;
    });
  }, []);

  async function loadInitial() {
    try {
      setLoading(true);
      const { pokemons: data, hasMore: more } = await fetchPokemons(PAGE_SIZE, 0);
      setPokemons(data);
      setOffset(PAGE_SIZE);
      setHasMore(more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore || isSearchMode) return;
    try {
      setLoadingMore(true);
      const { pokemons: data, hasMore: more } = await fetchPokemons(PAGE_SIZE, offset);
      setPokemons((prev) => [...prev, ...data]);
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  // Debounced search across entire pokémon index
  const handleSearch = useCallback((text) => {
    setSearch(text);
    clearTimeout(searchTimerRef.current);

    if (!text.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      const index = allIndexRef.current;
      if (!index) return;

      const query = text.trim().toLowerCase();
      const matched = index.filter(
        (p) =>
          p.name.includes(query) ||
          String(p.id).padStart(3, '0').includes(query) ||
          String(p.id) === query
      );

      if (matched.length === 0) {
        setSearchResults([]);
        return;
      }

      // Fetch details for top 30 matches
      setSearching(true);
      try {
        const top = matched.slice(0, 30);
        const detailed = await Promise.all(top.map((p) => fetchPokemonByName(p.name)));
        setSearchResults(detailed);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const displayData = isSearchMode ? (searchResults ?? []) : pokemons;
  const isLoadingList = isSearchMode ? searching : loading;

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
            <Text style={styles.number}>#{String(item.id).padStart(3, '0')}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  function renderFooter() {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#9CA3AF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pokédex</Text>
          <Text style={styles.subtitle}>Explore todos os Pokémons e movimentos</Text>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="Buscar por nome ou número"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearch('')}
                style={styles.clearBtn}
              >
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoadingList && displayData.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>
              {isSearchMode ? 'Buscando Pokémons...' : 'Carregando Pokémons...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPokemon}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              isSearchMode && !searching ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Nenhum Pokémon encontrado.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 30, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1, fontSize: 14 },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 36,
    paddingRight: 40,
    fontSize: 15,
    color: '#111827',
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  clearIcon: { fontSize: 12, color: '#9CA3AF' },
  listContent: { padding: 16, paddingBottom: 30 },
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
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  imageWrapper: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  image: { width: 46, height: 46 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  number: { marginTop: 4, fontSize: 13, color: '#9CA3AF' },
  arrow: { fontSize: 24, color: '#D1D5DB', marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  emptyText: { color: '#6B7280', fontSize: 15 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});