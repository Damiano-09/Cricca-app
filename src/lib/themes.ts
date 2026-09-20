export interface ThemeDef {
  id: string;
  label: string;
  swatch: string[]; // 3 colori usati come anteprima nel selettore
  vars: Record<string, string>;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'bosco',
    label: 'Bosco',
    swatch: ['#1F5D42', '#E3A93B', '#A63A50'],
    vars: {
      bg: '#EDF0E8', ink: '#16241C', 'ink-soft': '#4B564C',
      court: '#1F5D42', 'court-dark': '#153F2E',
      sun: '#E3A93B', 'sun-soft': '#F6E6C4',
      berry: '#A63A50', 'berry-soft': '#F2D9DE',
      'grey-dot': '#A9B0A6', card: '#FBFAF6', line: '#D9DED2',
    },
  },
  {
    id: 'oceano',
    label: 'Oceano',
    swatch: ['#1B4F72', '#E0A72E', '#B23A48'],
    vars: {
      bg: '#E7EEF2', ink: '#12222B', 'ink-soft': '#4C6472',
      court: '#1B4F72', 'court-dark': '#12374F',
      sun: '#E0A72E', 'sun-soft': '#F5E3BE',
      berry: '#B23A48', 'berry-soft': '#F1D6D9',
      'grey-dot': '#A6B7BF', card: '#F7FAFB', line: '#D3E0E6',
    },
  },
  {
    id: 'tramonto',
    label: 'Tramonto',
    swatch: ['#B5502A', '#E8B93E', '#8E2A3B'],
    vars: {
      bg: '#F3EDE6', ink: '#2B1B12', 'ink-soft': '#6B5142',
      court: '#B5502A', 'court-dark': '#8A3C1F',
      sun: '#E8B93E', 'sun-soft': '#F8E7BE',
      berry: '#8E2A3B', 'berry-soft': '#EAD3D6',
      'grey-dot': '#C2B2A4', card: '#FBF6F1', line: '#E5D9CC',
    },
  },
  {
    id: 'uva',
    label: 'Uva',
    swatch: ['#5B3A6E', '#E3A93B', '#A63A50'],
    vars: {
      bg: '#EFEAF2', ink: '#221A29', 'ink-soft': '#5C4E66',
      court: '#5B3A6E', 'court-dark': '#402850',
      sun: '#E3A93B', 'sun-soft': '#F6E6C4',
      berry: '#A63A50', 'berry-soft': '#F2D9DE',
      'grey-dot': '#B4A9BC', card: '#F9F6FA', line: '#DED3E2',
    },
  },
  {
    id: 'notte',
    label: 'Notte',
    swatch: ['#3E8F68', '#E8B93E', '#D9596E'],
    vars: {
      bg: '#121714', ink: '#EAF0EA', 'ink-soft': '#9AA79C',
      court: '#3E8F68', 'court-dark': '#2C6B4D',
      sun: '#E8B93E', 'sun-soft': '#4A3F26',
      berry: '#D9596E', 'berry-soft': '#432028',
      'grey-dot': '#4A544C', card: '#1B2420', line: '#2A332C',
    },
  },
];

export function applyTheme(themeId: string | null | undefined) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}
