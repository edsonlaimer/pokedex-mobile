# Pokédex Mobile App

Aplicativo móvel desenvolvido em React Native com Expo, que consome dados da PokéAPI para exibição de Pokémons, seus movimentos e detalhes associados.

## Descrição

O sistema permite:

* Listar Pokémons com nome, número e imagem
* Realizar busca por nome ou número
* Visualizar os movimentos de um Pokémon
* Consultar detalhes completos de um movimento

Os dados são obtidos em tempo real através da PokéAPI.

## Tecnologias Utilizadas

* React Native
* Expo
* JavaScript
* React Navigation
* Fetch API
* PokéAPI

## API Utilizada

Base URL:

```
https://pokeapi.co/api/v2/
```

Endpoints utilizados:

* `/pokemon`
* `/pokemon/{id}`
* `/move/{name}`

## Estrutura do Projeto

```
pokedex-app/
│
├── App.js
├── package.json
│
└── src/
    ├── navigation/
    │   └── AppNavigator.js
    │
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── PokemonMovesScreen.js
    │   └── MoveDetailScreen.js
    │
    └── services/
        └── pokeapi.js
```

## Instalação

Instalar as dependências:


npm install


Instalar dependências de navegação:

```
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-safe-area-context react-native-gesture-handler react-native-screens react-native-reanimated
```

## Execução

Iniciar o projeto:


npx expo start


Opções de execução:

* Celular: utilizar o aplicativo Expo Go e escanear o QR Code
* Navegador: pressionar "w" no terminal
* Emulador Android: pressionar "a"

## Observações

* O aplicativo depende de conexão com a internet para consumir a API
* Caso ocorram problemas de cache, executar:

```
npx expo start -c
```



Edson Davi dos Santos Laimer
Análise e Desenvolvimento de Sistemas – PUCRS
