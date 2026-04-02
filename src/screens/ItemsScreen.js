import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchItems } from '../services/pokeapi';

const CATEGORY_COLORS = {
  'standard-balls': '#F97316',
  'special-balls': '#8B5CF6',
  'medicine': '#22C55E',
  'vitamins': '#EAB308',
  'held-items': '#3B82F6',
  'berries': '#EC4899',
  'evolution': '#06B6D4',
  'battle': '#B45309',
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#9CA3AF';
}

const PAGE_SIZE = 20;

export default function ItemsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    try {
      const { items: data, hasMore: more } = await fetchItems(PAGE_SIZE, 0);
      setItems(data);
      setOffset(PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const { items: data, hasMore: more } = await fetchItems(PAGE_SIZE, offset);
      setItems((prev) => [...prev, ...data]);
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }

  function renderItem({ item }) {
    const color = getCategoryColor(item.category?.name);
    const desc = item.effect_entries?.find((e) => e.language.name === 'en')?.short_effect || '';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
        <View style={[styles.iconWrapper, { backgroundColor: color + '22' }]}>
          {item.sprites?.default ? (
            <Image source={{ uri: item.sprites.default }} style={styles.itemImage} />
          ) : (
            <Text style={styles.itemEmoji}>🎒</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name.replace(/-/g, ' ')}</Text>
          {desc ? (
            <Text style={styles.itemDesc} numberOfLines={2}>{desc}</Text>
          ) : null}
          <View style={[styles.catBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.catText, { color }]}>
              {item.category?.name?.replace(/-/g, ' ') || 'item'}
            </Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

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
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando itens...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" /></View> : null}
          />
        )}
      </View>

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <TouchableOpacity onPress={() => setSelected(null)} style={modal.closeBtn}>
              <Text style={modal.closeText}>✕</Text>
            </TouchableOpacity>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={modal.topRow}>
                  {selected.sprites?.default ? (
                    <Image source={{ uri: selected.sprites.default }} style={modal.bigImage} />
                  ) : (
                    <Text style={{ fontSize: 64 }}>🎒</Text>
                  )}
                  <Text style={modal.modalName}>{selected.name.replace(/-/g, ' ')}</Text>
                  <Text style={modal.modalCat}>{selected.category?.name?.replace(/-/g, ' ')}</Text>
                </View>

                {selected.effect_entries?.find((e) => e.language.name === 'en')?.effect && (
                  <View style={modal.section}>
                    <Text style={modal.sectionTitle}>Efeito</Text>
                    <Text style={modal.sectionText}>
                      {selected.effect_entries.find((e) => e.language.name === 'en').effect}
                    </Text>
                  </View>
                )}

                {selected.flavor_text_entries?.find((e) => e.language.name === 'en') && (
                  <View style={modal.section}>
                    <Text style={modal.sectionTitle}>Descrição</Text>
                    <Text style={modal.sectionText}>
                      {selected.flavor_text_entries.find((e) => e.language.name === 'en').text}
                    </Text>
                  </View>
                )}

                <View style={modal.infoRow}>
                  <View style={modal.infoItem}>
                    <Text style={modal.infoLabel}>Custo</Text>
                    <Text style={modal.infoValue}>₽ {selected.cost}</Text>
                  </View>
                  <View style={modal.infoItem}>
                    <Text style={modal.infoLabel}>Fling Power</Text>
                    <Text style={modal.infoValue}>{selected.fling_power ?? '—'}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backText: { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  iconWrapper: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: 40, height: 40 },
  itemEmoji: { fontSize: 28 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 4 },
  itemDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 6 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  catText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  arrow: { fontSize: 22, color: '#D1D5DB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  closeText: { fontSize: 18, color: '#9CA3AF' },
  topRow: { alignItems: 'center', marginBottom: 16 },
  bigImage: { width: 96, height: 96 },
  modalName: { fontSize: 22, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: 8, textAlign: 'center' },
  modalCat: { fontSize: 13, color: '#9CA3AF', textTransform: 'capitalize', marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sectionText: { fontSize: 13, lineHeight: 20, color: '#374151' },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  infoItem: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
});