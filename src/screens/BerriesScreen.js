import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchBerries } from '../services/pokeapi';
import { SearchBar, BottomSheet, Card, CardTitle, SectionDivider, EmptyState, BackButton } from '../components/components';
import { COLORS, RADIUS, SHADOW, FLAVOR_COLORS, formatName } from '../components/constants';
import { usePaginatedList, useLocalSearch } from '../hooks/hooks';

const FIRMNESS_COLORS = {
  'very-soft':'#FCA5A5', soft:'#FDBA74', hard:'#86EFAC',
  'very-hard':'#6EE7B7', 'super-hard':'#5EEAD4',
};

function getTopFlavor(berry) {
  const active = berry.flavors?.filter((f) => f.potency > 0) ?? [];
  return active.reduce((best, f) => (f.potency > (best?.potency ?? -1) ? f : best), null);
}

function BerryCard({ berry, onPress }) {
  const spriteUri     = berry.itemData?.sprites?.default;
  const topFlavor     = getTopFlavor(berry);
  const flavorColor   = topFlavor ? (FLAVOR_COLORS[topFlavor.flavor.name] ?? COLORS.textMuted) : COLORS.textMuted;
  const firmnessColor = FIRMNESS_COLORS[berry.firmness?.name] ?? COLORS.border;

  return (
    <TouchableOpacity style={bc.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[bc.iconBox, { backgroundColor: flavorColor + '18' }]}>
        {spriteUri
          ? <Image source={{ uri: spriteUri }} style={bc.sprite} resizeMode="contain" />
          : <Text style={bc.emoji}>🍒</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={bc.name}>{formatName(berry.name)} Berry</Text>
        <View style={bc.tags}>
          {topFlavor && (
            <View style={[bc.tag, { backgroundColor: flavorColor + '18' }]}>
              <Text style={[bc.tagText, { color: flavorColor }]}>{topFlavor.flavor.name}</Text>
            </View>
          )}
          <View style={[bc.tag, { backgroundColor: firmnessColor + '44' }]}>
            <Text style={[bc.tagText, { color: '#374151' }]}>{berry.firmness?.name?.replace(/-/g, ' ')}</Text>
          </View>
        </View>
        <View style={bc.stats}>
          <Text style={bc.stat}>⏱ {berry.growth_time}h</Text>
          <Text style={bc.stat}>🍒 ×{berry.max_harvest}</Text>
          <Text style={bc.stat}>⚡ {berry.natural_gift_power}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.card,
  },
  iconBox: { width: 56, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  sprite:  { width: 44, height: 44 },
  emoji:   { fontSize: 28 },
  name:    { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  tags:    { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  tag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  tagText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  stats:   { flexDirection: 'row', gap: 10 },
  stat:    { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
});

function BerryDetail({ berry }) {
  const spriteUri     = berry.itemData?.sprites?.default;
  const activeFlavors = berry.flavors?.filter((f) => f.potency > 0) ?? [];

  return (
    <>
      <View style={bd.top}>
        {spriteUri
          ? <Image source={{ uri: spriteUri }} style={bd.bigSprite} resizeMode="contain" />
          : <Text style={{ fontSize: 80 }}>🍒</Text>
        }
        <Text style={bd.name}>{formatName(berry.name)} Berry</Text>
      </View>

      <Card style={{ marginBottom: 10 }}>
        <CardTitle>Detalhes</CardTitle>
        <View style={bd.grid}>
          {[
            { label: 'Crescimento', value: `${berry.growth_time}h` },
            { label: 'Max Colheita', value: `×${berry.max_harvest}` },
            { label: 'Natural Gift', value: berry.natural_gift_power },
            { label: 'Tamanho',     value: `${berry.size} mm` },
            { label: 'Suavidade',   value: berry.smoothness },
            { label: 'Firmeza',     value: formatName(berry.firmness?.name ?? '—') },
          ].map(({ label, value }) => (
            <View key={label} style={bd.gridItem}>
              <Text style={bd.gridLabel}>{label}</Text>
              <Text style={bd.gridValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>

      {activeFlavors.length > 0 && (
        <Card>
          <CardTitle>Sabores</CardTitle>
          {activeFlavors.map((f) => {
            const color = FLAVOR_COLORS[f.flavor.name] ?? COLORS.textMuted;
            return (
              <View key={f.flavor.name} style={bd.flavorRow}>
                <Text style={[bd.flavorName, { color }]}>{f.flavor.name}</Text>
                <View style={bd.track}>
                  <View style={[bd.fill, { width: `${(f.potency / 40) * 100}%`, backgroundColor: color }]} />
                </View>
                <Text style={bd.potency}>{f.potency}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

const bd = StyleSheet.create({
  top:        { alignItems: 'center', marginBottom: 16 },
  bigSprite:  { width: 96, height: 96 },
  name:       { fontSize: 22, fontWeight: '900', color: COLORS.text, marginTop: 10, textAlign: 'center' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem:   { width: '47%', backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 12 },
  gridLabel:  { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  gridValue:  { fontSize: 16, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
  flavorRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  flavorName: { width: 52, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  track:      { flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 99 },
  potency:    { width: 24, fontSize: 12, fontWeight: '800', color: COLORS.text, textAlign: 'right' },
});

export default function BerriesScreen({ navigation }) {
  const { items: berries, loading, loadingMore, loadMore } = usePaginatedList(fetchBerries);
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = useLocalSearch(berries, query, ['name']);

  const renderBerry = useCallback(({ item }) => (
    <BerryCard berry={item} onPress={() => setSelected(item)} />
  ), []);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={s.title}>🍒 Berries</Text>
        <Text style={s.subtitle}>Frutas do mundo Pokémon</Text>
        <View style={{ marginTop: 12 }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar berry..." />
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#EC4899" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBerry}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={!query ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon="🍒" text="Nenhuma berry encontrada." />}
        />
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={selected ? `${formatName(selected.name)} Berry` : ''}>
        {selected && <BerryDetail berry={selected} />}
      </BottomSheet>
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
  list:    { padding: 16, paddingBottom: 32 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
});