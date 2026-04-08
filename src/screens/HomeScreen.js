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
import { SearchBar, TypeBadge, BottomSheet, EmptyState } from '../components/components';
import { COLORS, RADIUS, SHADOW, TYPE_COLORS, TYPE_ICONS, getTypeColor, getTypeIcon, formatName, padId, hex2rgba } from '../components/constants';
import { usePaginatedList, useDebounce } from '../hooks/hooks';

const SEARCH_LIMIT = 30;

// ─── Type Filter Modal ────────────────────────────────────────────────────────
function TypeFilterModal({ visible, types, activeType, onSelect, onClose }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filtrar por Tipo">
      {activeType && (
        <TouchableOpacity style={tf.clearBtn} onPress={() => { onSelect(null); onClose(); }}>
          <Text style={tf.clearText}>✕  Remover filtro: {activeType}</Text>
        </TouchableOpacity>
      )}
      <View style={tf.grid}>
        {types.map((t) => {
          const active = activeType === t.name;
          const color  = getTypeColor(t.name);
          const icon   = getTypeIcon(t.name);
          return (
            <TouchableOpacity
              key={t.name}
              onPress={() => { onSelect(t.name); onClose(); }}
              activeOpacity={0.75}
              style={[tf.chip, { backgroundColor: active ? color : hex2rgba(color, 0.1), borderColor: active ? color : hex2rgba(color, 0.25) }]}
            >
              <Text style={tf.chipIcon}>{icon}</Text>
              <Text style={[tf.chipText, { color: active ? '#FFF' : color }]}>{t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const tf = StyleSheet.create({
  clearBtn:  { alignSelf: 'flex-start', marginBottom: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: '#FEE2E2' },
  clearText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, minWidth: '44%', flex: 1 },
  chipIcon:  { fontSize: 16 },
  chipText:  { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── Pokémon Card ─────────────────────────────────────────────────────────────
const PokemonCard = React.memo(({ item, onPress }) => {
  const mainType = item.types[0]?.type.name;
  const color    = getTypeColor(mainType);
  const icon     = getTypeIcon(mainType);

  return (
    <TouchableOpacity activeOpacity={0.82} style={pc.card} onPress={onPress}>
      {/* Color accent strip */}
      <View style={[pc.strip, { backgroundColor: hex2rgba(color, 0.12) }]} />

      <View style={pc.left}>
        {/* Sprite */}
        <View style={[pc.imgWrap, { backgroundColor: hex2rgba(color, 0.1) }]}>
          <Image source={{ uri: item.sprites.front_default }} style={pc.img} resizeMode="contain" />
        </View>

        {/* Info */}
        <View style={pc.info}>
          <Text style={pc.num}>{padId(item.id)}</Text>
          <Text style={pc.name}>{formatName(item.name)}</Text>
          <View style={pc.types}>
            {item.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
            ))}
          </View>
        </View>
      </View>

      {/* Right icon */}
      <View style={pc.right}>
        <Text style={pc.typeIcon}>{icon}</Text>
        <Text style={pc.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
});

const pc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, overflow: 'hidden',
    ...SHADOW.card,
  },
  strip: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
  left:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  imgWrap: { width: 64, height: 64, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  img:   { width: 54, height: 54 },
  info:  { flex: 1 },
  num:   { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  name:  { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  types: { flexDirection: 'row', gap: 5 },
  right: { alignItems: 'center', gap: 4 },
  typeIcon:{ fontSize: 22, opacity: 0.5 },
  arrow: { fontSize: 20, color: COLORS.textMuted },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { items: pokemons, loading, loadingMore, loadMore } = usePaginatedList(fetchPokemons);

  const [query,         setQuery]         = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching,     setSearching]     = useState(false);
  const [types,         setTypes]         = useState([]);
  const [activeType,    setActiveType]    = useState(null);
  const [typeResults,   setTypeResults]   = useState(null);
  const [loadingType,   setLoadingType]   = useState(false);
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
      .filter((p) => p.name.includes(q) || String(p.id) === q || String(p.id).padStart(3, '0').includes(q))
      .slice(0, SEARCH_LIMIT);
    if (!matched.length) { setSearchResults([]); return; }
    setSearching(true);
    try {
      setSearchResults(await Promise.all(matched.map((p) => fetchPokemonByName(p.name))));
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  }

  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    setActiveType(null);
    setTypeResults(null);
  }, []);

  async function handleTypeSelect(typeName) {
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
      const td = await fetchType(typeName);
      setTypeResults(
        await Promise.all(td.pokemon.slice(0, 40).map(({ pokemon }) => fetchPokemonByName(pokemon.name)))
      );
    } catch (e) { console.error(e); }
    finally { setLoadingType(false); }
  }

  const isSearchMode  = query.trim().length > 0;
  const isTypeMode    = !!activeType;
  const displayData   = isSearchMode ? (searchResults ?? []) : isTypeMode ? (typeResults ?? []) : pokemons;
  const isListLoading = isSearchMode ? searching : isTypeMode ? loadingType : loading;

  const renderItem = useCallback(({ item }) => (
    <PokemonCard item={item} onPress={() => navigation.navigate('PokemonDetail', { pokemon: item })} />
  ), [navigation]);

  const activeTypeColor = activeType ? getTypeColor(activeType) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={s.container}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.title}>Pokédex</Text>
              <Text style={s.subtitle}>
                {isTypeMode ? `Tipo: ${activeType}` : isSearchMode ? `Resultados para "${query}"` : 'Todos os Pokémons'}
              </Text>
            </View>
            <View style={s.actions}>
              {[
                { icon: '⚖️', screen: 'Comparator', label: 'Comparar' },
                { icon: '🎒', screen: 'Items',      label: 'Itens' },
                { icon: '🍓', screen: 'Berries',    label: 'Berries' },
              ].map(({ icon, screen }) => (
                <TouchableOpacity key={screen} style={s.actionBtn} onPress={() => navigation.navigate(screen)} activeOpacity={0.75}>
                  <Text style={s.actionIcon}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search row */}
          <View style={s.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar value={query} onChangeText={handleQueryChange} placeholder="Nome ou número..." />
            </View>
            <TouchableOpacity
              style={[s.filterBtn, isTypeMode && { backgroundColor: hex2rgba(activeTypeColor, 0.15), borderColor: activeTypeColor, borderWidth: 1.5 }]}
              onPress={() => setFilterVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={s.filterIcon}>{isTypeMode ? getTypeIcon(activeType) : '🎯'}</Text>
              {isTypeMode && <View style={[s.filterDot, { backgroundColor: activeTypeColor }]} />}
            </TouchableOpacity>
          </View>

          {/* Active type chip */}
          {isTypeMode && (
            <View style={s.activeRow}>
              <View style={[s.activeChip, { backgroundColor: hex2rgba(activeTypeColor, 0.1), borderColor: hex2rgba(activeTypeColor, 0.3) }]}>
                <Text style={[s.activeChipText, { color: activeTypeColor }]}>{getTypeIcon(activeType)}  {activeType}</Text>
                <TouchableOpacity onPress={() => handleTypeSelect(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[s.activeChipX, { color: activeTypeColor }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── List ── */}
        {isListLoading && displayData.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={s.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            onEndReached={!isSearchMode && !isTypeMode ? loadMore : undefined}
            onEndReachedThreshold={0.4}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color="#3B82F6" /> : null}
            ListEmptyComponent={!isListLoading ? <EmptyState icon="🔍" text="Nenhum Pokémon encontrado." /> : null}
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

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.surface },
  container:  { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.surface, paddingHorizontal: 20,
    paddingTop: 10, paddingBottom: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:      { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle:   { fontSize: 13, color: COLORS.textSub, marginTop: 2, fontWeight: '500', textTransform: 'capitalize' },
  actions:    { flexDirection: 'row', gap: 8 },
  actionBtn:  { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { fontSize: 18 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterBtn: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterIcon: { fontSize: 20 },
  filterDot:  { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4 },
  activeRow:  { flexDirection: 'row' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  activeChipText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  activeChipX:    { fontSize: 13, fontWeight: '800' },
  list:       { padding: 16, paddingBottom: 32 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:{ marginTop: 12, color: COLORS.textSub, fontWeight: '500' },
});