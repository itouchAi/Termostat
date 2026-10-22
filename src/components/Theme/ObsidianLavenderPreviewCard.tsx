import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Droplets,
  Wind,
  Maximize2,
  Heart,
  ChevronRight,
  TrendingUp,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
} from 'lucide-react';

interface ObsidianLavenderPreviewCardProps {
  onApplyTheme?: (colorHex?: string) => void;
  isActiveTheme?: boolean;
}

export const ObsidianLavenderPreviewCard: React.FC<ObsidianLavenderPreviewCardProps> = ({
  onApplyTheme,
  isActiveTheme = false,
}) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<string>('KONFOR');
  const [isLiked, setIsLiked] = useState(false);

  // 4 Distinct High-End Pastel Palettes matching the reference image swatches
  const colorPalettes = [
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

  const activePalette = colorPalettes[selectedColorIdx];

  const modes = [
    { id: 'EKO', label: 'EKO' },
    { id: 'KONFOR', label: 'KONFOR' },
    { id: 'GECE', label: 'GECE' },
    { id: 'BOOST', label: 'BOOST' },
    { id: 'TATİL', label: 'TATİL' },
  ];

  return (
    <div
      className="w-full rounded-[32px] sm:rounded-[36px] bg-[#0c0a13] p-3.5 sm:p-5 text-white relative overflow-hidden select-none transition-all duration-500"
      style={{
        /* ── Bombeli Dış Çerçeve (Kavisli kabartma bevel + derin gölge) ── */
        borderTop: '1.5px solid rgba(255, 255, 255, 0.16)',
        borderLeft: '1.5px solid rgba(255, 255, 255, 0.12)',
        borderRight: '1.5px solid rgba(0, 0, 0, 0.7)',
        borderBottom: '2.5px solid rgba(0, 0, 0, 0.85)',
        boxShadow: `
          0 30px 70px -15px rgba(0, 0, 0, 0.95),
          0 0 45px ${activePalette.glow.replace('0.6', '0.15')},
          inset 0 1.5px 2px rgba(255, 255, 255, 0.2),
          inset 0 -2px 3px rgba(0, 0, 0, 0.6)
        `,
      }}
    >
      {/* ── Volumetric Neon Purple Background Light Trails (Dynamic with chosen palette) ── */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${activePalette.glow.replace('0.6', '0.25')} 0%, ${activePalette.glow.replace('0.6', '0.06')} 50%, transparent 75%)`,
        }}
      />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.1)_0%,transparent_70%)] blur-2xl pointer-events-none" />

      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between mb-3.5 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse transition-all duration-300"
            style={{
              backgroundColor: activePalette.hex,
              boxShadow: `0 0 10px ${activePalette.hex}`,
            }}
          />
          <span className="text-[11px] font-bold tracking-widest text-[#c8b7f8] uppercase">
            FitVibe • 3D Embossed Obsidian Showcase
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${activePalette.badgeBg}`}
        >
          {activePalette.name}
        </span>
      </div>

      {/* Main Grid: Left Navigation / Progress & Right 3D Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* ── LEFT COLUMN: Category Pill & 3D Gamification Progress Card ── */}
        <div className="md:col-span-4 flex flex-col gap-3">
          {/* Category Highlight Pill (Bombeli, 3D kabartmalı) */}
          <div
            className="flex items-center justify-between p-2.5 rounded-2xl bg-[#14121e]/90 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.14)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              borderRight: '1px solid rgba(0, 0, 0, 0.6)',
              borderBottom: '2px solid rgba(0, 0, 0, 0.75)',
              boxShadow: `
                0 8px 18px -2px rgba(0, 0, 0, 0.7),
                inset 0 1px 1px rgba(255, 255, 255, 0.16),
                inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${activePalette.gradient} flex items-center justify-center text-white transition-all duration-300`}
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: `0 4px 12px ${activePalette.glow.replace('0.6', '0.4')}`,
                }}
              >
                <Flame className="w-4 h-4 fill-white/80" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Akıllı Kombi</div>
                <div className="text-[9px] text-[#8f88a8]">Modülasyonlu Isı</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8f88a8]" />
          </div>

          {/* Gamification Progress Widget (Matching 75% chart on the left of user's image) */}
          <div
            className="p-3.5 rounded-2xl bg-[#13111c]/95 flex flex-col gap-2.5"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              borderRight: '1px solid rgba(0, 0, 0, 0.6)',
              borderBottom: '2px solid rgba(0, 0, 0, 0.8)',
              boxShadow: `
                0 14px 28px -4px rgba(0, 0, 0, 0.75),
                inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
                inset 0 -2px 2px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-[#b5aed4]">
              <span>Tasarruf Verimliliği</span>
              <span className="text-[#8f88a8]">Bu Hafta ▾</span>
            </div>

            <div className="flex items-center gap-3 my-0.5">
              {/* Circular Gauge */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#201d2d]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeDasharray="75, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke={activePalette.hex}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    className="transition-all duration-500"
                    style={{ filter: `drop-shadow(0 0 4px ${activePalette.hex})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-white leading-none">%75</span>
                  <span className="text-[6px] text-[#8f88a8]">Eko</span>
                </div>
              </div>

              {/* Weekly Mini Bars */}
              <div className="flex-1 flex items-end justify-between h-9 px-1">
                {[
                  { d: 'P', h: 60 },
                  { d: 'S', h: 80 },
                  { d: 'Ç', h: 45 },
                  { d: 'P', h: 90 },
                  { d: 'C', h: 70 },
                  { d: 'C', h: 100, active: true },
                  { d: 'P', h: 55 },
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-1.5 rounded-full bg-[#201d2e] h-8 flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-full transition-all duration-300"
                        style={{
                          height: `${bar.h}%`,
                          backgroundColor: bar.active ? activePalette.hex : '#5b5278',
                          boxShadow: bar.active ? `0 0 6px ${activePalette.hex}` : 'none',
                        }}
                      />
                    </div>
                    <span className="text-[7px] text-[#787192] font-mono">{bar.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN SHOWCASE CARD (The Core 3D Floating Hero Showcase) ── */}
        <div
          className="md:col-span-8 p-3.5 sm:p-5 rounded-[28px] bg-[#12101b]/95 relative overflow-hidden flex flex-col justify-between"
          style={{
            /* ── Bombeli Çerçeve: Üst-Sol Aydınlık Kenar, Alt-Sağ Derinlik Gölgeleri ── */
            borderTop: '1.5px solid rgba(255, 255, 255, 0.18)',
            borderLeft: '1.5px solid rgba(255, 255, 255, 0.12)',
            borderRight: '1.5px solid rgba(0, 0, 0, 0.75)',
            borderBottom: '2.5px solid rgba(0, 0, 0, 0.9)',
            boxShadow: `
              0 22px 50px -8px rgba(0, 0, 0, 0.9),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.22),
              inset 0 -2.5px 2.5px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Subtle Ambient Radial Light behind the 3D Object */}
          <div
            className="absolute -top-10 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${activePalette.glow.replace('0.6', '0.35')} 0%, ${activePalette.glow.replace('0.6', '0.08')} 50%, transparent 75%)`,
            }}
          />

          {/* Top Title & Price Section */}
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#a898df] uppercase">
                PREMIUM ISITMA SERİSİ
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Kombi3D Ultra Lüks
              </h3>
              <p className="text-[10px] text-[#9a93b5] max-w-xs mt-1 leading-relaxed">
                Kadifemsi mat obsidyen gövde, dokunsal bombeli butonlar ve 3D derinlik ışıklandırması.
              </p>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#dcd2ff] mt-2">
                22.5°C <span className="text-xs font-normal text-[#8f88a8]">/ Hedef Sıcaklık</span>
              </div>
            </div>

            {/* ── 3D FLOATING PODIUM WITH GLOWING LED RING (Recreating the central object) ── */}
            <div className="relative w-32 h-36 sm:w-40 sm:h-44 flex flex-col items-center justify-end shrink-0">
              {/* Floating Metallic Thermostat Core above Podium */}
              <div className="relative z-10 mb-2 flex flex-col items-center animate-bounce duration-1000">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1f1b30] via-[#2d2745] to-[#453a6b] p-0.5 flex items-center justify-center transition-all duration-500"
                  style={{
                    borderTop: '1.5px solid rgba(255, 255, 255, 0.4)',
                    borderLeft: '1.5px solid rgba(255, 255, 255, 0.25)',
                    borderRight: '1.5px solid rgba(0, 0, 0, 0.6)',
                    borderBottom: '2px solid rgba(0, 0, 0, 0.8)',
                    boxShadow: `
                      0 18px 36px rgba(0, 0, 0, 0.9),
                      0 0 25px ${activePalette.glow.replace('0.6', '0.45')},
                      inset 0 1px 1.5px rgba(255, 255, 255, 0.5)
                    `,
                  }}
                >
                  <div className="w-full h-full rounded-2xl bg-[#14121f] flex flex-col items-center justify-center">
                    <Flame
                      className="w-7 h-7 animate-pulse transition-colors duration-300"
                      style={{
                        color: activePalette.textColor,
                        filter: `drop-shadow(0 0 10px ${activePalette.hex})`,
                      }}
                    />
                    <span className="text-[9px] font-mono font-bold text-white mt-0.5">22.5°C</span>
                  </div>
                </div>
              </div>

              {/* Cylindrical Metallic Pedestal with Glowing LED Ring Base */}
              <div className="relative w-28 sm:w-36 h-7 flex items-center justify-center">
                {/* Glowing LED Ring (Reacts dynamically to chosen color!) */}
                <div
                  className="absolute inset-0 rounded-full border-2 transition-all duration-500"
                  style={{
                    borderColor: activePalette.ringColor,
                    boxShadow: `0 0 20px ${activePalette.ringColor}, inset 0 0 10px ${activePalette.ringColor}`,
                  }}
                />
                {/* Pedestal Top Face */}
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#342e4c] to-[#1c182a] border border-white/20" />
              </div>
            </div>
          </div>

          {/* ── DİNAMİK ÇALIŞAN RENK PALETİ BUTONLARI ("işlevsiz mi o buton" sorununa tam çözüm) ── */}
          <div className="relative z-10 my-3 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#b5aed4]">
                Renk Temasını Seçin (Canlı Değişir):
              </span>
              <span className="text-[9px] font-mono font-semibold" style={{ color: activePalette.ringColor }}>
                ✓ {activePalette.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {colorPalettes.map((c, idx) => {
                const isSelected = selectedColorIdx === idx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    style={{
                      backgroundColor: c.hex,
                      /* Dokunsal 3D daire buton efekti */
                      borderTop: '1.5px solid rgba(255, 255, 255, 0.45)',
                      borderLeft: '1.5px solid rgba(255, 255, 255, 0.3)',
                      borderRight: '1.5px solid rgba(0, 0, 0, 0.6)',
                      borderBottom: '2px solid rgba(0, 0, 0, 0.8)',
                      boxShadow: isSelected
                        ? `0 0 18px ${c.hex}, 0 6px 14px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.6)`
                        : '0 4px 10px rgba(0,0,0,0.6)',
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#12101b]'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                    title={`${c.name} Temasını Uygula`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RAFİNE 3D MOD BUTONLARI (Görsel 5 stilinde yumuşak, kadife ve kaba beyaz çizgilerden arındırılmış) ── */}
          <div className="relative z-10 my-2.5">
            <span className="text-[10px] font-bold text-[#9e97b8] block mb-2 uppercase tracking-wider">
              Çalışma Modu (Dokunsal 3D Tuş Hissi)
            </span>

            {/* Grid of Pill Buttons */}
            <div className="flex gap-2 sm:gap-2.5 flex-wrap">
              {modes.map((m) => {
                const isSelected = selectedMode === m.id;

                if (isSelected) {
                  /* ── SEÇİLİ AKTİF MOD TUŞU (Yumuşak pastel degrade, Görsel 3 alt gölgelendirmesi, kaba beyaz çizgiler yok) ── */
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`min-w-[48px] sm:min-w-[56px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer bg-gradient-to-b ${activePalette.gradient} text-white scale-105 -translate-y-0.5`}
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.45)',
                        boxShadow: `
                          0 10px 24px -2px rgba(0, 0, 0, 0.85),
                          0 0 20px ${activePalette.glow.replace('0.6', '0.45')},
                          inset 0 1px 1.5px rgba(255, 255, 255, 0.3)
                        `,
                      }}
                    >
                      {m.label}
                    </button>
                  );
                }

                /* ── PASİF MOD TUŞLARI (Görsel 5'teki kadife obsidyen ve rafine 1px aydınlatma stili) ── */
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className="min-w-[48px] sm:min-w-[56px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#9e97b8] hover:text-white transition-all duration-200 cursor-pointer bg-[#151322] hover:bg-[#1b182b] hover:-translate-y-0.5 active:translate-y-0.5"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: `
                        0 8px 18px -3px rgba(0, 0, 0, 0.75),
                        inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
                        inset 0 -1.5px 2px rgba(0, 0, 0, 0.4)
                      `,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── BÜYÜK AKSİYON BUTONU (Görsel 3'teki beğenilen alt gölge, yumuşatılmış üst ışık) ── */}
          <div className="relative z-10 flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={() => onApplyTheme?.(activePalette.hex)}
              className={`flex-1 py-3 sm:py-3.5 px-5 rounded-[26px] bg-gradient-to-b ${activePalette.gradient} text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:translate-y-1 active:scale-[0.98]`}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.28)',
                borderTop: '1.5px solid rgba(255, 255, 255, 0.45)',
                boxShadow: `
                  0 16px 32px -4px rgba(0, 0, 0, 0.85),
                  0 0 26px ${activePalette.glow.replace('0.6', '0.45')},
                  inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
                  inset 0 -2px 3px rgba(0, 0, 0, 0.3)
                `,
              }}
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>
                {isActiveTheme ? 'Bu Tema Şu An Aktif' : `Bu Temayı Uygula (${activePalette.name})`}
              </span>
            </button>

            {/* Heart / Wishlist 3D Embossed Circular Button */}
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:translate-y-0.5 active:scale-95 shrink-0 bg-[#151322] hover:bg-[#1c182b]"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: `
                  0 8px 18px rgba(0, 0, 0, 0.75),
                  inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
                  inset 0 -1.5px 2px rgba(0, 0, 0, 0.4)
                `,
              }}
              title="Favorilere Ekle"
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 ${
                  isLiked ? 'fill-pink-500 text-pink-500 scale-110 drop-shadow-[0_0_8px_#ec4899]' : 'text-[#8e8a9f]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Trust Badges Strip (Görsel 4'teki butonlar, Görsel 5 kart derinliği ve gölgelendirmesi ile güncellendi) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3 border-t border-white/[0.06] text-[9.5px] text-[#9a93b5]">
        <div
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#13111c]/95 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 10px 22px -3px rgba(0, 0, 0, 0.8),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
              inset 0 -1.5px 2px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          <Truck className="w-4 h-4 shrink-0" style={{ color: activePalette.ringColor }} />
          <span className="font-semibold text-slate-200">Fısıltı Sessizliği (&lt;32dB)</span>
        </div>
        <div
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#13111c]/95 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 10px 22px -3px rgba(0, 0, 0, 0.8),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
              inset 0 -1.5px 2px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          <RotateCcw className="w-4 h-4 shrink-0" style={{ color: activePalette.ringColor }} />
          <span className="font-semibold text-slate-200">%35 Doğalgaz Tasarrufu</span>
        </div>
        <div
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#13111c]/95 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 10px 22px -3px rgba(0, 0, 0, 0.8),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
              inset 0 -1.5px 2px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: activePalette.ringColor }} />
          <span className="font-semibold text-slate-200">0.1°C Hassas PID Denge</span>
        </div>
        <div
          className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#13111c]/95 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 10px 22px -3px rgba(0, 0, 0, 0.8),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.12),
              inset 0 -1.5px 2px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          <Headphones className="w-4 h-4 shrink-0" style={{ color: activePalette.ringColor }} />
          <span className="font-semibold text-slate-200">7/24 Kesintisiz Telemetri</span>
        </div>
      </div>
    </div>
  );
};
