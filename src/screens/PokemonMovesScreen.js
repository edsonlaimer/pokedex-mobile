import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';
import { TypeBadge, BackButton, EmptyState } from '../components/components';
import { COLORS, RADIUS, SHADOW, getTypeColor, formatName, padId, hex2rgba } from '../components/constants';

const BATCH_SIZE = 5;
const MAX_MOVES  = 20;

const DAMAGE_CLASS_ICON = { physical: '💥', special: '✨', status: '🔄' };

export default function PokemonMovesScreen({ route, navigation }) {
  const { pokemon }  = route.params;
  const accentColor  = getTypeColor(pokemon.types[0]?.type.name);
  const [moves,   setMoves]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMoves(); }, []);

  async function loadMoves() {
    const candidates = pokemon.moves.slice(0, MAX_MOVES * 2);
    const results    = [];
    try {
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch   = candidates.slice(i, i + BATCH_SIZE);
        const fetched = await Promise.all(batch.map(({ move }) => fetchMoveByName(move.name)));
        results.push(...fetched.filter((m) => m.power || m.accuracy));
        setMoves([...results]);
        if (results.length >= MAX_MOVES) break;
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const renderMove = useCallback(({ item }) => {
    const typeColor = getTypeColor(item.type.name);
    const classIcon = DAMAGE_CLASS_ICON[item.damage_class?.name] ?? '❓';
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={s.moveCard}
        onPress={() => navigation.navigate('MoveDetail', { moveName: item.name, pokemon })}
      >
        <View style={[s.moveAccent, { backgroundColor: hex2rgba(typeColor, 0.12) }]} />
        <View style={s.moveMain}>
          <View style={s.moveTop}>
            <Text style={s.moveName}>{formatName(item.name)}</Text>
            <Text style={s.classIcon}>{classIcon}</Text>
          </View>
          <View style={s.moveMeta}>
            <TypeBadge type={item.type.name} size="sm" />
            <View style={s.statPill}>
              <Text style={s.statPillLabel}>PWR</Text>
              <Text style={s.statPillVal}>{item.power ?? '—'}</Text>
            </View>
            <View style={s.statPill}>
              <Text style={s.statPillLabel}>ACC</Text>
              <Text style={s.statPillVal}>{item.accuracy ? `${item.accuracy}%` : '—'}</Text>
            </View>
            <View style={s.statPill}>
              <Text style={s.statPillLabel}>PP</Text>
              <Text style={s.statPillVal}>{item.pp ?? '—'}</Text>
            </View>
          </View>
        </View>
        <Text style={s.arrow}>›</Text>
      </TouchableOpacity>
    );
  }, [navigation, pokemon]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={s.poke}>
          <View style={[s.pokeImgWrap, { backgroundColor: hex2rgba(accentColor, 0.1) }]}>
            <Image source={{ uri: pokemon.sprites.front_default }} style={s.pokeImg} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pokeNum}>{padId(pokemon.id)}</Text>
            <Text style={s.pokeName}>{formatName(pokemon.name)}</Text>
            <View style={s.pokeTypes}>
              {pokemon.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
            </View>
          </View>
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Movimentos</Text>
        {loading && <ActivityIndicator size="small" color={accentColor} />}
      </View>

      <FlatList
        data={moves}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMove}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? <EmptyState icon="⚔️" text="Nenhum movimento disponível." /> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  poke:         { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pokeImgWrap:  { width: 72, height: 72, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  pokeImg:      { width: 60, height: 60 },
  pokeNum:      { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  pokeName:     { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.3 },
  pokeTypes:    { flexDirection: 'row', gap: 6, marginTop: 6 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: 0.8 },
  list:         { paddingHorizontal: 16, paddingBottom: 32 },
  moveCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', padding: 14, overflow: 'hidden',
    ...SHADOW.card,
  },
  moveAccent:   { position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
  moveMain:     { flex: 1 },
  moveTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  moveName:     { fontSize: 15, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
  classIcon:    { fontSize: 18 },
  moveMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statPillLabel:{ fontSize: 9, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statPillVal:  { fontSize: 12, fontWeight: '800', color: COLORS.text },
  arrow:        { fontSize: 20, color: COLORS.textMuted, marginLeft: 8 },
});