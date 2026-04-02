const BASE_URL = 'https://pokeapi.co/api/v2';

// In-memory cache
const cache = new Map();

async function cachedFetch(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar: ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

/**
 * Busca lista paginada de Pokémons com detalhes.
 * @param {number} limit - Quantidade por página
 * @param {number} offset - Offset para paginação
 */
export async function fetchPokemons(limit = 20, offset = 0) {
  const list = await cachedFetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);

  const detailed = await Promise.all(
    list.results.map(({ url }) => cachedFetch(url))
  );

  return {
    pokemons: detailed,
    total: list.count,
    hasMore: offset + limit < list.count,
  };
}

/**
 * Busca todos os nomes e IDs de Pokémons para busca local.
 * Retorna lista leve sem sprites.
 */
export async function fetchAllPokemonIndex() {
  const cacheKey = '__all_index__';
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const data = await cachedFetch(`${BASE_URL}/pokemon?limit=100000&offset=0`);
  const index = data.results.map((p, i) => ({
    name: p.name,
    url: p.url,
    id: extractIdFromUrl(p.url),
  }));

  cache.set(cacheKey, index);
  return index;
}

/**
 * Busca detalhes de um Pokémon pelo nome ou ID.
 */
export async function fetchPokemonByName(name) {
  return cachedFetch(`${BASE_URL}/pokemon/${name}`);
}

/**
 * Busca detalhes de um movimento pelo nome.
 */
export async function fetchMoveByName(name) {
  return cachedFetch(`${BASE_URL}/move/${name}`);
}

/**
 * Extrai o ID numérico a partir da URL da PokéAPI.
 */
function extractIdFromUrl(url) {
  const parts = url.replace(/\/$/, '').split('/');
  return parseInt(parts[parts.length - 1], 10);
}