import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMoveByName } from '../services/pokeapi';

const TYPE_COLORS = {
  fire: { bg: '#F97316', text: '#FFFFFF' },
  water: { bg: '#3B82F6', text: '#FFFFFF' },
  grass: { bg: '#22C55E', text: '#FFFFFF' },
  electric: { bg: '#EAB308', text: '#FFFFFF' },
  psychic: { bg: '#EC4899', text: '#FFFFFF' },
  ice: { bg: '#06B6D4', text: '#FFFFFF' },
  dragon: { bg: '#8B5CF6', text: '#FFFFFF' },
  dark: { bg: '#374151', text: '#FFFFFF' },
  fairy: { bg: '#F472B6', text: '#FFFFFF' },
  normal: { bg: '#9CA3AF', text: '#FFFFFF' },
  fighting: { bg: '#B45309', text: '#FFFFFF' },
  poison: { bg: '#A855F7', text: '#FFFFFF' },
  ground: { bg: '#D97706', text: '#FFFFFF' },
  flying: { bg: '#60A5FA', text: '#FFFFFF' },
  bug: { bg: '#65A30D', text: '#FFFFFF' },
  rock: { bg: '#78716C', text: '#FFFFFF' },
  ghost: { bg: '#6D28D9', text: '#FFFFFF' },
  steel: { bg: '#64748B', text: '#FFFFFF' },
};

function getTypeColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.normal;
}

function TypeBadge({ type }) {
  const color = getTypeColor(type);

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.badgeText, { color: color.text }]}>{type}</Text>
    </View>
  );
}

export default function PokemonMovesScreen({ route, navigation }) {
  const { pokemon } = route.params;
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoves();
  }, []);

  async function loadMoves() {
    try {
      const selectedMoves = pokemon.moves.slice(0, 10);
      const results = await Promise.all(
        selectedMoves.map(async ({ move }) => fetchMoveByName(move.name))
      );

      setMoves(results.filter((move) => move.power || move.accuracy));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function renderMove({ item }) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.moveCard}
        onPress={() =>
          navigation.navigate('MoveDetail', {
            moveName: item.name,
            pokemon,
          })
        }
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.moveName}>
            {item.name.replace(/-/g, ' ')}
          </Text>

          <View style={styles.moveInfoRow}>
            <TypeBadge type={item.type.name} />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Poder: {item.power ?? '—'}</Text>
            <Text style={styles.metaText}>Precisão: {item.accuracy ?? '—'}</Text>
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

          <View style={styles.pokemonBox}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: pokemon.sprites.front_default }}
                style={styles.image}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </Text>
              <Text style={styles.number}>
                #{String(pokemon.id).padStart(3, '0')}
              </Text>

              <View style={styles.typesRow}>
                {pokemon.types.map((t) => (
                  <TypeBadge key={t.type.name} type={t.type.name} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Movimentos</Text>

        {loading ? (
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
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhum movimento disponível.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
  },
  pokemonBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  image: {
    width: 54,
    height: 54,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  number: {
    marginTop: 3,
    fontSize: 13,
    color: '#9CA3AF',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  moveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  moveName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  moveInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 30,
  },
});