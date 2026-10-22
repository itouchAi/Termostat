export interface ObsidianPalette {
  id: number;
  name: string;
  hex: string;
  gradient: string;
  borderUnder: string;
  glow: string;
  ringColor: string;
  textColor: string;
  badgeBg: string;
}

export const OBSIDIAN_PALETTES: ObsidianPalette[] = [
  {
    id: 0,
    name: 'Pastel Lavanta (Varsayılan)',
    hex: '#8261e6',
    gradient: 'from-[#7352d4] via-[#8563e8] to-[#9979f5]',
    borderUnder: '#3b1c8a',
    glow: 'rgba(130,97,230,0.6)',
    ringColor: '#a786ff',
    textColor: '#d8caff',
    badgeBg: 'bg-[#8261e6]/25 border-[#8261e6]/50 text-[#d8caff]',
  },
  {
    id: 1,
    name: 'Kül Leylak (Dusty Lilac)',
    hex: '#b388eb',
    gradient: 'from-[#9b6cd8] via-[#af7fe8] to-[#c79bf2]',
    borderUnder: '#532685',
    glow: 'rgba(175,127,232,0.6)',
    ringColor: '#d8b4fe',
    textColor: '#f3e8ff',
    badgeBg: 'bg-[#b388eb]/25 border-[#b388eb]/50 text-[#f3e8ff]',
  },
  {
    id: 2,
    name: 'Kraliyet İndigo (Royal Violet)',
    hex: '#5c55dc',
    gradient: 'from-[#473ecc] via-[#5c55dc] to-[#7871f0]',
    borderUnder: '#27207e',
    glow: 'rgba(92,85,220,0.6)',
    ringColor: '#9993ff',
    textColor: '#e0e7ff',
    badgeBg: 'bg-[#5c55dc]/25 border-[#5c55dc]/50 text-[#e0e7ff]',
  },
  {
    id: 3,
    name: 'Derin Obsidyen Dumanı',
    hex: '#3f3856',
    gradient: 'from-[#2e293f] via-[#433b5c] to-[#5a507a]',
    borderUnder: '#1a1626',
    glow: 'rgba(110,95,145,0.5)',
    ringColor: '#8a7ea8',
    textColor: '#e6e4f0',
    badgeBg: 'bg-[#3f3856]/30 border-[#3f3856]/60 text-[#e6e4f0]',
  },
];

export const getObsidianPalette = (idx: number): ObsidianPalette => {
  if (idx >= 0 && idx < OBSIDIAN_PALETTES.length) {
    return OBSIDIAN_PALETTES[idx];
  }
  return OBSIDIAN_PALETTES[0];
};
