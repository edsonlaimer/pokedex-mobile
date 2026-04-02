import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPokemonSpecies, fetchEvolutionChain, fetchAbility,
  fetchPokemonLocations, fetchPokemonByName,
} from '../services/pokeapi';

const TYPE_COLORS = {
  fire:'#F97316', water:'#3B82F6', grass:'#22C55E', electric:'#EAB308',
  psychic:'#EC4899', ice:'#06B6D4', dragon:'#8B5CF6', dark:'#374151',
  fairy:'#F472B6', normal:'#9CA3AF', fighting:'#B45309', poison:'#A855F7',
  ground:'#D97706', flying:'#60A5FA', bug:'#65A30D', rock:'#78716C',
  ghost:'#6D28D9', steel:'#64748B',
};

const STAT_LABELS = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  'special-attack': 'SP.ATK', 'special-defense': 'SP.DEF', speed: 'VEL',
};

const STAT_COLORS = {
  hp: '#22C55E', attack: '#F97316', defense: '#3B82F6',
  'special-attack': '#EC4899', 'special-defense': '#8B5CF6', speed: '#EAB308',
};

function StatBar({ stat, value }) {
  const max = 255;
  const pct = Math.min((value / max) * 100, 100);
  const color = STAT_COLORS[stat] || '#9CA3AF';
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{STAT_LABELS[stat] || stat}</Text>
      <Text style={barStyles.value}>{value}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 58, fontSize: 12, fontWeight: '700', color: '#6B7280' },
  value: { width: 32, fontSize: 13, fontWeight: '800', color: '#111827', textAlign: 'right', marginRight: 10 },
  track: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});

function flattenChain(chain, result = []) {
  result.push({ name: chain.species.name, url: chain.species.url });
  chain.evolves_to.forEach((next) => flattenChain(next, result));
  return result;
}

export default function PokemonDetailScreen({ route, navigation }) {
  const { pokemon } = route.params;
  const mainType = pokemon.types[0]?.type.name;
  const color = TYPE_COLORS[mainType] || '#9CA3AF';

  const [species, setSpecies] = useState(null);
  const [evoChain, setEvoChain] = useState([]);
  const [evoDetails, setEvoDetails] = useState([]);
  const [abilities, setAbilities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [spec, locs] = await Promise.all([
        fetchPokemonSpecies(pokemon.id),
        fetchPokemonLocations(pokemon.id),
      ]);
      setSpecies(spec);
      setLocations(locs.slice(0, 5));

      // Evolution chain
      const evoData = await fetchEvolutionChain(spec.evolution_chain.url);
      const chain = flattenChain(evoData.chain);
      setEvoChain(chain);

      // Fetch sprites for each evolution
      const details = await Promise.all(chain.map((e) => fetchPokemonByName(e.name)));
      setEvoDetails(details);

      // Abilities descriptions
      const abilityData = await Promise.all(
        pokemon.abilities.map(({ ability }) => fetchAbility(ability.name))
      );
      setAbilities(abilityData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const flavorText = species?.flavor_text_entries
    ?.find((e) => e.language.name === 'en')?.flavor_text?.replace(/\f/g, ' ') || '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: color }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={color} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: color }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>

          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </Text>
              <Text style={styles.heroNumber}>#{String(pokemon.id).padStart(3, '0')}</Text>
              <View style={styles.typesRow}>
                {pokemon.types.map((t) => (
                  <View key={t.type.name} style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{t.type.name}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Image source={{ uri: pokemon.sprites.front_default }} style={styles.heroImage} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>

          {/* Basic info */}
          <View style={styles.card}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Altura</Text>
                <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} m</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} kg</Text>
              </View>
              {species && (
                <>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Taxa Captura</Text>
                    <Text style={styles.infoValue}>{species.capture_rate}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Felicidade</Text>
                    <Text style={styles.infoValue}>{species.base_happiness}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Habitat</Text>
                    <Text style={styles.infoValue}>{species.habitat?.name ?? '—'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Geração</Text>
                    <Text style={styles.infoValue}>
                      {species.generation?.name?.replace('generation-', '').toUpperCase()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {species?.is_legendary && (
                <View style={[styles.specialBadge, { backgroundColor: '#EAB308' }]}>
                  <Text style={styles.specialBadgeText}>⭐ Lendário</Text>
                </View>
              )}
              {species?.is_mythical && (
                <View style={[styles.specialBadge, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.specialBadgeText}>✨ Mítico</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pokédex description */}
          {flavorText ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pokédex</Text>
              <Text style={styles.description}>{flavorText}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estatísticas</Text>
            {pokemon.stats.map((s) => (
              <StatBar key={s.stat.name} stat={s.stat.name} value={s.base_stat} />
            ))}
          </View>

          {/* Evolution Chain */}
          {evoDetails.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadeia Evolutiva</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.evoRow}>
                  {evoDetails.map((evo, idx) => (
                    <React.Fragment key={evo.id}>
                      <TouchableOpacity
                        style={styles.evoItem}
                        onPress={() => {
                          if (evo.id !== pokemon.id) {
                            navigation.replace('PokemonDetail', { pokemon: evo });
                          }
                        }}
                        activeOpacity={evo.id !== pokemon.id ? 0.7 : 1}
                      >
                        <View style={[
                          styles.evoImageWrapper,
                          evo.id === pokemon.id && { borderWidth: 2, borderColor: color },
                        ]}>
                          <Image
                            source={{ uri: evo.sprites.front_default }}
                            style={styles.evoImage}
                          />
                        </View>
                        <Text style={[
                          styles.evoName,
                          evo.id === pokemon.id && { color, fontWeight: '800' },
                        ]}>
                          {evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}
                        </Text>
                      </TouchableOpacity>
                      {idx < evoDetails.length - 1 && (
                        <Text style={styles.evoArrow}>›</Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Abilities */}
          {abilities.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Habilidades</Text>
              {abilities.map((ab) => {
                const desc = ab.effect_entries?.find((e) => e.language.name === 'en')?.short_effect || '';
                return (
                  <View key={ab.name} style={styles.abilityItem}>
                    <Text style={styles.abilityName}>
                      {ab.name.replace(/-/g, ' ')}
                    </Text>
                    {desc ? <Text style={styles.abilityDesc}>{desc}</Text> : null}
                  </View>
                );
              })}
            </View>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Onde Encontrar</Text>
              {locations.map((loc, idx) => (
                <View key={idx} style={styles.locationItem}>
                  <Text style={styles.locationArea}>
                    {loc.location_area.name.replace(/-/g, ' ')}
                  </Text>
                  <Text style={styles.locationGames}>
                    {loc.version_details.map((v) => v.version.name).join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Moves button */}
          <TouchableOpacity
            style={[styles.movesBtn, { backgroundColor: color }]}
            onPress={() => navigation.navigate('PokemonMoves', { pokemon })}
            activeOpacity={0.85}
          >
            <Text style={styles.movesBtnText}>⚔️  Ver Movimentos</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', textTransform: 'capitalize' },
  heroNumber: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  typesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  typeBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  heroImage: { width: 120, height: 120 },
  content: { padding: 16, backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  infoItem: { width: '28%' },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  specialBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  specialBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 22, color: '#374151' },
  evoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  evoItem: { alignItems: 'center', marginHorizontal: 4 },
  evoImageWrapper: { width: 70, height: 70, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  evoImage: { width: 56, height: 56 },
  evoName: { fontSize: 12, color: '#374151', marginTop: 5, textTransform: 'capitalize' },
  evoArrow: { fontSize: 22, color: '#D1D5DB', marginHorizontal: 4 },
  abilityItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  abilityName: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 4 },
  abilityDesc: { fontSize: 13, lineHeight: 20, color: '#6B7280' },
  locationItem: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  locationArea: { fontSize: 13, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  locationGames: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  movesBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  movesBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
});