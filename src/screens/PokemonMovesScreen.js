import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';
import { TypeBadge } from '../components/components';
import { formatName, padId } from '../components/constants';

const BATCH_SIZE = 5;
const MAX_MOVES  = 20;

export default function PokemonMovesScreen({ route, navigation }) {
  const { pokemon }  = route.params;
  const [moves, setMoves]     = useState([]);
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

  const renderMove = useCallback(({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.moveCard}
      onPress={() => navigation.navigate('MoveDetail', { moveName: item.name, pokemon })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.moveName}>{formatName(item.name)}</Text>
        <View style={styles.badgeRow}><TypeBadge type={item.type.name} /></View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Poder: {item.power ?? '—'}</Text>
          <Text style={styles.meta}>Precisão: {item.accuracy ?? '—'}</Text>
          <Text style={styles.meta}>PP: {item.pp ?? '—'}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  ), [navigation, pokemon]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <View style={styles.pokemonBox}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: pokemon.sprites.front_default }} style={styles.image} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{formatName(pokemon.name)}</Text>
              <Text style={styles.number}>#{padId(pokemon.id)}</Text>
              <View style={styles.typesRow}>
                {pokemon.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Movimentos</Text>

        {loading && moves.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando movimentos...</Text>
          </View>
        ) : (
          <FlatList
            data={moves}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMove}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} color="#9CA3AF" /> : null}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Nenhum movimento disponível.</Text> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: '#FFFFFF' },
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backText:     { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginBottom: 14 },
  pokemonBox:   { flexDirection: 'row', alignItems: 'center' },
  imageWrapper: { width: 68, height: 68, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  image:        { width: 54, height: 54 },
  title:        { fontSize: 24, fontWeight: '800', color: '#111827' },
  number:       { marginTop: 3, fontSize: 13, color: '#9CA3AF' },
  typesRow:     { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  listContent:  { paddingHorizontal: 16, paddingBottom: 28 },
  moveCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginTop: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  moveName:     { fontSize: 15, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 8 },
  badgeRow:     { flexDirection: 'row', marginBottom: 8 },
  metaRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  meta:         { fontSize: 12, color: '#6B7280' },
  arrow:        { fontSize: 24, color: '#D1D5DB', marginLeft: 10 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { marginTop: 10, color: '#6B7280' },
  emptyText:    { textAlign: 'center', color: '#6B7280', marginTop: 30 },
});