/** The Stride palette. Every colour in the app comes from here. */
export const C = {
  bg: '#F5F6F3',
  shell: '#E9EBE7',
  card: '#FFFFFF',
  ink: '#1B1F1C',
  stone: '#8B918C',
  faint: '#E8EAE6',
  moss: '#2F7D5B',
  mossSoft: '#E3F0E9',
  protein: '#E8695C',
  carbs: '#E5A33B',
  fat: '#5C8DEE',
  gold: '#D9A426',
  goldSoft: '#FBF3DC',
  danger: '#C4483C',
};

export const FONT = 'var(--font-outfit), system-ui, -apple-system, sans-serif';

export const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, pill: 99 };

export const SHADOW = {
  card: '0 1px 3px rgba(27,31,28,0.05), 0 6px 20px rgba(27,31,28,0.04)',
  lift: '0 8px 24px rgba(47,125,91,0.25)',
};

/** Macro key -> display label + colour, so bars and fields stay in sync. */
export const MACROS = [
  { key: 'protein', label: 'Protein', short: 'P', color: C.protein },
  { key: 'carbs', label: 'Carbs', short: 'C', color: C.carbs },
  { key: 'fat', label: 'Fat', short: 'F', color: C.fat },
];
