import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllPokemonIndex, fetchPokemonByName } from '../services/pokeapi';
import { TypeBadge, Card, CardTitle } from '../components/components';
import { getTypeColor, STAT_LABELS, STAT_ORDER, formatName, padId } from '../components/constants';
import { useDebounce } from '../hooks/hooks';

// ─── SearchPanel ──────────────────────────────────────────────────────────────
function SearchPanel({ label, selected, onSelect }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  function handleQuery(text) {
    setQuery(text);
    clearTimeout(timerRef.current);
    if (!text.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const index   = await fetchAllPokemonIndex();
        const q       = text.toLowerCase();
        const matched = index.filter((p) => p.name.includes(q) || String(p.id) === q).slice(0, 8);
        const detail  = await Promise.all(matched.map((p) => fetchPokemonByName(p.name)));
        setResults(detail);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 400);
  }

  function handleSelect(item) {
    onSelect(item);
    setResults([]);
    setQuery('');
  }

  return (
    <View style={panel.container}>
      <Text style={panel.label}>{label}</Text>
      {selected ? (
        <TouchableOpacity style={panel.selected} onPress={() => onSelect(null)} activeOpacity={0.8}>
          <Image source={{ uri: selected.sprites.front_default }} style={panel.selectedImage} />
          <Text style={panel.selectedName}>{formatName(selected.name)}</Text>
          <Text style={panel.change}>Trocar ✕</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={panel.inputWrapper}>
            <TextInput
              value={query}
              onChangeText={handleQuery}
              placeholder="Buscar..."
              placeholderTextColor="#9CA3AF"
              style={panel.input}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          {loading && <ActivityIndicator size="small" style={{ marginTop: 8 }} />}
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={panel.result} onPress={() => handleSelect(item)}>
              <Image source={{ uri: item.sprites.front_default }} style={panel.resultImage} />
              <Text style={panel.resultName}>{formatName(item.name)}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

const panel = StyleSheet.create({
  container:     { flex: 1 },
  label:         { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  inputWrapper:  { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  input:         { paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  result:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultImage:   { width: 36, height: 36, marginRight: 10 },
  resultName:    { fontSize: 14, color: '#111827', textTransform: 'capitalize' },
  selected:      { alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedImage: { width: 72, height: 72 },
  selectedName:  { fontSize: 15, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  change:        { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ComparatorScreen({ navigation }) {
  const [pokemonA, setPokemonA] = useState(null);
  const [pokemonB, setPokemonB] = useState(null);

  const getStat = (pokemon, name) =>
    pokemon?.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;

  const canCompare = pokemonA && pokemonB;
  const totalA = canCompare ? STAT_ORDER.reduce((s, n) => s + getStat(pokemonA, n), 0) : 0;
  const totalB = canCompare ? STAT_ORDER.reduce((s, n) => s + getStat(pokemonB, n), 0) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Comparador ⚖️</Text>
          <Text style={styles.subtitle}>Compare dois Pokémons lado a lado</Text>
        </View>

        <View style={styles.content}>
          {/* Search panels */}
          <View style={styles.panelsRow}>
            <SearchPanel label="Pokémon A" selected={pokemonA} onSelect={setPokemonA} />
            <Text style={styles.vs}>VS</Text>
            <SearchPanel label="Pokémon B" selected={pokemonB} onSelect={setPokemonB} />
          </View>

          {!canCompare && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>Selecione dois Pokémons para comparar</Text>
            </View>
          )}

          {/* Stats */}
          {canCompare && (
            <Card>
              <CardTitle>Estatísticas</CardTitle>

              {/* Name headers */}
              <View style={styles.statHeaderRow}>
                <Text style={styles.statHeaderName} numberOfLines={1}>{formatName(pokemonA.name)}</Text>
                <View style={styles.statLabelCol} />
                <Text style={[styles.statHeaderName, { textAlign: 'right' }]} numberOfLines={1}>
                  {formatName(pokemonB.name)}
                </Text>
              </View>

              {STAT_ORDER.map((name) => {
                const vA = getStat(pokemonA, name);
                const vB = getStat(pokemonB, name);
                return (
                  <View key={name} style={styles.statRow}>
                    <View style={styles.barLeft}>
                      <Text style={[styles.statNum, vA > vB && styles.winner]}>{vA}</Text>
                      <View style={styles.trackLeft}>
                        <View style={[styles.fillLeft, { width: `${(vA / 255) * 100}%`, backgroundColor: vA >= vB ? '#22C55E' : '#E5E7EB' }]} />
                      </View>
                    </View>
                    <Text style={styles.statLabel}>{STAT_LABELS[name]}</Text>
                    <View style={styles.barRight}>
                      <View style={styles.trackRight}>
                        <View style={[styles.fillRight, { width: `${(vB / 255) * 100}%`, backgroundColor: vB >= vA ? '#22C55E' : '#E5E7EB' }]} />
                      </View>
                      <Text style={[styles.statNum, vB > vA && styles.winner]}>{vB}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={[styles.totalNum, totalA > totalB && { color: '#22C55E' }]}>{totalA}</Text>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalNum, { textAlign: 'right' }, totalB > totalA && { color: '#22C55E' }]}>{totalB}</Text>
              </View>
            </Card>
          )}

          {/* Types */}
          {canCompare && (
            <Card>
              <CardTitle>Tipos</CardTitle>
              <View style={styles.typesRow}>
                <View style={styles.typesCol}>
                  {pokemonA.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </View>
                <View style={styles.typesCol}>
                  {pokemonB.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </View>
              </View>
            </Card>
          )}

          {/* Size */}
          {canCompare && (
            <Card>
              <CardTitle>Tamanho & Peso</CardTitle>
              <View style={styles.sizeRow}>
                {[pokemonA, pokemonB].map((p, i) => (
                  <View key={i} style={styles.sizeCol}>
                    <Text style={styles.sizeVal}>{(p.height / 10).toFixed(1)} m</Text>
                    <Text style={styles.sizeLbl}>Altura</Text>
                    <Text style={[styles.sizeVal, { marginTop: 10 }]}>{(p.weight / 10).toFixed(1)} kg</Text>
                    <Text style={styles.sizeLbl}>Peso</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backText:      { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title:         { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle:      { fontSize: 13, color: '#6B7280', marginTop: 2 },
  content:       { padding: 16 },
  panelsRow:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 16 },
  vs:            { fontSize: 16, fontWeight: '800', color: '#9CA3AF', paddingTop: 28 },
  statHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statHeaderName:{ flex: 1, fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  statLabelCol:  { width: 52 },
  statRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLeft:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barRight:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackLeft:     { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden', flexDirection: 'row', justifyContent: 'flex-end' },
  trackRight:    { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  fillLeft:      { height: '100%', borderRadius: 999 },
  fillRight:     { height: '100%', borderRadius: 999 },
  statLabel:     { width: 52, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  statNum:       { fontSize: 13, fontWeight: '700', color: '#9CA3AF', minWidth: 28, textAlign: 'center' },
  winner:        { color: '#22C55E' },
  totalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalNum:      { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  totalLabel:    { fontSize: 12, fontWeight: '700', color: '#6B7280', textAlign: 'center', width: 52 },
  typesRow:      { flexDirection: 'row' },
  typesCol:      { flex: 1, gap: 6, alignItems: 'center' },
  sizeRow:       { flexDirection: 'row' },
  sizeCol:       { flex: 1, alignItems: 'center' },
  sizeVal:       { fontSize: 20, fontWeight: '800', color: '#111827' },
  sizeLbl:       { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  emptyState:    { alignItems: 'center', paddingTop: 40 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});