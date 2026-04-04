const BASE_URL = 'https://pokeapi.co/api/v2';

// Unified in-memory cache — persists for the lifetime of the app session
const cache = new Map();

async function cachedFetch(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

function extractId(url) {
  return parseInt(url.replace(/\/$/, '').split('/').pop(), 10);
}

// ─── Pokémon ─────────────────────────────────────────────────────────────────

export async function fetchPokemons(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const pokemons = await Promise.all(list.results.map(({ url }) => cachedFetch(url)));
  return { items: pokemons, total: list.count, hasMore: offset + limit < list.count };
}

export async function fetchAllPokemonIndex() {
  const KEY = '__pokemon_index__';
  if (cache.has(KEY)) return cache.get(KEY);
  const data = await cachedFetch(`${BASE_URL}/pokemon?limit=100000`);
  const index = data.results.map((p) => ({ name: p.name, url: p.url, id: extractId(p.url) }));
  cache.set(KEY, index);
  return index;
}

export async function fetchPokemonByName(name) {
  return cachedFetch(`${BASE_URL}/pokemon/${name}`);
}

export async function fetchPokemonSpecies(id) {
  return cachedFetch(`${BASE_URL}/pokemon-species/${id}`);
}

export async function fetchPokemonLocations(id) {
  return cachedFetch(`${BASE_URL}/pokemon/${id}/encounters`);
}

export async function fetchEvolutionChain(url) {
  return cachedFetch(url);
}

export async function fetchAbility(name) {
  return cachedFetch(`${BASE_URL}/ability/${name}`);
}

// ─── Moves ───────────────────────────────────────────────────────────────────

export async function fetchMoveByName(name) {
  return cachedFetch(`${BASE_URL}/move/${name}`);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export async function fetchAllTypes() {
  const data = await cachedFetch(`${BASE_URL}/type?limit=100`);
  return data.results.filter((t) => !['unknown', 'shadow'].includes(t.name));
}

export async function fetchType(name) {
  return cachedFetch(`${BASE_URL}/type/${name}`);
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function fetchItems(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/item?limit=${limit}&offset=${offset}`);
  const items = await Promise.all(list.results.map(({ url }) => cachedFetch(url)));
  return { items, total: list.count, hasMore: offset + limit < list.count };
}

// ─── Berries ─────────────────────────────────────────────────────────────────
// The /berry endpoint does not include sprites. Sprites live on the linked item.
// We fetch both and merge so each berry has berry.item.sprites available.

export async function fetchBerries(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/berry?limit=${limit}&offset=${offset}`);
  const berries = await Promise.all(
    list.results.map(async ({ url }) => {
      const berry = await cachedFetch(url);
      // Fetch the linked item to get the sprite
      const item = await cachedFetch(berry.item.url);
      return { ...berry, itemData: item };
    })
  );
  return { items: berries, total: list.count, hasMore: offset + limit < list.count };
}