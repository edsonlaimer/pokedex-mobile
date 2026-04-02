import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';

const TYPE_COLORS = {
  fire:'#F97316', water:'#3B82F6', grass:'#22C55E', electric:'#EAB308',
  psychic:'#EC4899', ice:'#06B6D4', dragon:'#8B5CF6', dark:'#374151',
  fairy:'#F472B6', normal:'#9CA3AF', fighting:'#B45309', poison:'#A855F7',
  ground:'#D97706', flying:'#60A5FA', bug:'#65A30D', rock:'#78716C',
  ghost:'#6D28D9', steel:'#64748B',
};

const getTypeColor = (type) => TYPE_COLORS[type] || '#9CA3AF';

const TypeBadge = React.memo(({ type }) => (
  <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
    <Text style={[styles.badgeText, { color: '#FFF' }]}>{type}</Text>
  </View>
));

export default function MoveDetailScreen({ route, navigation }) {
  const { moveName, pokemon } = route.params;
  const [move, setMove] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoveByName(moveName)
      .then(setMove)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moveName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingSafe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Carregando movimento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!move) {
    return (
      <SafeAreaView style={styles.loadingSafe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Não foi possível carregar o movimento.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bgColor = getTypeColor(move.type.name);
  const description =
    move.flavor_text_entries?.find((e) => e.language.name === 'en')?.flavor_text ||
    move.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ||
    'No description available.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={[styles.hero, { backgroundColor: bgColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{move.name.replace(/-/g, ' ')}</Text>
          <TypeBadge type={move.type.name} />
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { marginRight: 10 }]}>
              <Text style={styles.statLabel}>Poder</Text>
              <Text style={styles.statValue}>{move.power ?? '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Precisão</Text>
              <Text style={styles.statValue}>{move.accuracy ? `${move.accuracy}%` : '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descrição</Text>
            <Text style={styles.description}>{description.replace(/\f/g, ' ')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pokémon</Text>
            <View style={styles.pokemonRow}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: pokemon.sprites.front_default }} style={styles.pokemonImage} />
              </View>
              <View>
                <Text style={styles.pokemonName}>
                  {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                </Text>
                <Text style={styles.pokemonNumber}>#{String(pokemon.id).padStart(3, '0')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informações extras</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>PP</Text>
                <Text style={styles.infoValue}>{move.pp ?? '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Classe</Text>
                <Text style={styles.infoValue}>{move.damage_class?.name ?? '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Geração</Text>
                <Text style={styles.infoValue}>
                  {move.generation?.name?.replace('generation-', 'Gen ').toUpperCase() ?? '—'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Alvo</Text>
                <Text style={styles.infoValue}>{move.target?.name?.replace(/-/g, ' ') ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 18 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', textTransform: 'capitalize', marginBottom: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', marginTop: -18, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, color: '#374151' },
  pokemonRow: { flexDirection: 'row', alignItems: 'center' },
  imageWrapper: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  pokemonImage: { width: 44, height: 44 },
  pokemonName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  pokemonNumber: { marginTop: 4, fontSize: 13, color: '#9CA3AF' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  infoItem: { width: '40%' },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 5 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
});