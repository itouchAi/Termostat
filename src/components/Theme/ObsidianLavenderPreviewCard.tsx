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
  onApplyTheme?: () => void;
  isActiveTheme?: boolean;
}

export const ObsidianLavenderPreviewCard: React.FC<ObsidianLavenderPreviewCardProps> = ({
  onApplyTheme,
  isActiveTheme = false,
}) => {
  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<string>('KONFOR');
  const [isLiked, setIsLiked] = useState(false);

  const colors = [
    { id: 0, hex: '#8261e6', name: 'Pastel Lavanta' },
    { id: 1, hex: '#b392cd', name: 'Kül Leylak' },
    { id: 2, hex: '#484457', name: 'Antrasit' },
    { id: 3, hex: '#1a1824', name: 'Derin Obsidyen' },
  ];

  const modes = ['EKO', 'KONFOR', 'GECE', 'BOOST', 'TATİL'];

  return (
    <div className="w-full rounded-3xl bg-[#09080f] p-3 sm:p-5 text-white border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(130,97,230,0.15)] relative overflow-hidden select-none">
      {/* ── Volumetric Neon Purple Background Light Trails ── */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(138,43,226,0.22)_0%,rgba(100,50,180,0.06)_50%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.12)_0%,transparent_70%)] blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8261e6] shadow-[0_0_8px_#8261e6] animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest text-[#c8b7f8] uppercase">
            FitVibe Stili • Obsidian Lavender
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8261e6]/20 text-[#d8caff] border border-[#8261e6]/30">
          Özel Lüks Pastel Konsept
        </span>
      </div>

      {/* Main Grid: Left Navigation / Progress & Right 3D Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* ── LEFT COLUMN (Sidebar & Progress Card) ── */}
        <div className="md:col-span-4 flex flex-col gap-2.5">
          {/* Category Highlight Pill */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#14121e]/90 border border-white/[0.07] shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#6846c9] to-[#9979f5] flex items-center justify-center text-white shadow-xs">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Akıllı Kombi</div>
                <div className="text-[9px] text-[#8f88a8]">Modülasyonlu Isı</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8f88a8]" />
          </div>

          {/* Gamification Progress Widget (Matching 75% chart on the left of user's image) */}
          <div className="p-3 rounded-2xl bg-[#13111c]/90 border border-white/[0.06] shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#b5aed4]">
              <span>Tasarruf Verimliliği</span>
              <span className="text-[#8f88a8]">Bu Hafta ▾</span>
            </div>

            <div className="flex items-center gap-3 my-1">
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
                    className="text-[#8261e6]"
                    strokeDasharray="75, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
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
                        className={`w-full rounded-full ${
                          bar.active ? 'bg-[#8261e6] shadow-[0_0_6px_#8261e6]' : 'bg-[#5b5278]'
                        }`}
                        style={{ height: `${bar.h}%` }}
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
        <div className="md:col-span-8 p-3 sm:p-4 rounded-3xl bg-[#13111c]/95 border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_20px_45px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Ambient Radial Light behind the 3D Object */}
          <div className="absolute -top-10 right-0 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(138,43,226,0.3)_0%,rgba(130,97,230,0.08)_50%,transparent_75%)] blur-2xl pointer-events-none" />

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
                Kadifemsi mat obsidyen gövde, hassas dijital modülasyon ve akıllı fısıltı sessizliği.
              </p>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#dcd2ff] mt-2">
                22.5°C <span className="text-xs font-normal text-[#8f88a8]">/ Hedef</span>
              </div>
            </div>

            {/* ── 3D FLOATING PODIUM WITH GLOWING PURPLE LED RING ── */}
            <div className="relative w-32 h-36 sm:w-40 sm:h-44 flex flex-col items-center justify-end shrink-0">
              {/* Floating Metallic Thermostat Core above Podium */}
              <div className="relative z-10 mb-2 flex flex-col items-center animate-bounce duration-1000">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1f1b30] via-[#2d2745] to-[#453a6b] p-0.5 border border-white/20 shadow-[0_15px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(130,97,230,0.4)] flex items-center justify-center">
                  <div className="w-full h-full rounded-2xl bg-[#14121f] flex flex-col items-center justify-center">
                    <Flame className="w-7 h-7 text-[#c8b7f8] animate-pulse drop-shadow-[0_0_10px_#8261e6]" />
                    <span className="text-[9px] font-mono font-bold text-white mt-0.5">22.5°C</span>
                  </div>
                </div>
              </div>

              {/* Cylindrical Metallic Pedestal with Glowing Purple LED Ring Base */}
              <div className="relative w-28 sm:w-36 h-7 flex items-center justify-center">
                {/* Glowing LED Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#a786ff] shadow-[0_0_18px_#8a65f0,inset_0_0_10px_#8a65f0]" />
                {/* Pedestal Top Face */}
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#342e4c] to-[#1c182a] border border-white/20" />
              </div>
            </div>
          </div>

          {/* Color Selector Swatches (Matching the 4 circles in user's image) */}
          <div className="relative z-10 my-2">
            <span className="text-[9px] font-semibold text-[#8f88a8] block mb-1">
              Renk Paleti: {colors[selectedColor].name}
            </span>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full transition-all cursor-pointer border ${
                    selectedColor === c.id
                      ? 'ring-2 ring-[#a786ff] ring-offset-2 ring-offset-[#13111c] border-white scale-110 shadow-[0_0_10px_rgba(167,134,255,0.6)]'
                      : 'border-white/20 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Mode Pill Buttons (Matching XS, S, [M], L, XL in user's image) */}
          <div className="relative z-10 my-2">
            <span className="text-[9px] font-semibold text-[#8f88a8] block mb-1">Çalışma Modu</span>
            <div className="flex gap-1.5 flex-wrap">
              {modes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMode(m)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                    selectedMode === m
                      ? 'bg-[#8261e6] text-white border-[#a786ff] shadow-[0_0_15px_rgba(130,97,230,0.55)] scale-105'
                      : 'bg-[#1c1928] hover:bg-[#252236] text-[#8e8a9f] border-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar: "Add to Bag" Equivalent ("Alev Başlat / Isıt") & Wishlist Heart */}
          <div className="relative z-10 flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onApplyTheme}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#7352d4] via-[#8563e8] to-[#9979f5] hover:from-[#7e5de0] hover:to-[#a484ff] active:scale-95 text-white font-extrabold text-xs shadow-[0_8px_25px_rgba(130,97,230,0.45)] border-t border-white/35 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>{isActiveTheme ? 'Bu Tema Şu An Aktif' : 'Obsidian Lavender Temasını Uygula'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className="p-2.5 rounded-2xl bg-[#1c1928] hover:bg-[#252236] border border-white/10 active:scale-90 transition-all cursor-pointer text-white"
              title="Favorilere Ekle"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? 'fill-pink-500 text-pink-500' : 'text-[#8e8a9f]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Trust Badges Strip (Matching Free Shipping, Easy Returns etc. in user's image) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-[9px] text-[#9a93b5]">
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#14121f]">
          <Truck className="w-3.5 h-3.5 text-[#a786ff]" />
          <span>Fısıltı Sessizliği (&lt;32dB)</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#14121f]">
          <RotateCcw className="w-3.5 h-3.5 text-[#a786ff]" />
          <span>%35 Doğalgaz Tasarrufu</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#14121f]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#a786ff]" />
          <span>0.1°C Hassas PID Denge</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#14121f]">
          <Headphones className="w-3.5 h-3.5 text-[#a786ff]" />
          <span>7/24 Kesintisiz Telemetri</span>
        </div>
      </div>
    </div>
  );
};
