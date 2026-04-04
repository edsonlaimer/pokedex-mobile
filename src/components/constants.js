// ─── Pokémon Types ────────────────────────────────────────────────────────────
export const TYPE_COLORS = {
  fire:     '#F97316',
  water:    '#3B82F6',
  grass:    '#22C55E',
  electric: '#EAB308',
  psychic:  '#EC4899',
  ice:      '#06B6D4',
  dragon:   '#8B5CF6',
  dark:     '#374151',
  fairy:    '#F472B6',
  normal:   '#9CA3AF',
  fighting: '#B45309',
  poison:   '#A855F7',
  ground:   '#D97706',
  flying:   '#60A5FA',
  bug:      '#65A30D',
  rock:     '#78716C',
  ghost:    '#6D28D9',
  steel:    '#64748B',
};

export const getTypeColor = (type) => TYPE_COLORS[type] ?? TYPE_COLORS.normal;

// ─── Stats ────────────────────────────────────────────────────────────────────
export const STAT_LABELS = {
  hp:               'HP',
  attack:           'ATK',
  defense:          'DEF',
  'special-attack': 'SP.ATK',
  'special-defense':'SP.DEF',
  speed:            'VEL',
};

export const STAT_COLORS = {
  hp:               '#22C55E',
  attack:           '#F97316',
  defense:          '#3B82F6',
  'special-attack': '#EC4899',
  'special-defense':'#8B5CF6',
  speed:            '#EAB308',
};

export const STAT_ORDER = [
  'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed',
];

// ─── Berry flavors ────────────────────────────────────────────────────────────
export const FLAVOR_COLORS = {
  spicy:  '#F97316',
  dry:    '#EAB308',
  sweet:  '#EC4899',
  bitter: '#22C55E',
  sour:   '#3B82F6',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatName = (name = '') =>
  name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const padId = (id) => String(id).padStart(3, '0');