import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPokemonSpecies, fetchEvolutionChain,
  fetchAbility, fetchPokemonLocations, fetchPokemonByName,
} from '../services/pokeapi';
import { TypeBadge, Card, CardTitle, InfoGrid } from '../components/components';
import { getTypeColor, STAT_LABELS, STAT_COLORS, formatName, padId } from '../components/constants';

// ─── StatBar ─────────────────────────────────────────────────────────────────
function StatBar({ statName, value }) {
  const color = STAT_COLORS[statName] ?? '#9CA3AF';
  return (
    <View style={stat.row}>
      <Text style={stat.label}>{STAT_LABELS[statName] ?? statName}</Text>
      <Text style={stat.value}>{value}</Text>
      <View style={stat.track}>
        <View style={[stat.fill, { width: `${Math.min((value / 255) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const stat = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 58, fontSize: 12, fontWeight: '700', color: '#6B7280' },
  value: { width: 32, fontSize: 13, fontWeight: '800', color: '#111827', textAlign: 'right', marginRight: 10 },
  track: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 999 },
});

// ─── Flatten evolution chain ──────────────────────────────────────────────────
function flattenChain(chain, result = []) {
  result.push(chain.species.name);
  chain.evolves_to.forEach((next) => flattenChain(next, result));
  return result;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PokemonDetailScreen({ route, navigation }) {
  const { pokemon }  = route.params;
  const mainType     = pokemon.types[0]?.type.name;
  const accentColor  = getTypeColor(mainType);

  const [species,    setSpecies]    = useState(null);
  const [evoDetails, setEvoDetails] = useState([]);
  const [abilities,  setAbilities]  = useState([]);
  const [locations,  setLocations]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [spec, locs] = await Promise.all([
        fetchPokemonSpecies(pokemon.id),
        fetchPokemonLocations(pokemon.id),
      ]);
      setSpecies(spec);
      setLocations(locs.slice(0, 5));

      const [evoData, abilityData] = await Promise.all([
        fetchEvolutionChain(spec.evolution_chain.url),
        Promise.all(pokemon.abilities.map(({ ability }) => fetchAbility(ability.name))),
      ]);

      setAbilities(abilityData);
      const names   = flattenChain(evoData.chain);
      const details = await Promise.all(names.map(fetchPokemonByName));
      setEvoDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const flavorText = species?.flavor_text_entries
    ?.find((e) => e.language.name === 'en')?.flavor_text?.replace(/\f/g, ' ') ?? '';

  const infoItems = [
    { label: 'Altura',        value: `${(pokemon.height / 10).toFixed(1)} m` },
    { label: 'Peso',          value: `${(pokemon.weight / 10).toFixed(1)} kg` },
    { label: 'Captura',       value: species?.capture_rate },
    { label: 'Felicidade',    value: species?.base_happiness },
    { label: 'Habitat',       value: species?.habitat?.name },
    { label: 'Geração',       value: species?.generation?.name?.replace('generation-', '').toUpperCase() },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: accentColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={accentColor} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: accentColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{formatName(pokemon.name)}</Text>
              <Text style={styles.heroNumber}>#{padId(pokemon.id)}</Text>
              <View style={styles.typesRow}>
                {pokemon.types.map((t) => (
                  <TypeBadge key={t.type.name} type={t.type.name} light />
                ))}
              </View>
            </View>
            <Image source={{ uri: pokemon.sprites.front_default }} style={styles.heroImage} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Basic info */}
          <Card>
            <InfoGrid items={infoItems} />
            <View style={styles.badgesRow}>
              {species?.is_legendary && <SpecialBadge color="#EAB308" label="⭐ Lendário" />}
              {species?.is_mythical  && <SpecialBadge color="#8B5CF6" label="✨ Mítico" />}
            </View>
          </Card>

          {/* Pokédex text */}
          {!!flavorText && (
            <Card>
              <CardTitle>Pokédex</CardTitle>
              <Text style={styles.description}>{flavorText}</Text>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardTitle>Estatísticas</CardTitle>
            {pokemon.stats.map((s) => (
              <StatBar key={s.stat.name} statName={s.stat.name} value={s.base_stat} />
            ))}
          </Card>

          {/* Evolution Chain */}
          {evoDetails.length > 0 && (
            <Card>
              <CardTitle>Cadeia Evolutiva</CardTitle>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.evoRow}>
                  {evoDetails.map((evo, idx) => (
                    <React.Fragment key={evo.id}>
                      <TouchableOpacity
                        style={styles.evoItem}
                        activeOpacity={evo.id !== pokemon.id ? 0.7 : 1}
                        onPress={() => evo.id !== pokemon.id && navigation.replace('PokemonDetail', { pokemon: evo })}
                      >
                        <View style={[styles.evoImageWrapper, evo.id === pokemon.id && { borderWidth: 2, borderColor: accentColor }]}>
                          <Image source={{ uri: evo.sprites.front_default }} style={styles.evoImage} />
                        </View>
                        <Text style={[styles.evoName, evo.id === pokemon.id && { color: accentColor, fontWeight: '800' }]}>
                          {formatName(evo.name)}
                        </Text>
                      </TouchableOpacity>
                      {idx < evoDetails.length - 1 && <Text style={styles.evoArrow}>›</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </ScrollView>
            </Card>
          )}

          {/* Abilities */}
          {abilities.length > 0 && (
            <Card>
              <CardTitle>Habilidades</CardTitle>
              {abilities.map((ab) => {
                const desc = ab.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ?? '';
                return (
                  <View key={ab.name} style={styles.abilityItem}>
                    <Text style={styles.abilityName}>{formatName(ab.name)}</Text>
                    {!!desc && <Text style={styles.abilityDesc}>{desc}</Text>}
                  </View>
                );
              })}
            </Card>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <Card>
              <CardTitle>Onde Encontrar</CardTitle>
              {locations.map((loc, idx) => (
                <View key={idx} style={styles.locationItem}>
                  <Text style={styles.locationArea}>{formatName(loc.location_area.name)}</Text>
                  <Text style={styles.locationGames}>
                    {loc.version_details.map((v) => v.version.name).join(', ')}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Moves button */}
          <TouchableOpacity
            style={[styles.movesBtn, { backgroundColor: accentColor }]}
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

function SpecialBadge({ color, label }) {
  return (
    <View style={[special.badge, { backgroundColor: color }]}>
      <Text style={special.text}>{label}</Text>
    </View>
  );
}

const special = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginRight: 8 },
  text:  { color: '#FFF', fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safeArea:       { flex: 1 },
  hero:           { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  backText:       { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  heroRow:        { flexDirection: 'row', alignItems: 'center' },
  heroName:       { fontSize: 28, fontWeight: '800', color: '#FFF', textTransform: 'capitalize' },
  heroNumber:     { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  typesRow:       { flexDirection: 'row', gap: 8, marginTop: 10 },
  heroImage:      { width: 120, height: 120 },
  content:        { padding: 16, backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16 },
  badgesRow:      { flexDirection: 'row', marginTop: 12 },
  description:    { fontSize: 14, lineHeight: 22, color: '#374151' },
  evoRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  evoItem:        { alignItems: 'center', marginHorizontal: 4 },
  evoImageWrapper:{ width: 70, height: 70, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  evoImage:       { width: 56, height: 56 },
  evoName:        { fontSize: 12, color: '#374151', marginTop: 5, textTransform: 'capitalize' },
  evoArrow:       { fontSize: 22, color: '#D1D5DB', marginHorizontal: 4 },
  abilityItem:    { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  abilityName:    { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', marginBottom: 4 },
  abilityDesc:    { fontSize: 13, lineHeight: 20, color: '#6B7280' },
  locationItem:   { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  locationArea:   { fontSize: 13, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  locationGames:  { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  movesBtn:       { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  movesBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '800' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
});