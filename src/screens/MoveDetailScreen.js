import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';
import { TypeBadge, Card, CardTitle, InfoGrid } from '../components/components';
import { getTypeColor, formatName, padId } from '../components/constants';

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

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: bgColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{formatName(move.name)}</Text>
          <TypeBadge type={move.type.name} light />
        </View>

        <View style={styles.content}>
          {/* Power / Accuracy float cards */}
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

          <Card>
            <CardTitle>Descrição</CardTitle>
            <Text style={styles.description}>{description.replace(/\f/g, ' ')}</Text>
          </Card>

          <Card>
            <CardTitle>Pokémon</CardTitle>
            <View style={styles.pokemonRow}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: pokemon.sprites.front_default }} style={styles.pokemonImage} />
              </View>
              <View>
                <Text style={styles.pokemonName}>{formatName(pokemon.name)}</Text>
                <Text style={styles.pokemonNumber}>#{padId(pokemon.id)}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <CardTitle>Informações extras</CardTitle>
            <InfoGrid items={[
              { label: 'PP',      value: move.pp ?? '—' },
              { label: 'Classe',  value: move.damage_class?.name },
              { label: 'Geração', value: move.generation?.name?.replace('generation-', 'Gen ').toUpperCase() },
              { label: 'Alvo',    value: move.target?.name?.replace(/-/g, ' ') },
            ]} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#F8FAFC' },
  loadingSafe:   { flex: 1, backgroundColor: '#FFFFFF' },
  hero:          { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backText:      { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 18 },
  heroTitle:     { fontSize: 28, fontWeight: '800', color: '#FFF', textTransform: 'capitalize', marginBottom: 10 },
  content:       { padding: 16 },
  statsRow:      { flexDirection: 'row', marginTop: -18, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  statLabel:     { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  statValue:     { fontSize: 28, fontWeight: '800', color: '#111827' },
  description:   { fontSize: 14, lineHeight: 22, color: '#374151' },
  pokemonRow:    { flexDirection: 'row', alignItems: 'center' },
  imageWrapper:  { width: 58, height: 58, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  pokemonImage:  { width: 44, height: 44 },
  pokemonName:   { fontSize: 16, fontWeight: '700', color: '#111827' },
  pokemonNumber: { marginTop: 4, fontSize: 13, color: '#9CA3AF' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:   { marginTop: 10, color: '#6B7280' },
});