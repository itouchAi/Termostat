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
  bgStyle: string;
  volumetricGlow: string;
  cardGlow: string;
  cardBorder: string;
  activePillGradient: string;
  sheen: string;
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
    bgStyle: 'radial-gradient(ellipse 95% 70% at 50% 15%, #241444 0%, #110a22 42%, #08050f 100%)',
    volumetricGlow: 'rgba(138, 43, 226, 0.55)', // Vibrant neon purple #8A2BE2 from user prompt
    cardGlow: 'rgba(130, 97, 230, 0.45)',
    cardBorder: 'rgba(167, 134, 255, 0.40)',
    activePillGradient: 'linear-gradient(135deg, #7352d4 0%, #8563e8 50%, #9979f5 100%)',
    sheen: 'from-[#8261e6]/25 via-[#8261e6]/[0.05] to-transparent',
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
    bgStyle: 'radial-gradient(ellipse 95% 70% at 50% 15%, #2e1746 0%, #170c26 42%, #0a0512 100%)',
    volumetricGlow: 'rgba(186, 138, 245, 0.55)',
    cardGlow: 'rgba(175, 127, 232, 0.45)',
    cardBorder: 'rgba(216, 180, 254, 0.40)',
    activePillGradient: 'linear-gradient(135deg, #9b6cd8 0%, #af7fe8 50%, #c79bf2 100%)',
    sheen: 'from-[#b388eb]/25 via-[#b388eb]/[0.05] to-transparent',
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
    bgStyle: 'radial-gradient(ellipse 95% 70% at 50% 15%, #181b54 0%, #0b0e2b 42%, #050616 100%)',
    volumetricGlow: 'rgba(92, 85, 235, 0.60)',
    cardGlow: 'rgba(92, 85, 220, 0.45)',
    cardBorder: 'rgba(153, 147, 255, 0.40)',
    activePillGradient: 'linear-gradient(135deg, #473ecc 0%, #5c55dc 50%, #7871f0 100%)',
    sheen: 'from-[#5c55dc]/25 via-[#5c55dc]/[0.05] to-transparent',
  },
  {
    id: 3,
    name: 'Derin Obsidyen Dumanı',
    hex: '#3f3856',
    gradient: 'from-[#2e293f] via-[#433b5c] to-[#5a507a]',
    borderUnder: '#1a1626',
    glow: 'rgba(110,95,145,0.6)',
    ringColor: '#8a7ea8',
    textColor: '#e6e4f0',
    badgeBg: 'bg-[#3f3856]/30 border-[#3f3856]/60 text-[#e6e4f0]',
    bgStyle: 'radial-gradient(ellipse 95% 70% at 50% 15%, #292338 0%, #151121 42%, #0a0810 100%)',
    volumetricGlow: 'rgba(145, 126, 185, 0.48)',
    cardGlow: 'rgba(110, 95, 145, 0.42)',
    cardBorder: 'rgba(138, 126, 168, 0.40)',
    activePillGradient: 'linear-gradient(135deg, #2e293f 0%, #433b5c 50%, #5a507a 100%)',
    sheen: 'from-[#5a507a]/35 via-[#3f3856]/[0.08] to-transparent',
  },
];

export const getObsidianPalette = (idx: number): ObsidianPalette => {
  if (idx >= 0 && idx < OBSIDIAN_PALETTES.length) {
    return OBSIDIAN_PALETTES[idx];
  }
  return OBSIDIAN_PALETTES[3]; // Default to user favorite 'Derin Obsidyen Dumanı'
};
