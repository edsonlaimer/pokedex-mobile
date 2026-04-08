import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';
import { TypeBadge, Card, CardTitle, InfoGrid, BackButton, SectionDivider } from '../components/components';
import { COLORS, RADIUS, SHADOW, getTypeColor, formatName, padId, hex2rgba } from '../components/constants';

const DAMAGE_ICON = { physical: '💥', special: '✨', status: '🔄' };

export default function MoveDetailScreen({ route, navigation }) {
  const { moveName, pokemon } = route.params;
  const [move,    setMove]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoveByName(moveName)
      .then(setMove)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moveName]);

  if (loading) {
    return (
      <SafeAreaView style={s.loadSafe} edges={['top', 'left', 'right']}>
        <View style={s.center}><ActivityIndicator size="large" /><Text style={s.loadText}>Carregando...</Text></View>
      </SafeAreaView>
    );
  }

  if (!move) {
    return (
      <SafeAreaView style={s.loadSafe} edges={['top', 'left', 'right']}>
        <View style={s.center}><Text style={s.loadText}>Movimento não encontrado.</Text></View>
      </SafeAreaView>
    );
  }

  const typeColor   = getTypeColor(move.type.name);
  const description =
    move.flavor_text_entries?.find((e) => e.language.name === 'en')?.flavor_text ||
    move.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ||
    'No description available.';
  const fullEffect = move.effect_entries?.find((e) => e.language.name === 'en')?.effect ?? '';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: typeColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={typeColor} />

      {/* Hero */}
      <View style={[s.hero, { backgroundColor: typeColor }]}>
        <BackButton onPress={() => navigation.goBack()} light />
        <Text style={s.heroName}>{formatName(move.name)}</Text>
        <View style={s.heroRow}>
          <TypeBadge type={move.type.name} light />
          <View style={s.damageChip}>
            <Text style={s.damageText}>{DAMAGE_ICON[move.damage_class?.name] ?? '❓'} {move.damage_class?.name}</Text>
          </View>
        </View>
      </View>

      <View style={s.body}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Stats float cards */}
          <View style={s.statsRow}>
            {[
              { label: 'Poder',    value: move.power    ?? '—' },
              { label: 'Precisão', value: move.accuracy ? `${move.accuracy}%` : '—' },
              { label: 'PP',       value: move.pp       ?? '—' },
            ].map(({ label, value }) => (
              <View key={label} style={s.statCard}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={[s.statValue, { color: typeColor }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Card>
            <CardTitle>Descrição</CardTitle>
            <Text style={s.desc}>{description.replace(/\f/g, ' ')}</Text>
            {!!fullEffect && fullEffect !== description && (
              <>
                <SectionDivider />
                <Text style={s.effect}>{fullEffect.replace(/\$effect_chance/g, move.effect_chance ?? '?').replace(/\f/g, ' ')}</Text>
              </>
            )}
          </Card>

          {/* Extra info */}
          <Card>
            <CardTitle>Informações</CardTitle>
            <InfoGrid items={[
              { label: 'Geração', value: move.generation?.name?.replace('generation-', 'Gen ').toUpperCase() },
              { label: 'Alvo',    value: move.target?.name?.replace(/-/g, ' ') },
              { label: 'Prioridade', value: move.priority },
              { label: 'Ailment', value: move.meta?.ailment?.name !== 'none' ? move.meta?.ailment?.name : undefined },
            ]} />
          </Card>

          {/* Pokémon card */}
          <Card>
            <CardTitle>Pokémon</CardTitle>
            <View style={s.pokeRow}>
              <View style={[s.pokeImg, { backgroundColor: hex2rgba(typeColor, 0.1) }]}>
                <Image source={{ uri: pokemon.sprites.front_default }} style={s.sprite} resizeMode="contain" />
              </View>
              <View>
                <Text style={s.pokeName}>{formatName(pokemon.name)}</Text>
                <Text style={s.pokeNum}>{padId(pokemon.id)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {pokemon.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
                </View>
              </View>
            </View>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  loadSafe:  { flex: 1, backgroundColor: COLORS.surface },
  hero:      { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  heroName:  { fontSize: 28, fontWeight: '900', color: '#FFF', textTransform: 'capitalize', marginBottom: 10, letterSpacing: -0.4 },
  heroRow:   { flexDirection: 'row', gap: 8, alignItems: 'center' },
  damageChip:{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  damageText:{ color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  body:      { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
  scroll:    { padding: 16, paddingBottom: 40 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center',
    ...SHADOW.card,
  },
  statLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900' },
  desc:      { fontSize: 14, lineHeight: 22, color: COLORS.textSub },
  effect:    { fontSize: 13, lineHeight: 20, color: COLORS.textMuted },
  pokeRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pokeImg:   { width: 70, height: 70, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  sprite:    { width: 56, height: 56 },
  pokeName:  { fontSize: 17, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
  pokeNum:   { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText:  { marginTop: 10, color: COLORS.textSub },
});