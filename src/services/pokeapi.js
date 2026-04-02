const BASE_URL = 'https://pokeapi.co/api/v2';

// In-memory cache — evita re-fetches durante a sessão
const cache = new Map();

async function cachedFetch(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar: ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

function extractIdFromUrl(url) {
  const parts = url.replace(/\/$/, '').split('/');
  return parseInt(parts[parts.length - 1], 10);
}

// ─── Pokémon ─────────────────────────────────────────────────────────────────

export async function fetchPokemons(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const detailed = await Promise.all(list.results.map(({ url }) => cachedFetch(url)));
  return { pokemons: detailed, total: list.count, hasMore: offset + limit < list.count };
}

export async function fetchAllPokemonIndex() {
  const key = '__all_index__';
  if (cache.has(key)) return cache.get(key);
  const data = await cachedFetch(`${BASE_URL}/pokemon?limit=100000&offset=0`);
  const index = data.results.map((p) => ({
    name: p.name,
    url: p.url,
    id: extractIdFromUrl(p.url),
  }));
  cache.set(key, index);
  return index;
}

export async function fetchPokemonByName(name) {
  return cachedFetch(`${BASE_URL}/pokemon/${name}`);
}

export async function fetchPokemonLocations(id) {
  return cachedFetch(`${BASE_URL}/pokemon/${id}/encounters`);
}

// ─── Espécie & Evolução ──────────────────────────────────────────────────────

export async function fetchPokemonSpecies(id) {
  return cachedFetch(`${BASE_URL}/pokemon-species/${id}`);
}

export async function fetchEvolutionChain(url) {
  return cachedFetch(url);
}

// ─── Habilidades ─────────────────────────────────────────────────────────────

export async function fetchAbility(name) {
  return cachedFetch(`${BASE_URL}/ability/${name}`);
}

// ─── Movimentos ──────────────────────────────────────────────────────────────

export async function fetchMoveByName(name) {
  return cachedFetch(`${BASE_URL}/move/${name}`);
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export async function fetchAllTypes() {
  const data = await cachedFetch(`${BASE_URL}/type?limit=100`);
  return data.results.filter((t) => !['unknown', 'shadow'].includes(t.name));
}

export async function fetchType(name) {
  return cachedFetch(`${BASE_URL}/type/${name}`);
}

// ─── Itens ───────────────────────────────────────────────────────────────────

export async function fetchItems(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/item?limit=${limit}&offset=${offset}`);
  const detailed = await Promise.all(list.results.map(({ url }) => cachedFetch(url)));
  return { items: detailed, total: list.count, hasMore: offset + limit < list.count };
}

// ─── Berries ─────────────────────────────────────────────────────────────────

export async function fetchBerries(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/berry?limit=${limit}&offset=${offset}`);
  const detailed = await Promise.all(list.results.map(({ url }) => cachedFetch(url)));
  return { berries: detailed, total: list.count, hasMore: offset + limit < list.count };
}