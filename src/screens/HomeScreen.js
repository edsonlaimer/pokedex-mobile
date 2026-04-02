import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPokemons, fetchAllPokemonIndex, fetchPokemonByName,
  fetchAllTypes, fetchType,
} from '../services/pokeapi';

const TYPE_COLORS = {
  fire:'#F97316', water:'#3B82F6', grass:'#22C55E', electric:'#EAB308',
  psychic:'#EC4899', ice:'#06B6D4', dragon:'#8B5CF6', dark:'#374151',
  fairy:'#F472B6', normal:'#9CA3AF', fighting:'#B45309', poison:'#A855F7',
  ground:'#D97706', flying:'#60A5FA', bug:'#65A30D', rock:'#78716C',
  ghost:'#6D28D9', steel:'#64748B',
};

const PAGE_SIZE = 20;

export default function HomeScreen({ navigation }) {
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [types, setTypes] = useState([]);
  const [activeType, setActiveType] = useState(null);
  const [typeResults, setTypeResults] = useState(null);
  const [loadingType, setLoadingType] = useState(false);

  const allIndexRef = useRef(null);
  const searchTimerRef = useRef(null);
  const isSearchMode = search.trim().length > 0;
  const isTypeMode = !!activeType;

  useEffect(() => {
    loadInitial();
    fetchAllPokemonIndex().then((idx) => { allIndexRef.current = idx; });
    fetchAllTypes().then(setTypes).catch(() => {});
  }, []);

  async function loadInitial() {
    try {
      setLoading(true);
      const { pokemons: data, hasMore: more } = await fetchPokemons(PAGE_SIZE, 0);
      setPokemons(data);
      setOffset(PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMore() {
    if (loadingMore || !hasMore || isSearchMode || isTypeMode) return;
    try {
      setLoadingMore(true);
      const { pokemons: data, hasMore: more } = await fetchPokemons(PAGE_SIZE, offset);
      setPokemons((prev) => [...prev, ...data]);
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }

  async function handleTypeFilter(typeName) {
    if (activeType === typeName) {
      setActiveType(null);
      setTypeResults(null);
      return;
    }
    setActiveType(typeName);
    setSearch('');
    setSearchResults(null);
    setLoadingType(true);
    try {
      const typeData = await fetchType(typeName);
      const top = typeData.pokemon.slice(0, 40);
      const detailed = await Promise.all(
        top.map(({ pokemon }) => fetchPokemonByName(pokemon.name))
      );
      setTypeResults(detailed);
    } catch (e) { console.error(e); }
    finally { setLoadingType(false); }
  }

  const handleSearch = useCallback((text) => {
    setSearch(text);
    setActiveType(null);
    setTypeResults(null);
    clearTimeout(searchTimerRef.current);
    if (!text.trim()) { setSearchResults(null); return; }

    searchTimerRef.current = setTimeout(async () => {
      const index = allIndexRef.current;
      if (!index) return;
      const query = text.trim().toLowerCase();
      const matched = index.filter(
        (p) => p.name.includes(query) ||
          String(p.id).padStart(3, '0').includes(query) ||
          String(p.id) === query
      ).slice(0, 30);

      if (!matched.length) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const detailed = await Promise.all(matched.map((p) => fetchPokemonByName(p.name)));
        setSearchResults(detailed);
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 400);
  }, []);

  const displayData = isSearchMode ? (searchResults ?? [])
    : isTypeMode ? (typeResults ?? [])
    : pokemons;

  const isLoadingList = isSearchMode ? searching : isTypeMode ? loadingType : loading;

  function renderPokemon({ item }) {
    const mainType = item.types[0]?.type.name;
    const color = TYPE_COLORS[mainType] || '#9CA3AF';
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => navigation.navigate('PokemonDetail', { pokemon: item })}
      >
        <View style={[styles.cardAccent, { backgroundColor: color + '22' }]} />
        <View style={styles.leftContent}>
          <View style={[styles.imageWrapper, { backgroundColor: color + '18' }]}>
            <Image source={{ uri: item.sprites.front_default }} style={styles.image} />
          </View>
          <View>
            <Text style={styles.name}>
              {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>
            <Text style={styles.number}>#{String(item.id).padStart(3, '0')}</Text>
            <View style={styles.typePills}>
              {item.types.map((t) => (
                <View key={t.type.name} style={[styles.typePill, { backgroundColor: TYPE_COLORS[t.type.name] || '#9CA3AF' }]}>
                  <Text style={styles.typePillText}>{t.type.name}</Text>
                </View>
              ))}
            </View>
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Pokédex</Text>
              <Text style={styles.subtitle}>Explore todos os Pokémons</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Comparator')}
              >
                <Text style={styles.actionBtnText}>⚖️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Items')}
              >
                <Text style={styles.actionBtnText}>🎒</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Berries')}
              >
                <Text style={styles.actionBtnText}>🍓</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
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
              <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Type filter */}
          {types.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeFilters}
            >
              {types.map((t) => {
                const active = activeType === t.name;
                const color = TYPE_COLORS[t.name] || '#9CA3AF';
                return (
                  <TouchableOpacity
                    key={t.name}
                    onPress={() => handleTypeFilter(t.name)}
                    style={[
                      styles.typeFilterBtn,
                      { backgroundColor: active ? color : color + '22', borderColor: color },
                    ]}
                  >
                    <Text style={[styles.typeFilterText, { color: active ? '#FFF' : color }]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Active filter label */}
        {isTypeMode && (
          <Text style={styles.filterLabel}>
            Filtrado por tipo: <Text style={{ fontWeight: '700' }}>{activeType}</Text>
          </Text>
        )}

        {isLoadingList && displayData.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando...</Text>
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
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#9CA3AF" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoadingList ? (
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  actionBtnText: { fontSize: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1, fontSize: 14 },
  input: {
    flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 14, paddingVertical: 12, paddingLeft: 36, paddingRight: 40, fontSize: 15, color: '#111827',
  },
  clearBtn: { position: 'absolute', right: 12, zIndex: 1, padding: 4 },
  clearIcon: { fontSize: 12, color: '#9CA3AF' },
  typeFilters: { paddingBottom: 4, gap: 6, flexDirection: 'row' },
  typeFilterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5,
  },
  typeFilterText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  filterLabel: { fontSize: 13, color: '#6B7280', paddingHorizontal: 16, paddingTop: 10 },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2, overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
    borderTopRightRadius: 18, borderBottomRightRadius: 18,
  },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  imageWrapper: {
    width: 58, height: 58, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  image: { width: 46, height: 46 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  number: { marginTop: 2, fontSize: 12, color: '#9CA3AF' },
  typePills: { flexDirection: 'row', gap: 5, marginTop: 6 },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  typePillText: { fontSize: 10, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
  arrow: { fontSize: 24, color: '#D1D5DB', marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  emptyText: { color: '#6B7280', fontSize: 15 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});