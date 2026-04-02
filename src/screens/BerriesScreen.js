import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchBerries } from '../services/pokeapi';

const FLAVOR_COLORS = {
  spicy: '#F97316', dry: '#EAB308', sweet: '#EC4899',
  bitter: '#22C55E', sour: '#3B82F6',
};

const FIRMNESS_COLORS = {
  'very-soft': '#FCA5A5', soft: '#FDBA74', hard: '#86EFAC',
  'very-hard': '#6EE7B7', 'super-hard': '#5EEAD4',
};

const PAGE_SIZE = 20;

export default function BerriesScreen({ navigation }) {
  const [berries, setBerries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    try {
      const { berries: data, hasMore: more } = await fetchBerries(PAGE_SIZE, 0);
      setBerries(data);
      setOffset(PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const { berries: data, hasMore: more } = await fetchBerries(PAGE_SIZE, offset);
      setBerries((prev) => [...prev, ...data]);
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }

  function getTopFlavor(berry) {
    if (!berry.flavors?.length) return null;
    return berry.flavors.reduce((a, b) => (a.potency > b.potency ? a : b), berry.flavors[0]);
  }

  function renderBerry({ item }) {
    const topFlavor = getTopFlavor(item);
    const flavorColor = topFlavor ? (FLAVOR_COLORS[topFlavor.flavor.name] || '#9CA3AF') : '#9CA3AF';
    const firmnessColor = FIRMNESS_COLORS[item.firmness?.name] || '#E5E7EB';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
        <View style={[styles.berryIcon, { backgroundColor: flavorColor + '22' }]}>
          <Text style={styles.berryEmoji}>🍇</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.berryName}>{item.name.replace(/-/g, ' ')} Berry</Text>
          <View style={styles.tagsRow}>
            {topFlavor && (
              <View style={[styles.tag, { backgroundColor: flavorColor + '22' }]}>
                <Text style={[styles.tagText, { color: flavorColor }]}>
                  {topFlavor.flavor.name}
                </Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: firmnessColor + '44' }]}>
              <Text style={[styles.tagText, { color: '#374151' }]}>
                {item.firmness?.name?.replace(/-/g, ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.statsSmall}>
            <Text style={styles.statSmall}>⏱ {item.growth_time}h</Text>
            <Text style={styles.statSmall}>🍓 x{item.max_harvest}</Text>
            <Text style={styles.statSmall}>⚡ {item.natural_gift_power}</Text>
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
          <Text style={styles.title}>🍓 Berries</Text>
          <Text style={styles.subtitle}>Frutas do mundo Pokémon</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando berries...</Text>
          </View>
        ) : (
          <FlatList
            data={berries}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBerry}
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
                  <Text style={modal.bigEmoji}>🍇</Text>
                  <Text style={modal.modalName}>{selected.name.replace(/-/g, ' ')} Berry</Text>
                </View>

                <View style={modal.grid}>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Tempo de crescimento</Text>
                    <Text style={modal.gridValue}>{selected.growth_time}h</Text>
                  </View>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Colheita máxima</Text>
                    <Text style={modal.gridValue}>x{selected.max_harvest}</Text>
                  </View>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Poder Natural Gift</Text>
                    <Text style={modal.gridValue}>{selected.natural_gift_power}</Text>
                  </View>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Tamanho</Text>
                    <Text style={modal.gridValue}>{selected.size} mm</Text>
                  </View>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Suavidade</Text>
                    <Text style={modal.gridValue}>{selected.smoothness}</Text>
                  </View>
                  <View style={modal.gridItem}>
                    <Text style={modal.gridLabel}>Firmeza</Text>
                    <Text style={modal.gridValue}>{selected.firmness?.name?.replace(/-/g, ' ')}</Text>
                  </View>
                </View>

                {selected.flavors?.length > 0 && (
                  <View style={modal.section}>
                    <Text style={modal.sectionTitle}>Sabores</Text>
                    {selected.flavors.filter((f) => f.potency > 0).map((f) => {
                      const color = FLAVOR_COLORS[f.flavor.name] || '#9CA3AF';
                      return (
                        <View key={f.flavor.name} style={modal.flavorRow}>
                          <Text style={[modal.flavorName, { color }]}>
                            {f.flavor.name}
                          </Text>
                          <View style={modal.flavorTrack}>
                            <View style={[modal.flavorFill, { width: `${(f.potency / 40) * 100}%`, backgroundColor: color }]} />
                          </View>
                          <Text style={modal.flavorPotency}>{f.potency}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
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
  container: { flex: 1 },
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
  berryIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  berryEmoji: { fontSize: 28 },
  berryName: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statsSmall: { flexDirection: 'row', gap: 10 },
  statSmall: { fontSize: 11, color: '#9CA3AF' },
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
  topRow: { alignItems: 'center', marginBottom: 20 },
  bigEmoji: { fontSize: 72 },
  modalName: { fontSize: 22, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: 8, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12 },
  gridLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: '800', color: '#111827', textTransform: 'capitalize' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  flavorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  flavorName: { width: 50, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  flavorTrack: { flex: 1, height: 7, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  flavorFill: { height: '100%', borderRadius: 999 },
  flavorPotency: { width: 24, fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'right' },
});