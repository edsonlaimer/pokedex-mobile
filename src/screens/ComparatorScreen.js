import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, TextInput, FlatList, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllPokemonIndex, fetchPokemonByName } from '../services/pokeapi';

const TYPE_COLORS = {
  fire:'#F97316', water:'#3B82F6', grass:'#22C55E', electric:'#EAB308',
  psychic:'#EC4899', ice:'#06B6D4', dragon:'#8B5CF6', dark:'#374151',
  fairy:'#F472B6', normal:'#9CA3AF', fighting:'#B45309', poison:'#A855F7',
  ground:'#D97706', flying:'#60A5FA', bug:'#65A30D', rock:'#78716C',
  ghost:'#6D28D9', steel:'#64748B',
};

const STAT_LABELS = {
  hp:'HP', attack:'ATK', defense:'DEF',
  'special-attack':'SP.ATK', 'special-defense':'SP.DEF', speed:'VEL',
};

const STAT_ORDER = ['hp','attack','defense','special-attack','special-defense','speed'];

function getTypeColor(type) { return TYPE_COLORS[type] || '#9CA3AF'; }

function SearchPanel({ label, selected, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  async function handleSearch(text) {
    setQuery(text);
    clearTimeout(timerRef.current);
    if (!text.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const index = await fetchAllPokemonIndex();
        const q = text.toLowerCase();
        const matched = index.filter(
          (p) => p.name.includes(q) || String(p.id) === q
        ).slice(0, 8);
        const detailed = await Promise.all(matched.map((p) => fetchPokemonByName(p.name)));
        setResults(detailed);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 400);
  }

  return (
    <View style={panel.container}>
      <Text style={panel.label}>{label}</Text>
      {selected ? (
        <TouchableOpacity
          style={panel.selectedCard}
          onPress={() => { onSelect(null); setQuery(''); setResults([]); }}
          activeOpacity={0.8}
        >
          <Image source={{ uri: selected.sprites.front_default }} style={panel.selectedImage} />
          <Text style={panel.selectedName}>
            {selected.name.charAt(0).toUpperCase() + selected.name.slice(1)}
          </Text>
          <Text style={panel.change}>Trocar ✕</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={panel.searchBox}>
            <TextInput
              value={query}
              onChangeText={handleSearch}
              placeholder="Buscar Pokémon..."
              placeholderTextColor="#9CA3AF"
              style={panel.input}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          {loading && <ActivityIndicator size="small" style={{ marginTop: 8 }} />}
          {results.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={panel.resultItem}
              onPress={() => { onSelect(item); setResults([]); setQuery(''); }}
            >
              <Image source={{ uri: item.sprites.front_default }} style={panel.resultImage} />
              <Text style={panel.resultName}>
                {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

const panel = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  searchBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  input: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultImage: { width: 36, height: 36, marginRight: 10 },
  resultName: { fontSize: 14, color: '#111827', textTransform: 'capitalize' },
  selectedCard: { alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedImage: { width: 72, height: 72 },
  selectedName: { fontSize: 15, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  change: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
});

export default function ComparatorScreen({ navigation }) {
  const [pokemonA, setPokemonA] = useState(null);
  const [pokemonB, setPokemonB] = useState(null);

  function getStat(pokemon, statName) {
    return pokemon?.stats.find((s) => s.stat.name === statName)?.base_stat ?? 0;
  }

  const canCompare = pokemonA && pokemonB;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Comparador</Text>
          <Text style={styles.subtitle}>Compare dois Pokémons lado a lado</Text>
        </View>

        <View style={styles.content}>
          {/* Search panels */}
          <View style={styles.panelsRow}>
            <SearchPanel label="Pokémon A" selected={pokemonA} onSelect={setPokemonA} />
            <View style={styles.vsContainer}>
              <Text style={styles.vs}>VS</Text>
            </View>
            <SearchPanel label="Pokémon B" selected={pokemonB} onSelect={setPokemonB} />
          </View>

          {/* Stat comparison */}
          {canCompare && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estatísticas</Text>

              {/* Header */}
              <View style={styles.statHeaderRow}>
                <View style={styles.statHeaderPoke}>
                  <Text style={styles.statHeaderName} numberOfLines={1}>
                    {pokemonA.name.charAt(0).toUpperCase() + pokemonA.name.slice(1)}
                  </Text>
                </View>
                <View style={styles.statHeaderLabel} />
                <View style={styles.statHeaderPoke}>
                  <Text style={[styles.statHeaderName, { textAlign: 'right' }]} numberOfLines={1}>
                    {pokemonB.name.charAt(0).toUpperCase() + pokemonB.name.slice(1)}
                  </Text>
                </View>
              </View>

              {STAT_ORDER.map((statName) => {
                const valA = getStat(pokemonA, statName);
                const valB = getStat(pokemonB, statName);
                const max = Math.max(valA, valB, 1);
                const winnerA = valA > valB;
                const winnerB = valB > valA;
                return (
                  <View key={statName} style={styles.statRow}>
                    {/* Bar A */}
                    <View style={styles.barContainerLeft}>
                      <Text style={[styles.statNum, winnerA && styles.statNumWinner]}>{valA}</Text>
                      <View style={styles.trackLeft}>
                        <View style={[
                          styles.fillLeft,
                          {
                            width: `${(valA / 255) * 100}%`,
                            backgroundColor: winnerA ? '#22C55E' : '#9CA3AF',
                          },
                        ]} />
                      </View>
                    </View>

                    {/* Label */}
                    <Text style={styles.statLabel}>{STAT_LABELS[statName]}</Text>

                    {/* Bar B */}
                    <View style={styles.barContainerRight}>
                      <View style={styles.trackRight}>
                        <View style={[
                          styles.fillRight,
                          {
                            width: `${(valB / 255) * 100}%`,
                            backgroundColor: winnerB ? '#22C55E' : '#9CA3AF',
                          },
                        ]} />
                      </View>
                      <Text style={[styles.statNum, winnerB && styles.statNumWinner]}>{valB}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Total */}
              <View style={styles.totalRow}>
                {(() => {
                  const totalA = STAT_ORDER.reduce((s, n) => s + getStat(pokemonA, n), 0);
                  const totalB = STAT_ORDER.reduce((s, n) => s + getStat(pokemonB, n), 0);
                  return (
                    <>
                      <Text style={[styles.totalNum, totalA > totalB && { color: '#22C55E' }]}>{totalA}</Text>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={[styles.totalNum, totalB > totalA && { color: '#22C55E' }]}>{totalB}</Text>
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          {/* Types */}
          {canCompare && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tipos</Text>
              <View style={styles.typesCompareRow}>
                <View style={styles.typesCol}>
                  {pokemonA.types.map((t) => (
                    <View key={t.type.name} style={[styles.typeBadge, { backgroundColor: getTypeColor(t.type.name) }]}>
                      <Text style={styles.typeBadgeText}>{t.type.name}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.typesCol}>
                  {pokemonB.types.map((t) => (
                    <View key={t.type.name} style={[styles.typeBadge, { backgroundColor: getTypeColor(t.type.name) }]}>
                      <Text style={styles.typeBadgeText}>{t.type.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Size */}
          {canCompare && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tamanho & Peso</Text>
              <View style={styles.sizeRow}>
                <View style={styles.sizeCol}>
                  <Text style={styles.sizeVal}>{(pokemonA.height / 10).toFixed(1)} m</Text>
                  <Text style={styles.sizeLbl}>Altura</Text>
                  <Text style={[styles.sizeVal, { marginTop: 10 }]}>{(pokemonA.weight / 10).toFixed(1)} kg</Text>
                  <Text style={styles.sizeLbl}>Peso</Text>
                </View>
                <View style={styles.sizeCol}>
                  <Text style={styles.sizeVal}>{(pokemonB.height / 10).toFixed(1)} m</Text>
                  <Text style={styles.sizeLbl}>Altura</Text>
                  <Text style={[styles.sizeVal, { marginTop: 10 }]}>{(pokemonB.weight / 10).toFixed(1)} kg</Text>
                  <Text style={styles.sizeLbl}>Peso</Text>
                </View>
              </View>
            </View>
          )}

          {!canCompare && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>Selecione dois Pokémons para comparar</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backText: { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  content: { padding: 16 },
  panelsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 16 },
  vsContainer: { justifyContent: 'center', alignItems: 'center', paddingTop: 28 },
  vs: { fontSize: 16, fontWeight: '800', color: '#9CA3AF' },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  statHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statHeaderPoke: { flex: 1 },
  statHeaderLabel: { width: 52 },
  statHeaderName: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barContainerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barContainerRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackLeft: { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden', flexDirection: 'row', justifyContent: 'flex-end' },
  trackRight: { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  fillLeft: { height: '100%', borderRadius: 999, alignSelf: 'flex-end' },
  fillRight: { height: '100%', borderRadius: 999 },
  statLabel: { width: 52, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  statNum: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', minWidth: 28, textAlign: 'center' },
  statNumWinner: { color: '#22C55E' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalNum: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textAlign: 'center', width: 52 },
  typesCompareRow: { flexDirection: 'row' },
  typesCol: { flex: 1, gap: 6, alignItems: 'center' },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  typeBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  sizeRow: { flexDirection: 'row' },
  sizeCol: { flex: 1, alignItems: 'center' },
  sizeVal: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sizeLbl: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});