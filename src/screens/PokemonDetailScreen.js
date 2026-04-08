import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchPokemonSpecies, fetchEvolutionChain,
  fetchAbility, fetchPokemonLocations, fetchPokemonByName,
} from '../services/pokeapi';
import { TypeBadge, Card, CardTitle, InfoGrid, BackButton, StatBar, SectionDivider, PillButton } from '../components/components';
import { COLORS, RADIUS, SHADOW, STAT_LABELS, STAT_COLORS, STAT_ORDER, getTypeColor, formatName, padId, hex2rgba } from '../components/constants';

const { width: SCREEN_W } = Dimensions.get('window');

function flattenChain(chain, result = []) {
  result.push(chain.species.name);
  chain.evolves_to.forEach((next) => flattenChain(next, result));
  return result;
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
const TABS = ['Info', 'Stats', 'Evolução', 'Moves'];

function TabBar({ active, onSelect, accentColor }) {
  return (
    <View style={tb.wrap}>
      {TABS.map((t) => {
        const isActive = active === t;
        return (
          <TouchableOpacity key={t} onPress={() => onSelect(t)} activeOpacity={0.7} style={tb.btn}>
            <Text style={[tb.label, { color: isActive ? accentColor : COLORS.textMuted }]}>{t}</Text>
            {isActive && <View style={[tb.indicator, { backgroundColor: accentColor }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  wrap:      { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  btn:       { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  label:     { fontSize: 13, fontWeight: '700' },
  indicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, borderRadius: 2 },
});

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
  const [tab,        setTab]        = useState('Info');
  const [shiny,      setShiny]      = useState(false);

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const spriteUri = shiny
    ? pokemon.sprites.front_shiny ?? pokemon.sprites.front_default
    : pokemon.sprites.front_default;

  const flavorText = species?.flavor_text_entries
    ?.find((e) => e.language.name === 'en')?.flavor_text?.replace(/\f/g, ' ') ?? '';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accentColor }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={accentColor} />

      {/* ── Hero ── */}
      <View style={[s.hero, { backgroundColor: accentColor }]}>
        <BackButton onPress={() => navigation.goBack()} light />

        <View style={s.heroContent}>
          {/* Left: name, id, types */}
          <View style={s.heroLeft}>
            <Text style={s.heroNum}>{padId(pokemon.id)}</Text>
            <Text style={s.heroName}>{formatName(pokemon.name)}</Text>
            <View style={s.heroTypes}>
              {pokemon.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} light />)}
            </View>
            {(species?.is_legendary || species?.is_mythical) && (
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>{species.is_legendary ? '⭐ Lendário' : '✨ Mítico'}</Text>
              </View>
            )}
          </View>

          {/* Right: sprite + shiny toggle */}
          <View style={s.heroRight}>
            <Image source={{ uri: spriteUri }} style={s.heroSprite} resizeMode="contain" />
            <TouchableOpacity
              style={[s.shinyBtn, shiny && s.shinyBtnActive]}
              onPress={() => setShiny((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={s.shinyBtnText}>{shiny ? '✨ Shiny' : '⬜ Normal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={s.body}>
        <TabBar active={tab} onSelect={setTab} accentColor={accentColor} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ── INFO TAB ── */}
          {tab === 'Info' && (
            <>
              {!!flavorText && (
                <Card>
                  <Text style={s.flavorText}>"{flavorText}"</Text>
                </Card>
              )}

              <Card>
                <CardTitle>Detalhes</CardTitle>
                <InfoGrid items={[
                  { label: 'Altura',     value: `${(pokemon.height / 10).toFixed(1)} m` },
                  { label: 'Peso',       value: `${(pokemon.weight / 10).toFixed(1)} kg` },
                  { label: 'Captura',    value: species?.capture_rate },
                  { label: 'Felicidade', value: species?.base_happiness },
                  { label: 'Habitat',    value: species?.habitat?.name },
                  { label: 'Geração',    value: species?.generation?.name?.replace('generation-', '').toUpperCase() },
                ]} />
              </Card>

              {abilities.length > 0 && (
                <Card>
                  <CardTitle>Habilidades</CardTitle>
                  {abilities.map((ab, idx) => {
                    const desc = ab.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ?? '';
                    const isHidden = pokemon.abilities[idx]?.is_hidden;
                    return (
                      <View key={ab.name}>
                        {idx > 0 && <SectionDivider />}
                        <View style={s.abilityHeader}>
                          <Text style={s.abilityName}>{formatName(ab.name)}</Text>
                          {isHidden && <View style={s.hiddenBadge}><Text style={s.hiddenText}>Oculta</Text></View>}
                        </View>
                        {!!desc && <Text style={s.abilityDesc}>{desc}</Text>}
                      </View>
                    );
                  })}
                </Card>
              )}

              {locations.length > 0 && (
                <Card>
                  <CardTitle>Onde Encontrar</CardTitle>
                  {locations.map((loc, idx) => (
                    <View key={idx}>
                      {idx > 0 && <SectionDivider />}
                      <Text style={s.locArea}>{formatName(loc.location_area.name)}</Text>
                      <Text style={s.locGames}>{loc.version_details.map((v) => v.version.name).join(' · ')}</Text>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* ── STATS TAB ── */}
          {tab === 'Stats' && (
            <Card>
              <CardTitle>Base Stats</CardTitle>
              {pokemon.stats.map((s) => (
                <StatBar
                  key={s.stat.name}
                  statName={s.stat.name}
                  label={STAT_LABELS[s.stat.name] ?? s.stat.name}
                  value={s.base_stat}
                  color={STAT_COLORS[s.stat.name] ?? accentColor}
                />
              ))}
              <SectionDivider />
              <View style={st.totalRow}>
                <Text style={st.totalLabel}>Total</Text>
                <Text style={[st.totalValue, { color: accentColor }]}>
                  {pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0)}
                </Text>
              </View>
            </Card>
          )}

          {/* ── EVOLUÇÃO TAB ── */}
          {tab === 'Evolução' && (
            <Card>
              <CardTitle>Cadeia Evolutiva</CardTitle>
              {evoDetails.length === 0 && !loading && (
                <Text style={s.abilityDesc}>Este Pokémon não possui evoluções.</Text>
              )}
              <View style={evo.chain}>
                {evoDetails.map((e, idx) => {
                  const isCurrent = e.id === pokemon.id;
                  const eColor    = getTypeColor(e.types[0]?.type.name);
                  return (
                    <View key={e.id} style={evo.step}>
                      {idx > 0 && (
                        <View style={evo.arrowWrap}>
                          <Text style={evo.arrowText}>↓</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        activeOpacity={isCurrent ? 1 : 0.75}
                        onPress={() => !isCurrent && navigation.replace('PokemonDetail', { pokemon: e })}
                        style={[evo.card, isCurrent && { borderColor: accentColor, borderWidth: 2 }]}
                      >
                        <View style={[evo.imgWrap, { backgroundColor: hex2rgba(eColor, 0.1) }]}>
                          <Image source={{ uri: e.sprites.front_default }} style={evo.img} resizeMode="contain" />
                        </View>
                        <Text style={evo.num}>{padId(e.id)}</Text>
                        <Text style={[evo.name, isCurrent && { color: accentColor }]}>{formatName(e.name)}</Text>
                        <View style={evo.types}>
                          {e.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
                        </View>
                        {isCurrent && <Text style={[evo.current, { color: accentColor }]}>Atual</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}

          {/* ── MOVES TAB ── */}
          {tab === 'Moves' && (
            <Card>
              <CardTitle>Movimentos</CardTitle>
              <Text style={s.abilityDesc}>
                Este Pokémon possui {pokemon.moves.length} movimentos registrados.
              </Text>
              <SectionDivider />
              <PillButton
                label="Ver todos os movimentos"
                icon="⚔️"
                color={accentColor}
                onPress={() => navigation.navigate('PokemonMoves', { pokemon })}
              />
            </Card>
          )}

          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
              <ActivityIndicator color={accentColor} />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  hero:         { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  heroContent:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroLeft:     { flex: 1, paddingBottom: 8 },
  heroNum:      { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 2 },
  heroName:     { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 10 },
  heroTypes:    { flexDirection: 'row', gap: 8, marginBottom: 10 },
  heroBadge:    { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  heroBadgeText:{ color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroRight:    { alignItems: 'center', gap: 8 },
  heroSprite:   { width: 140, height: 140 },
  shinyBtn:     { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  shinyBtnActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  shinyBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  body:         { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
  scroll:       { padding: 16, paddingBottom: 40 },
  flavorText:   { fontSize: 14, lineHeight: 22, color: COLORS.textSub, fontStyle: 'italic' },
  abilityHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  abilityName:  { fontSize: 15, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
  hiddenBadge:  { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  hiddenText:   { fontSize: 10, fontWeight: '700', color: COLORS.textSub },
  abilityDesc:  { fontSize: 13, lineHeight: 20, color: COLORS.textSub },
  locArea:      { fontSize: 14, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  locGames:     { fontSize: 12, color: COLORS.textMuted, marginTop: 3, textTransform: 'capitalize' },
});

const st = StyleSheet.create({
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { fontSize: 24, fontWeight: '900' },
});

const evo = StyleSheet.create({
  chain:    { alignItems: 'center' },
  step:     { alignItems: 'center', width: '100%' },
  arrowWrap:{ paddingVertical: 8 },
  arrowText:{ fontSize: 22, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 16,
    alignItems: 'center', width: '100%', marginBottom: 4,
  },
  imgWrap:  { width: 88, height: 88, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  img:      { width: 72, height: 72 },
  num:      { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  name:     { fontSize: 16, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize', marginBottom: 8 },
  types:    { flexDirection: 'row', gap: 6, marginBottom: 4 },
  current:  { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
});