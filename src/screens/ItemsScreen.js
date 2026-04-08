import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchItems } from '../services/pokeapi';
import { SearchBar, BottomSheet, Card, CardTitle, InfoGrid, EmptyState, BackButton, SectionDivider } from '../components/components';
import { COLORS, RADIUS, SHADOW, formatName } from '../components/constants';
import { usePaginatedList, useLocalSearch } from '../hooks/hooks';

const CATEGORY_COLORS = {
  'standard-balls': '#F97316', 'special-balls': '#8B5CF6',
  medicine: '#22C55E', vitamins: '#EAB308', 'held-items': '#3B82F6',
  berries: '#EC4899', evolution: '#06B6D4', battle: '#B45309',
};

const getCatColor  = (cat) => CATEGORY_COLORS[cat] ?? '#9CA3AF';
const getCatEmoji  = (cat = '') => {
  const map = {
    'standard-balls':'⚪', 'special-balls':'🟣', medicine:'💊', vitamins:'💉',
    'held-items':'💎', berries:'🍒', evolution:'🌟', battle:'⚔️',
  };
  return map[cat] ?? '📦';
};

function ItemCard({ item, onPress }) {
  const color = getCatColor(item.category?.name);
  const emoji = getCatEmoji(item.category?.name);
  const desc  = item.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ?? '';
  return (
    <TouchableOpacity style={ic.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[ic.iconBox, { backgroundColor: color + '18' }]}>
        {item.sprites?.default
          ? <Image source={{ uri: item.sprites.default }} style={ic.sprite} resizeMode="contain" />
          : <Text style={ic.emoji}>{emoji}</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ic.name}>{formatName(item.name)}</Text>
        {!!desc && <Text style={ic.desc} numberOfLines={2}>{desc}</Text>}
        <View style={[ic.catBadge, { backgroundColor: color + '18' }]}>
          <Text style={[ic.catText, { color }]}>{formatName(item.category?.name ?? 'item')}</Text>
        </View>
      </View>
      <Text style={ic.cost}>{item.cost > 0 ? `₽${item.cost}` : 'Free'}</Text>
    </TouchableOpacity>
  );
}

const ic = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.card,
  },
  iconBox:  { width: 54, height: 54, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  sprite:   { width: 42, height: 42 },
  emoji:    { fontSize: 26 },
  name:     { fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize', marginBottom: 4 },
  desc:     { fontSize: 12, color: COLORS.textSub, lineHeight: 17, marginBottom: 6 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  catText:  { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cost:     { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
});

function ItemDetail({ item }) {
  const color   = getCatColor(item.category?.name);
  const effect  = item.effect_entries?.find((e) => e.language.name === 'en')?.effect ?? '';
  const flavor  = item.flavor_text_entries?.find((e) => e.language.name === 'en')?.text ?? '';
  return (
    <>
      <View style={id.top}>
        {item.sprites?.default
          ? <Image source={{ uri: item.sprites.default }} style={id.bigSprite} resizeMode="contain" />
          : <Text style={{ fontSize: 64 }}>{getCatEmoji(item.category?.name)}</Text>
        }
        <Text style={id.name}>{formatName(item.name)}</Text>
        <View style={[id.catBadge, { backgroundColor: color + '18' }]}>
          <Text style={[id.catText, { color }]}>{formatName(item.category?.name ?? 'item')}</Text>
        </View>
      </View>

      {!!effect && (
        <Card style={{ marginBottom: 10 }}>
          <CardTitle>Efeito</CardTitle>
          <Text style={id.text}>{effect}</Text>
        </Card>
      )}
      {!!flavor && (
        <Card style={{ marginBottom: 10 }}>
          <CardTitle>Descrição</CardTitle>
          <Text style={id.text}>{flavor}</Text>
        </Card>
      )}
      <Card>
        <InfoGrid items={[
          { label: 'Custo',    value: item.cost > 0 ? `₽ ${item.cost}` : 'Não vendável' },
          { label: 'Fling',    value: item.fling_power ?? '—' },
          { label: 'Categoria',value: formatName(item.category?.name ?? '—') },
        ]} />
      </Card>
    </>
  );
}

const id = StyleSheet.create({
  top:       { alignItems: 'center', marginBottom: 16 },
  bigSprite: { width: 96, height: 96 },
  name:      { fontSize: 22, fontWeight: '900', color: COLORS.text, textTransform: 'capitalize', marginTop: 10, textAlign: 'center' },
  catBadge:  { marginTop: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.sm },
  catText:   { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  text:      { fontSize: 13, lineHeight: 20, color: COLORS.textSub },
});

export default function ItemsScreen({ navigation }) {
  const { items, loading, loadingMore, loadMore } = usePaginatedList(fetchItems);
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = useLocalSearch(items, query, ['name']);

  const renderItem = useCallback(({ item }) => (
    <ItemCard item={item} onPress={() => setSelected(item)} />
  ), []);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={s.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={s.title}>🎒 Itens</Text>
        <Text style={s.subtitle}>Enciclopédia de itens</Text>
        <View style={{ marginTop: 12 }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar item..." />
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={!query ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon="🎒" text="Nenhum item encontrado." />}
        />
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={selected ? formatName(selected.name) : ''}>
        {selected && <ItemDetail item={selected} />}
      </BottomSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:  { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  subtitle:{ fontSize: 13, color: COLORS.textSub, marginTop: 2, fontWeight: '500' },
  list:   { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});