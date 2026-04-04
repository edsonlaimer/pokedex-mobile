# Pokédex App

Aplicativo mobile desenvolvido em React Native com Expo, consumindo dados em tempo real da [PokéAPI](https://pokeapi.co).

---

## Funcionalidades

- Listagem de todos os Pokémons com scroll infinito
- Busca por nome ou número
- Filtro por tipo (18 tipos disponíveis)
- Detalhes do Pokémon: stats, habilidades, cadeia evolutiva, localização e texto da Pokédex
- Lista de movimentos com detalhes completos
- Comparador de dois Pokémons lado a lado
- Enciclopédia de Itens com busca
- Enciclopédia de Berries com busca e gráfico de sabores

---

## Tecnologias

- [React Native](https://reactnative.dev)
- [Expo](https://expo.dev)
- [React Navigation](https://reactnavigation.org)
- [PokéAPI](https://pokeapi.co/docs/v2)

---

## Instalação

```bash
npm install
```

Dependências de navegação:

```bash
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-safe-area-context react-native-gesture-handler react-native-screens react-native-reanimated
```

---

## Execução

```bash
npx expo start
```

| Plataforma | Como abrir |
|---|---|
| Celular | Abrir o Expo Go e escanear o QR Code |
| Android | Pressionar `a` no terminal |
| Navegador | Pressionar `w` no terminal |

> Em caso de erros de cache: `npx expo start -c`

---

## Estrutura

```
src/
├── components/
│   ├── components.js   # Componentes reutilizáveis (SearchBar, Card, Modal...)
│   └── constants.js    # Cores, labels e helpers globais
├── hooks/
│   └── hooks.js        # usePaginatedList, useLocalSearch, useDebounce
├── navigation/
│   └── AppNavigator.js
├── screens/
│   ├── HomeScreen.js
│   ├── PokemonDetailScreen.js
│   ├── PokemonMovesScreen.js
│   ├── MoveDetailScreen.js
│   ├── ComparatorScreen.js
│   ├── ItemsScreen.js
│   └── BerriesScreen.js
└── services/
    └── pokeapi.js      # Todas as chamadas à API com cache em memória
```

---

## API

Base URL: `https://pokeapi.co/api/v2`

Endpoints utilizados: `/pokemon`, `/pokemon-species`, `/evolution-chain`, `/ability`, `/type`, `/move`, `/item`, `/berry`

---

Edson Davi dos Santos Laimer — Análise e Desenvolvimento de Sistemas · PUCRS