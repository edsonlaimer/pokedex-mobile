import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchItems } from '../services/pokeapi';
import { SearchBar, BottomSheet, Card, CardTitle, InfoGrid, EmptyState } from '../components/components';
import { formatName } from '../components/constants';
import { usePaginatedList, useLocalSearch } from '../hooks/hooks';

const CATEGORY_COLORS = {
  'standard-balls': '#F97316', 'special-balls': '#8B5CF6',
  medicine: '#22C55E', vitamins: '#EAB308', 'held-items': '#3B82F6',
  berries: '#EC4899', evolution: '#06B6D4', battle: '#B45309',
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat] ?? '#9CA3AF';

function ItemCard({ item, onPress }) {
  const color = getCategoryColor(item.category?.name);
  const desc  = item.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ?? '';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '22' }]}>
        {item.sprites?.default
          ? <Image source={{ uri: item.sprites.default }} style={styles.itemImage} />
          : <Text style={styles.itemEmoji}>📦</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{formatName(item.name)}</Text>
        {!!desc && <Text style={styles.itemDesc} numberOfLines={2}>{desc}</Text>}
        <View style={[styles.catBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.catText, { color }]}>{formatName(item.category?.name ?? 'item')}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function ItemDetail({ item }) {
  const effect = item.effect_entries?.find((e) => e.language.name === 'en')?.effect ?? '';
  const flavor = item.flavor_text_entries?.find((e) => e.language.name === 'en')?.text ?? '';

  return (
    <>
      <View style={detail.topRow}>
        {item.sprites?.default
          ? <Image source={{ uri: item.sprites.default }} style={detail.bigImage} />
          : <Text style={{ fontSize: 64 }}>📦</Text>
        }
        <Text style={detail.name}>{formatName(item.name)}</Text>
        <Text style={detail.cat}>{formatName(item.category?.name ?? '')}</Text>
      </View>

      {!!effect && (
        <Card style={{ marginBottom: 12 }}>
          <CardTitle>Efeito</CardTitle>
          <Text style={detail.text}>{effect}</Text>
        </Card>
      )}

      {!!flavor && (
        <Card style={{ marginBottom: 12 }}>
          <CardTitle>Descrição</CardTitle>
          <Text style={detail.text}>{flavor}</Text>
        </Card>
      )}

      <Card>
        <InfoGrid items={[
          { label: 'Custo',       value: `₽ ${item.cost}` },
          { label: 'Fling Power', value: item.fling_power ?? '—' },
          { label: 'Categoria',   value: formatName(item.category?.name ?? '—') },
        ]} />
      </Card>
    </>
  );
}

export default function ItemsScreen({ navigation }) {
  const { items, loading, loadingMore, loadMore } = usePaginatedList(fetchItems);
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useLocalSearch(items, query, ['name']);

  const renderItem = useCallback(({ item }) => (
    <ItemCard item={item} onPress={() => setSelected(item)} />
  ), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎒 Itens</Text>
          <Text style={styles.subtitle}>Todos os itens do mundo Pokémon</Text>
          <View style={{ marginTop: 12 }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar item..." />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando itens...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={!query ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
            ListEmptyComponent={<EmptyState icon="🎒" text="Nenhum item encontrado." />}
          />
        )}
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && <ItemDetail item={selected} />}
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
  itemImage:   { width: 40, height: 40 },
  itemEmoji:   { fontSize: 28 },
  itemName:    { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 4 },
  itemDesc:    { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 6 },
  catBadge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  catText:     { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  arrow:       { fontSize: 22, color: '#D1D5DB' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
});

const detail = StyleSheet.create({
  topRow:   { alignItems: 'center', marginBottom: 16 },
  bigImage: { width: 96, height: 96 },
  name:     { fontSize: 22, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: 8, textAlign: 'center' },
  cat:      { fontSize: 13, color: '#9CA3AF', textTransform: 'capitalize', marginTop: 4 },
  text:     { fontSize: 13, lineHeight: 20, color: '#374151' },
});