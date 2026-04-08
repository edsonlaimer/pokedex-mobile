import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllPokemonIndex, fetchPokemonByName } from '../services/pokeapi';
import { TypeBadge, Card, CardTitle, SectionDivider, BackButton } from '../components/components';
import { COLORS, RADIUS, SHADOW, STAT_LABELS, STAT_ORDER, STAT_COLORS, getTypeColor, formatName, padId, hex2rgba } from '../components/constants';

// ─── Pokemon Search Panel ─────────────────────────────────────────────────────
function PickerPanel({ label, selected, onSelect }) {
  const [query,   setQuery]   = useState('');
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
        const matched = index.filter((p) => p.name.includes(q) || String(p.id) === q).slice(0, 6);
        setResults(await Promise.all(matched.map((p) => fetchPokemonByName(p.name))));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 400);
  }

  function pick(item) { onSelect(item); setResults([]); setQuery(''); }

  const color = selected ? getTypeColor(selected.types[0]?.type.name) : COLORS.textMuted;

  return (
    <View style={pp.wrap}>
      <Text style={pp.label}>{label}</Text>
      {selected ? (
        <TouchableOpacity style={[pp.selected, { borderColor: color }]} onPress={() => onSelect(null)} activeOpacity={0.8}>
          <View style={[pp.selectedImg, { backgroundColor: hex2rgba(color, 0.1) }]}>
            <Image source={{ uri: selected.sprites.front_default }} style={pp.sprite} resizeMode="contain" />
          </View>
          <Text style={pp.selectedName}>{formatName(selected.name)}</Text>
          <Text style={pp.selectedNum}>{padId(selected.id)}</Text>
          <Text style={[pp.change, { color }]}>Trocar</Text>
        </TouchableOpacity>
      ) : (
        <View style={pp.searchWrap}>
          <TextInput
            value={query}
            onChangeText={handleQuery}
            placeholder="Buscar..."
            placeholderTextColor={COLORS.textMuted}
            style={pp.input}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading && <ActivityIndicator size="small" style={{ marginTop: 8 }} color="#3B82F6" />}
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={pp.result} onPress={() => pick(item)}>
              <Image source={{ uri: item.sprites.front_default }} style={pp.resultImg} resizeMode="contain" />
              <View>
                <Text style={pp.resultName}>{formatName(item.name)}</Text>
                <Text style={pp.resultNum}>{padId(item.id)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const pp = StyleSheet.create({
  wrap:        { flex: 1 },
  label:       { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center' },
  selected:    { alignItems: 'center', padding: 12, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 2 },
  selectedImg: { width: 80, height: 80, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  sprite:      { width: 64, height: 64 },
  selectedName:{ fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize', textAlign: 'center' },
  selectedNum: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  change:      { fontSize: 11, fontWeight: '700', marginTop: 6 },
  searchWrap:  { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  input:       { paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  result:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  resultImg:   { width: 36, height: 36 },
  resultName:  { fontSize: 13, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  resultNum:   { fontSize: 11, color: COLORS.textMuted },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ComparatorScreen({ navigation }) {
  const [pokeA, setPokeA] = useState(null);
  const [pokeB, setPokeB] = useState(null);

  const getStat = (p, name) => p?.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
  const totalA  = STAT_ORDER.reduce((s, n) => s + getStat(pokeA, n), 0);
  const totalB  = STAT_ORDER.reduce((s, n) => s + getStat(pokeB, n), 0);
  const canComp = pokeA && pokeB;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={s.title}>Comparador ⚖️</Text>
        <Text style={s.subtitle}>Confronte dois Pokémons</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Pickers */}
        <View style={s.pickers}>
          <PickerPanel label="Pokémon A" selected={pokeA} onSelect={setPokeA} />
          <Text style={s.vs}>VS</Text>
          <PickerPanel label="Pokémon B" selected={pokeB} onSelect={setPokeB} />
        </View>

        {!canComp && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⚖️</Text>
            <Text style={s.emptyText}>Escolha dois Pokémons para comparar</Text>
          </View>
        )}

        {canComp && (
          <>
            {/* Stats card */}
            <Card>
              <CardTitle>Base Stats</CardTitle>

              <View style={s.statNames}>
                <Text style={[s.statPlayerName, { color: getTypeColor(pokeA.types[0]?.type.name) }]} numberOfLines={1}>
                  {formatName(pokeA.name)}
                </Text>
                <View style={s.statLabelCol} />
                <Text style={[s.statPlayerName, { color: getTypeColor(pokeB.types[0]?.type.name), textAlign: 'right' }]} numberOfLines={1}>
                  {formatName(pokeB.name)}
                </Text>
              </View>

              {STAT_ORDER.map((name) => {
                const vA = getStat(pokeA, name);
                const vB = getStat(pokeB, name);
                const colorA = vA >= vB ? (STAT_COLORS[name] ?? '#22C55E') : COLORS.border;
                const colorB = vB >= vA ? (STAT_COLORS[name] ?? '#22C55E') : COLORS.border;
                return (
                  <View key={name} style={s.statRow}>
                    <View style={s.barLeft}>
                      <Text style={[s.statNum, vA > vB && { color: STAT_COLORS[name] }]}>{vA}</Text>
                      <View style={s.trackLeft}>
                        <View style={[s.fillLeft, { width: `${(vA / 255) * 100}%`, backgroundColor: colorA }]} />
                      </View>
                    </View>
                    <Text style={s.statLabel}>{STAT_LABELS[name]}</Text>
                    <View style={s.barRight}>
                      <View style={s.trackRight}>
                        <View style={[s.fillRight, { width: `${(vB / 255) * 100}%`, backgroundColor: colorB }]} />
                      </View>
                      <Text style={[s.statNum, vB > vA && { color: STAT_COLORS[name] }]}>{vB}</Text>
                    </View>
                  </View>
                );
              })}

              <SectionDivider />
              <View style={s.totalRow}>
                <Text style={[s.totalNum, { color: totalA > totalB ? '#22C55E' : COLORS.textMuted }]}>{totalA}</Text>
                <Text style={s.totalLabel}>TOTAL</Text>
                <Text style={[s.totalNum, { textAlign: 'right', color: totalB > totalA ? '#22C55E' : COLORS.textMuted }]}>{totalB}</Text>
              </View>
            </Card>

            {/* Types */}
            <Card>
              <CardTitle>Tipos</CardTitle>
              <View style={s.typesRow}>
                <View style={s.typesCol}>
                  {pokeA.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </View>
                <View style={s.typesCol}>
                  {pokeB.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </View>
              </View>
            </Card>

            {/* Size */}
            <Card>
              <CardTitle>Tamanho & Peso</CardTitle>
              <View style={s.sizeRow}>
                {[pokeA, pokeB].map((p, i) => (
                  <View key={i} style={s.sizeCol}>
                    <Text style={s.sizeVal}>{(p.height / 10).toFixed(1)} m</Text>
                    <Text style={s.sizeLbl}>Altura</Text>
                    <Text style={[s.sizeVal, { marginTop: 12 }]}>{(p.weight / 10).toFixed(1)} kg</Text>
                    <Text style={s.sizeLbl}>Peso</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:   { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  subtitle:{ fontSize: 13, color: COLORS.textSub, marginTop: 2, fontWeight: '500' },
  scroll:  { padding: 16, paddingBottom: 40 },
  pickers: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  vs:      { fontSize: 15, fontWeight: '900', color: COLORS.textMuted, paddingTop: 40 },
  empty:   { alignItems: 'center', paddingTop: 40 },
  emptyIcon:{ fontSize: 48, marginBottom: 12 },
  emptyText:{ fontSize: 15, color: COLORS.textMuted, fontWeight: '500' },
  statNames:{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statPlayerName: { flex: 1, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  statLabelCol:   { width: 56 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  barRight:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackLeft: { flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden', flexDirection: 'row', justifyContent: 'flex-end' },
  trackRight:{ flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
  fillLeft:  { height: '100%', borderRadius: 99 },
  fillRight: { height: '100%', borderRadius: 99 },
  statLabel: { width: 56, textAlign: 'center', fontSize: 10, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  statNum:   { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, minWidth: 28, textAlign: 'center' },
  totalRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalNum:  { fontSize: 22, fontWeight: '900', flex: 1 },
  totalLabel:{ fontSize: 11, fontWeight: '800', color: COLORS.textSub, textAlign: 'center', width: 56, textTransform: 'uppercase', letterSpacing: 0.6 },
  typesRow:  { flexDirection: 'row' },
  typesCol:  { flex: 1, gap: 6, alignItems: 'center' },
  sizeRow:   { flexDirection: 'row' },
  sizeCol:   { flex: 1, alignItems: 'center' },
  sizeVal:   { fontSize: 22, fontWeight: '900', color: COLORS.text },
  sizeLbl:   { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
});