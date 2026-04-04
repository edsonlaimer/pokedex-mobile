import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchBerries } from '../services/pokeapi';
import { SearchBar, BottomSheet, Card, CardTitle } from '../components/components';
import { FLAVOR_COLORS, formatName } from '../components/constants';
import { usePaginatedList, useLocalSearch } from '../hooks/hooks';

const FIRMNESS_COLORS = {
  'very-soft': '#FCA5A5', soft: '#FDBA74', hard: '#86EFAC',
  'very-hard': '#6EE7B7', 'super-hard': '#5EEAD4',
};

function getTopFlavor(berry) {
  const active = berry.flavors?.filter((f) => f.potency > 0) ?? [];
  return active.reduce((best, f) => (f.potency > (best?.potency ?? -1) ? f : best), null);
}

function BerryCard({ berry, onPress }) {
  const topFlavor    = getTopFlavor(berry);
  const flavorColor  = topFlavor ? (FLAVOR_COLORS[topFlavor.flavor.name] ?? '#9CA3AF') : '#9CA3AF';
  const firmnessColor = FIRMNESS_COLORS[berry.firmness?.name] ?? '#E5E7EB';
  // Sprite comes from the linked item fetched in pokeapi.js
  const spriteUri = berry.itemData?.sprites?.default;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: flavorColor + '22' }]}>
        {spriteUri
          ? <Image source={{ uri: spriteUri }} style={styles.berryImage} />
          : <Text style={styles.berryEmoji}>🍒</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.berryName}>{formatName(berry.name)} Berry</Text>
        <View style={styles.tagsRow}>
          {topFlavor && (
            <View style={[styles.tag, { backgroundColor: flavorColor + '22' }]}>
              <Text style={[styles.tagText, { color: flavorColor }]}>{topFlavor.flavor.name}</Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: firmnessColor + '55' }]}>
            <Text style={[styles.tagText, { color: '#374151' }]}>
              {berry.firmness?.name?.replace(/-/g, ' ')}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>⏱ {berry.growth_time}h</Text>
          <Text style={styles.stat}>🍒 x{berry.max_harvest}</Text>
          <Text style={styles.stat}>⚡ {berry.natural_gift_power}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function BerryDetail({ berry }) {
  const spriteUri = berry.itemData?.sprites?.default;
  const activeFlavors = berry.flavors?.filter((f) => f.potency > 0) ?? [];

  return (
    <>
      <View style={detail.topRow}>
        {spriteUri
          ? <Image source={{ uri: spriteUri }} style={detail.bigImage} />
          : <Text style={{ fontSize: 64 }}>🍒</Text>
        }
        <Text style={detail.name}>{formatName(berry.name)} Berry</Text>
      </View>

      <Card style={{ marginBottom: 12 }}>
        <CardTitle>Informações</CardTitle>
        <View style={detail.grid}>
          {[
            { label: 'Crescimento', value: `${berry.growth_time}h` },
            { label: 'Colheita máx.', value: `x${berry.max_harvest}` },
            { label: 'Natural Gift', value: berry.natural_gift_power },
            { label: 'Tamanho', value: `${berry.size} mm` },
            { label: 'Suavidade', value: berry.smoothness },
            { label: 'Firmeza', value: formatName(berry.firmness?.name ?? '—') },
          ].map(({ label, value }) => (
            <View key={label} style={detail.gridItem}>
              <Text style={detail.gridLabel}>{label}</Text>
              <Text style={detail.gridValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>

      {activeFlavors.length > 0 && (
        <Card>
          <CardTitle>Sabores</CardTitle>
          {activeFlavors.map((f) => {
            const color = FLAVOR_COLORS[f.flavor.name] ?? '#9CA3AF';
            return (
              <View key={f.flavor.name} style={detail.flavorRow}>
                <Text style={[detail.flavorName, { color }]}>{f.flavor.name}</Text>
                <View style={detail.track}>
                  <View style={[detail.fill, { width: `${(f.potency / 40) * 100}%`, backgroundColor: color }]} />
                </View>
                <Text style={detail.potency}>{f.potency}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

export default function BerriesScreen({ navigation }) {
  const { items: berries, loading, loadingMore, loadMore } = usePaginatedList(fetchBerries);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useLocalSearch(berries, query, ['name']);

  const renderBerry = useCallback(({ item }) => (
    <BerryCard berry={item} onPress={() => setSelected(item)} />
  ), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🍒 Berries</Text>
          <Text style={styles.subtitle}>Frutas do mundo Pokémon</Text>
          <View style={{ marginTop: 12 }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar berry..." />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando berries...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBerry}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={!query ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nenhuma berry encontrada.</Text>
              </View>
            }
          />
        )}
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && <BerryDetail berry={selected} />}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#F8FAFC' },
  container:   { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backText:    { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title:       { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle:    { fontSize: 13, color: '#6B7280', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  iconWrapper: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  berryImage:  { width: 40, height: 40 },
  berryEmoji:  { fontSize: 28 },
  berryName:   { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 6 },
  tagsRow:     { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText:     { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statsRow:    { flexDirection: 'row', gap: 10 },
  stat:        { fontSize: 11, color: '#9CA3AF' },
  arrow:       { fontSize: 22, color: '#D1D5DB' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  emptyText:   { color: '#6B7280', fontSize: 15 },
});

const detail = StyleSheet.create({
  topRow:     { alignItems: 'center', marginBottom: 16 },
  bigImage:   { width: 96, height: 96 },
  name:       { fontSize: 22, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: 8, textAlign: 'center' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem:   { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12 },
  gridLabel:  { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  gridValue:  { fontSize: 16, fontWeight: '800', color: '#111827', textTransform: 'capitalize' },
  flavorRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  flavorName: { width: 50, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  track:      { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 999 },
  potency:    { width: 24, fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'right' },
});