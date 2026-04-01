const BASE_URL = 'https://pokeapi.co/api/v2';

export async function fetchPokemons(limit = 20) {
  const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar Pokémons');
  }

  const data = await response.json();

  const detailed = await Promise.all(
    data.results.map(async (pokemon) => {
      const res = await fetch(pokemon.url);
      if (!res.ok) {
        throw new Error('Erro ao buscar detalhes do Pokémon');
      }
      return await res.json();
    })
  );

  return detailed;
}

export async function fetchMoveByName(name) {
  const response = await fetch(`${BASE_URL}/move/${name}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar movimento');
  }
  return await response.json();
}