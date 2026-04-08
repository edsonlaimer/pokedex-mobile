// ─── Design Tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  bg:          '#F4F6FB',
  surface:     '#FFFFFF',
  border:      '#EAECF4',
  text:        '#0F1117',
  textSub:     '#6B7280',
  textMuted:   '#9CA3AF',
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const SHADOW = {
  card: {
    shadowColor: '#1E2A4A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  strong: {
    shadowColor: '#1E2A4A',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

// ─── Type System ──────────────────────────────────────────────────────────────
export const TYPE_COLORS = {
  fire:     '#F97316',
  water:    '#3B82F6',
  grass:    '#16A34A',
  electric: '#D97706',
  psychic:  '#DB2777',
  ice:      '#0891B2',
  dragon:   '#7C3AED',
  dark:     '#1F2937',
  fairy:    '#EC4899',
  normal:   '#6B7280',
  fighting: '#B45309',
  poison:   '#9333EA',
  ground:   '#B45309',
  flying:   '#4F86C6',
  bug:      '#65A30D',
  rock:     '#78716C',
  ghost:    '#4C1D95',
  steel:    '#475569',
};

export const TYPE_ICONS = {
  fire:     '🔥',
  water:    '💧',
  grass:    '🌿',
  electric: '⚡',
  psychic:  '🔮',
  ice:      '❄️',
  dragon:   '🐉',
  dark:     '🌑',
  fairy:    '✨',
  normal:   '⭕',
  fighting: '🥊',
  poison:   '☠️',
  ground:   '🌍',
  flying:   '🌪️',
  bug:      '🐛',
  rock:     '🪨',
  ghost:    '👻',
  steel:    '⚙️',
};

export const getTypeColor  = (type) => TYPE_COLORS[type] ?? TYPE_COLORS.normal;
export const getTypeIcon   = (type) => TYPE_ICONS[type]  ?? '❓';

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

// ─── Berry Flavors ────────────────────────────────────────────────────────────
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

export const padId = (id) => `#${String(id).padStart(3, '0')}`;

export const hex2rgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};