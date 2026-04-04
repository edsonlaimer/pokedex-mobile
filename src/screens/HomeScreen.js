import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, StatusBar, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPokemons, fetchAllPokemonIndex, fetchPokemonByName,
  fetchAllTypes, fetchType,
} from '../services/pokeapi';
import { SearchBar } from '../components/components';
import { getTypeColor, TYPE_COLORS, formatName, padId } from '../components/constants';
import { usePaginatedList, useDebounce } from '../hooks/hooks';

const SEARCH_LIMIT = 30;

// ─── Type Filter Modal ────────────────────────────────────────────────────────
function TypeFilterModal({ visible, types, activeType, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.sheetHeader}>
            <Text style={modal.sheetTitle}>Filtrar por Tipo</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Text style={modal.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {activeType && (
            <TouchableOpacity style={modal.clearBtn} onPress={() => onSelect(null)}>
              <Text style={modal.clearBtnText}>✕  Limpar filtro</Text>
            </TouchableOpacity>
          )}

          <ScrollView contentContainerStyle={modal.grid} showsVerticalScrollIndicator={false}>
            {types.map((t) => {
              const active = activeType === t.name;
              const color  = TYPE_COLORS[t.name] ?? '#9CA3AF';
              return (
                <TouchableOpacity
                  key={t.name}
                  onPress={() => { onSelect(t.name); onClose(); }}
                  style={[modal.chip, { backgroundColor: active ? color : color + '22', borderColor: color }]}
                >
                  <Text style={[modal.chipText, { color: active ? '#FFF' : color }]}>{t.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '70%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn:    { padding: 4 },
  closeText:   { fontSize: 18, color: '#9CA3AF' },
  clearBtn:    { alignSelf: 'flex-start', marginBottom: 14, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#FEE2E2' },
  clearBtnText:{ fontSize: 13, fontWeight: '700', color: '#EF4444' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  chip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5 },
  chipText:    { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { items: pokemons, loading, loadingMore, loadMore } = usePaginatedList(fetchPokemons);

  const [query, setQuery]               = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching]       = useState(false);

  const [types, setTypes]               = useState([]);
  const [activeType, setActiveType]     = useState(null);
  const [typeResults, setTypeResults]   = useState(null);
  const [loadingType, setLoadingType]   = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const allIndexRef    = useRef(null);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    fetchAllTypes().then(setTypes).catch(console.error);
    fetchAllPokemonIndex().then((idx) => { allIndexRef.current = idx; });
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults(null); return; }
    runSearch(debouncedQuery.trim().toLowerCase());
  }, [debouncedQuery]);

  async function runSearch(q) {
    const index = allIndexRef.current;
    if (!index) return;
    const matched = index
      .filter((p) => p.name.includes(q) || String(p.id) === q || padId(p.id).includes(q))
      .slice(0, SEARCH_LIMIT);
    if (!matched.length) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const detailed = await Promise.all(matched.map((p) => fetchPokemonByName(p.name)));
      setSearchResults(detailed);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  }

  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    setActiveType(null);
    setTypeResults(null);
  }, []);

  async function handleTypeSelect(typeName) {
    // null = clear filter
    if (!typeName || activeType === typeName) {
      setActiveType(null);
      setTypeResults(null);
      return;
    }
    setActiveType(typeName);
    setQuery('');
    setSearchResults(null);
    setLoadingType(true);
    try {
      const typeData = await fetchType(typeName);
      const detailed = await Promise.all(
        typeData.pokemon.slice(0, 40).map(({ pokemon }) => fetchPokemonByName(pokemon.name))
      );
      setTypeResults(detailed);
    } catch (e) { console.error(e); }
    finally { setLoadingType(false); }
  }

  const isSearchMode  = query.trim().length > 0;
  const isTypeMode    = !!activeType;
  const displayData   = isSearchMode ? (searchResults ?? []) : isTypeMode ? (typeResults ?? []) : pokemons;
  const isListLoading = isSearchMode ? searching : isTypeMode ? loadingType : loading;
  const hasActiveFilter = isTypeMode;

  const renderPokemon = useCallback(({ item }) => {
    const mainType = item.types[0]?.type.name;
    const color    = getTypeColor(mainType);
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
            <Text style={styles.name}>{formatName(item.name)}</Text>
            <Text style={styles.number}>#{padId(item.id)}</Text>
            <View style={styles.typePills}>
              {item.types.map((t) => (
                <View key={t.type.name} style={[styles.typePill, { backgroundColor: getTypeColor(t.type.name) }]}>
                  <Text style={styles.typePillText}>{t.type.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }, [navigation]);

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
              {[
                { icon: '⚖️', screen: 'Comparator' },
                { icon: '🎒', screen: 'Items' },
                { icon: '🍓', screen: 'Berries' },
              ].map(({ icon, screen }) => (
                <TouchableOpacity
                  key={screen}
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate(screen)}
                >
                  <Text style={styles.actionBtnText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search + filter button row */}
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Buscar por nome ou número"
              />
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
              onPress={() => setFilterVisible(true)}
            >
              <Text style={styles.filterBtnText}>🎯</Text>
              {hasActiveFilter && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>

          {/* Active type badge */}
          {isTypeMode && (
            <View style={styles.activeBadgeRow}>
              <View style={[styles.activeBadge, { backgroundColor: (TYPE_COLORS[activeType] ?? '#9CA3AF') + '22', borderColor: TYPE_COLORS[activeType] ?? '#9CA3AF' }]}>
                <Text style={[styles.activeBadgeText, { color: TYPE_COLORS[activeType] ?? '#9CA3AF' }]}>
                  {activeType}
                </Text>
                <TouchableOpacity onPress={() => handleTypeSelect(null)} style={styles.activeBadgeClear}>
                  <Text style={[styles.activeBadgeClearText, { color: TYPE_COLORS[activeType] ?? '#9CA3AF' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* List */}
        {isListLoading && displayData.length === 0 ? (
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
            onEndReached={!isSearchMode && !isTypeMode ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
            ListEmptyComponent={
              !isListLoading ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Nenhum Pokémon encontrado.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      <TypeFilterModal
        visible={filterVisible}
        types={types}
        activeType={activeType}
        onSelect={handleTypeSelect}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:          { flex: 1, backgroundColor: '#FFFFFF' },
  container:         { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12,
  },
  titleRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:             { fontSize: 30, fontWeight: '800', color: '#111827' },
  subtitle:          { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerActions:     { flexDirection: 'row', gap: 8 },
  actionBtn:         { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  actionBtnText:     { fontSize: 18 },
  searchRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive:   { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#3B82F6' },
  filterBtnText:     { fontSize: 20 },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6',
  },
  activeBadgeRow:    { flexDirection: 'row' },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingLeft: 12, paddingRight: 6, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1.5, gap: 6,
  },
  activeBadgeText:   { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  activeBadgeClear:  { padding: 2 },
  activeBadgeClearText: { fontSize: 12, fontWeight: '700' },
  listContent:       { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2, overflow: 'hidden',
  },
  cardAccent:        { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  leftContent:       { flexDirection: 'row', alignItems: 'center' },
  imageWrapper:      { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  image:             { width: 46, height: 46 },
  name:              { fontSize: 16, fontWeight: '700', color: '#111827' },
  number:            { marginTop: 2, fontSize: 12, color: '#9CA3AF' },
  typePills:         { flexDirection: 'row', gap: 5, marginTop: 6 },
  typePill:          { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  typePillText:      { fontSize: 10, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
  arrow:             { fontSize: 24, color: '#D1D5DB', marginLeft: 10 },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText:       { marginTop: 10, color: '#6B7280' },
  emptyText:         { color: '#6B7280', fontSize: 15 },
});