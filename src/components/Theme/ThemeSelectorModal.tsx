import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Zap,
  BatteryCharging,
  Layers,
  CloudRain,
  Check,
  CloudSun,
  CloudSnow,
  CloudFog,
  Sliders,
} from 'lucide-react';
import type { ThemeMode, PerformanceMode } from '../../types.ts';
import type { WeatherCondition } from '../../utils/weather.ts';
import { translations, type Language } from '../../utils/i18n.ts';
import { OBSIDIAN_PALETTES, getObsidianPalette } from '../../utils/obsidianPalettes.ts';
import { triggerHaptic } from '../../utils/haptics.ts';
import { TactileDeckPreviewCard } from './TactileDeckPreviewCard.tsx';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  performanceMode: PerformanceMode;
  onSelectPerformanceMode: (perf: PerformanceMode) => void;
  activeWeatherCondition: WeatherCondition;
  onSelectWeatherConditionOverride?: (cond: WeatherCondition | null) => void;
  weatherConditionOverride?: WeatherCondition | null;
  cityName?: string;
  lang?: Language;
  obsidianPaletteIdx?: number;
  onSelectObsidianPaletteIdx?: (idx: number) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  performanceMode,
  onSelectPerformanceMode,
  activeWeatherCondition,
  onSelectWeatherConditionOverride,
  weatherConditionOverride,
  cityName = 'İstanbul',
  lang = 'tr',
  obsidianPaletteIdx = 3,
  onSelectObsidianPaletteIdx,
}) => {
  const t = translations[lang] || translations.tr;
  const palette = getObsidianPalette(obsidianPaletteIdx ?? 3);
  const [showTactilePreview, setShowTactilePreview] = useState<boolean>(true);

  if (!isOpen) return null;

  const themes: Array<{
    id: ThemeMode;
    title: string;
    badge?: string;
    description: string;
    renderPreview: () => React.ReactNode;
  }> = [
    {
      id: 'glass',
      title: 'Canlı Cam (Liquid Glass)',
      badge: 'Saydam Buzlu Cam',
      description:
        'Saydam buzlu cam, prizmatik kenar eğim kırılması ve arkasında canlı hareketli hava durumu yansıması.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center p-1.5 shadow-md border border-white/40 bg-gradient-to-tr from-sky-400 via-indigo-500 to-amber-300">
          {/* Weather background simulation */}
          <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_50%)]" />
          {/* Frosted Glass Floating Card with Specular Edge */}
          <div className="relative w-full h-full rounded-xl bg-white/25 backdrop-blur-md border border-white/70 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center">
            <Layers className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
            <span className="text-[8px] font-extrabold text-white mt-0.5 tracking-tighter drop-shadow-sm">
              CAM
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'dark',
      title: 'Karanlık Gece Modu',
      description:
        'Derin siyah ve lacivert tonları, göz yormayan gece konforu ve enerji tasarrufu.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center p-1.5 shadow-md border border-indigo-900/50 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950">
          {/* Tiny stars */}
          <div className="absolute top-2 left-3 w-1 h-1 rounded-full bg-blue-200 opacity-80" />
          <div className="absolute top-4 right-3 w-0.5 h-0.5 rounded-full bg-white opacity-90" />
          <div className="absolute bottom-3 left-4 w-1 h-1 rounded-full bg-indigo-300 opacity-60" />
          {/* Glowing Moon */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-200 to-white flex items-center justify-center shadow-[0_0_12px_rgba(199,210,254,0.6)]">
            <Moon className="w-4 h-4 text-slate-900 fill-slate-900" />
          </div>
        </div>
      ),
    },
    {
      id: 'light',
      title: 'Aydınlık Gündüz Modu',
      description:
        'Güneş ışığında yüksek okunabilirlik, kristal beyaz ve ferah gökyüzü mavisi estetiği.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center p-1.5 shadow-md border border-sky-200 bg-gradient-to-tr from-sky-100 via-sky-300 to-amber-100">
          {/* Sun flare */}
          <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-amber-400/40 blur-sm" />
          {/* Glowing Sun */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_14px_rgba(251,191,36,0.7)] text-amber-950">
            <Sun className="w-4 h-4 text-amber-900 fill-amber-300" />
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      title: 'Akıllı Otomatik Mod (Sistem & Saat)',
      description:
        'Günün saatine ve gün batımına göre gündüz ve gece teması arasında pürüzsüz otomatik geçiş.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-md border border-slate-300 dark:border-slate-700">
          {/* Split Half Day / Half Night */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full bg-gradient-to-b from-sky-300 to-amber-100 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-amber-700 ml-1" />
            </div>
            <div className="w-1/2 h-full bg-gradient-to-b from-slate-950 to-indigo-950 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-indigo-200 mr-1" />
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Laptop className="w-3 h-3 text-slate-700 dark:text-slate-300" />
          </div>
        </div>
      ),
    },
    {
      id: 'obsidian_lavender',
      title: 'Obsidian Lavender (Pastel Lila & Kadife)',
      badge: 'Deneysel Lüks',
      description:
        'FitVibe stili mat obsidyen cam, lüks pastel lavanta/kül leylak auraları ve 3D LED kaide derinliği.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center p-1.5 shadow-md border border-[#8261e6]/40 bg-gradient-to-b from-[#181524] to-[#0a0910]">
          {/* Volumetric Purple Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(138,43,226,0.45),transparent_70%)]" />
          {/* Glowing Ring Base */}
          <div className="absolute bottom-1.5 w-10 h-3 rounded-full border border-[#a786ff] shadow-[0_0_8px_#8a65f0]" />
          {/* Floating Pill Centerpiece */}
          <div className="relative z-10 w-6 h-6 rounded-lg bg-gradient-to-tr from-[#6846c9] to-[#9979f5] shadow-[0_0_12px_rgba(130,97,230,0.7)] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      ),
    },
    {
      id: 'tactile_deck',
      title: 'Tactile Deck (Hi-Fi Donanım Konsolu)',
      badge: 'Özel • 3D Donanım',
      description:
        'Skeuomorphic metal potansiyometre kadranı, 3D mekanik basmalı tuşlar, neon tüp telemetrisi ve sıcak akkor aurası.',
      renderPreview: () => (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden flex items-center justify-center p-1.5 shadow-md border border-amber-500/40 bg-gradient-to-b from-[#33303c] via-[#23212b] to-[#121118]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,140,60,0.5),transparent_65%)]" />
          <div
            className="w-8 h-8 rounded-full relative flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.8),0_0_0_1.5px_#0b0a0f]"
            style={{
              background: 'repeating-conic-gradient(#0b0a0f 0 6deg, #5d5663 6deg 12deg)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center relative"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #4c4954, #18171d 75%)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.8)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ff9a4a]" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const weatherOptions: Array<{ id: WeatherCondition | null; label: string; icon: React.ReactNode }> = [
    { id: null, label: `Canlı (${cityName})`, icon: <Sparkles className="w-3 h-3 text-amber-400" /> },
    { id: 'sunny', label: 'Güneşli', icon: <Sun className="w-3 h-3 text-amber-500" /> },
    { id: 'partly_cloudy', label: 'Parçalı Bulut', icon: <CloudSun className="w-3 h-3 text-sky-400" /> },
    { id: 'rainy', label: 'Yağmurlu', icon: <CloudRain className="w-3 h-3 text-blue-400" /> },
    { id: 'snowy', label: 'Karlı', icon: <CloudSnow className="w-3 h-3 text-cyan-300" /> },
    { id: 'fog', label: 'Sisli', icon: <CloudFog className="w-3 h-3 text-slate-300" /> },
  ];

  const isObsidian = currentTheme === 'obsidian_lavender';
  const isGlass = currentTheme === 'glass';
  const isTactile = currentTheme === 'tactile_deck';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.16] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
            : isTactile
            ? 'bg-[#181622]/98 border-t border-l border-white/[0.22] border-r border-black/80 border-b-2 border-b-black/90 text-white shadow-[0_30px_80px_rgba(0,0,0,0.98)]'
            : isGlass
            ? 'bg-slate-950/60 border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.3)] text-white'
            : currentTheme === 'dark'
            ? 'bg-slate-900/95 border-slate-800 text-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)]'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isObsidian
            ? 'border-white/[0.08] bg-[#161324]/80'
            : isGlass
            ? 'border-white/15 bg-white/[0.08]'
            : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                Tema & Görsel Efektler
              </h3>
              <p className={`text-[11px] ${isObsidian ? 'text-[#a89dc7]' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                Seçtiğiniz an arka planda canlı değişir, çarpı ile çıkabilirsiniz.
              </p>
            </div>
          </div>

          {/* Close [X] Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
              isObsidian
                ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                : isGlass
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-5">
          {/* ── 1. TEMA SEÇENEKLERİ (ALT ALTA & ÖRNEK GÖRSELLERİ İLE) ── */}
          <div>
            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
              isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-slate-300' : 'text-slate-400 dark:text-slate-400'
            }`}>
              <span>Arayüz Teması</span>
              <span className={`text-[10px] font-semibold lowercase ${isObsidian ? 'text-[#a786ff]' : 'text-blue-500 dark:text-blue-400'}`}>
                • anlık canlı uygulanır
              </span>
            </h4>

            <div className="space-y-2.5">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectTheme(t.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerHaptic('selection');
                        onSelectTheme(t.id);
                      }
                    }}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex flex-col cursor-pointer relative ${
                      isSelected
                        ? isObsidian
                          ? 'bg-[#221c38] border-[#a786ff] shadow-[0_0_20px_rgba(167,134,255,0.25)] ring-2 ring-[#a786ff]/40 text-white'
                          : isTactile
                          ? 'bg-[#221e2e] border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.35)] ring-2 ring-amber-500/40 text-white'
                          : isGlass
                          ? 'bg-white/20 border-white/50 shadow-lg ring-2 ring-white/30 text-white'
                          : 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                        : isObsidian
                        ? 'bg-[#161324]/80 hover:bg-[#1e1a2f] border-white/[0.08] text-slate-300'
                        : isTactile
                        ? 'bg-[#1a1724]/90 hover:bg-[#252033] border-white/[0.12] text-slate-200'
                        : isGlass
                        ? 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 text-white'
                        : 'bg-white/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      {/* Visual Preview Box */}
                      <div className="shrink-0">{t.renderPreview()}</div>

                      {/* Information */}
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-extrabold text-xs sm:text-sm">
                            {t.title}
                          </span>
                          {t.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs ${
                                t.id === 'tactile_deck'
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 border border-amber-400/30'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              }`}
                            >
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-snug line-clamp-2 ${
                          isObsidian ? 'text-[#a89dc7]' : isTactile ? 'text-slate-300' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {t.description}
                        </p>
                      </div>

                      {/* Radio Check Indicator */}
                      <div
                        style={
                          isSelected && isObsidian
                            ? { backgroundColor: palette.hex, borderColor: palette.ringColor }
                            : undefined
                        }
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? isObsidian
                              ? 'text-white'
                              : isTactile
                              ? 'border-amber-500 bg-amber-500 text-slate-950 font-black'
                              : 'border-blue-500 bg-blue-500 text-white'
                            : isObsidian
                            ? 'border-[#4c4266]'
                            : isTactile
                            ? 'border-slate-600'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Sub-color swatches for Obsidian Lavender */}
                    {t.id === 'obsidian_lavender' && (
                      <div
                        className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#c8b7f8]">
                            Alt Renk Paleti:
                          </span>
                          <span className="text-[9px] text-[#9a93b5]">
                            {OBSIDIAN_PALETTES[obsidianPaletteIdx ?? 3]?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {OBSIDIAN_PALETTES.map((p, pIdx) => {
                            const isPaletteActive = (obsidianPaletteIdx ?? 3) === pIdx;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic('selection');
                                  onSelectTheme('obsidian_lavender');
                                  onSelectObsidianPaletteIdx?.(pIdx);
                                }}
                                style={{
                                  backgroundColor: p.hex,
                                  borderTop: '1px solid rgba(255, 255, 255, 0.45)',
                                  borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
                                  borderRight: '1px solid rgba(0, 0, 0, 0.6)',
                                  borderBottom: '1.5px solid rgba(0, 0, 0, 0.8)',
                                  boxShadow: isPaletteActive
                                    ? `0 0 12px ${p.hex}, 0 4px 8px rgba(0,0,0,0.8)`
                                    : '0 2px 6px rgba(0,0,0,0.5)',
                                }}
                                className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                                  isPaletteActive
                                    ? 'scale-120 ring-2 ring-white ring-offset-1 ring-offset-[#12101b]'
                                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                                }`}
                                title={p.name}
                              >
                                {isPaletteActive && <Check className="w-3 h-3 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Showcase for Tactile Deck */}
                    {t.id === 'tactile_deck' && (
                      <div
                        className="mt-3 pt-2.5 border-t border-white/10 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Ana Sayfa 3D Donanım Konsol Önizlemesi
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              setShowTactilePreview(!showTactilePreview);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition-all cursor-pointer"
                          >
                            {showTactilePreview ? 'Önizlemeyi Gizle ▴' : 'Önizlemeyi Göster ▾'}
                          </button>
                        </div>

                        {showTactilePreview && (
                          <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                            <TactileDeckPreviewCard
                              isActiveTheme={currentTheme === 'tactile_deck'}
                              onApplyTheme={() => {
                                onSelectTheme('tactile_deck');
                                triggerHaptic('heavy');
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2. PERFORMANS MODU (GÜÇLÜ TELEFONLAR / DÜŞÜK GÜÇ MODU) ── */}
          <div
            className={`pt-2 border-t ${
              isObsidian ? 'border-white/[0.08]' : isGlass ? 'border-white/15' : 'border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <div className="mb-2.5">
              <h4
                className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-slate-300' : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                <span>Cihaz Performansı & FPS Modu</span>
              </h4>
              <p
                className={`text-[11px] mt-0.5 ${
                  isObsidian ? 'text-[#9a93b5]' : isGlass ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Telefonunuzun donanımına göre maksimum akıcılık veya pil tasarrufu seçin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Ultra Performance (60 FPS) */}
              <button
                type="button"
                onClick={() => onSelectPerformanceMode('ultra')}
                style={
                  performanceMode === 'ultra' && isObsidian
                    ? {
                        borderColor: palette.ringColor,
                        boxShadow: `0 0 16px ${palette.glow}`,
                      }
                    : undefined
                }
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  performanceMode === 'ultra'
                    ? isObsidian
                      ? 'bg-[#1e1930] text-white ring-2 ring-white/20'
                      : isGlass
                      ? 'bg-white/20 border-white/50 shadow-md ring-2 ring-white/30 text-white'
                      : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : isObsidian
                    ? 'bg-[#161324] hover:bg-[#201c32] border-white/[0.08] text-slate-200'
                    : isGlass
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-white/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    performanceMode === 'ultra'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : isObsidian
                      ? 'bg-[#252037] text-slate-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">
                      Maksimum Performans
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                      60 FPS
                    </span>
                  </div>
                  <p
                    className={`text-[10px] leading-snug mt-0.5 ${
                      isObsidian ? 'text-[#9a93b5]' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Güçlü telefonlar için tam çözünürlüklü parçacıklar, akıcı hava durumu ve kristal cam.
                  </p>
                </div>
              </button>

              {/* Eco Performance (Low Power) */}
              <button
                type="button"
                onClick={() => onSelectPerformanceMode('eco')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  performanceMode === 'eco'
                    ? isObsidian
                      ? 'bg-[#1e1930] border-emerald-500 shadow-md ring-2 ring-emerald-500/30 text-white'
                      : isGlass
                      ? 'bg-white/20 border-white/50 shadow-md ring-2 ring-white/30 text-white'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : isObsidian
                    ? 'bg-[#161324] hover:bg-[#201c32] border-white/[0.08] text-slate-200'
                    : isGlass
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-white/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    performanceMode === 'eco'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isObsidian
                      ? 'bg-[#252037] text-slate-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">
                      Düşük Güç (Eco Mod)
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                      PİL TASARRUFU
                    </span>
                  </div>
                  <p
                    className={`text-[10px] leading-snug mt-0.5 ${
                      isObsidian ? 'text-[#9a93b5]' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Hafifletilmiş efektler, yavaşlayan cihazlar için sıfır GPU yükü ve uzun pil ömrü.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── 3. CANLI HAVA AMBİYANSINI ANINDA DENEYİN (TEST BUTONLARI) ── */}
          {onSelectWeatherConditionOverride && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-blue-500" />
                  <span>Arka Plan Hava Efektini Önizle</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Yağmur, kar, sis ve güneş efektlerini hemen denemek için dokunun:
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {weatherOptions.map((opt) => {
                  const isActive = weatherConditionOverride === opt.id;
                  return (
                    <button
                      key={String(opt.id)}
                      type="button"
                      onClick={() => onSelectWeatherConditionOverride(opt.id)}
                      style={
                        isActive && isObsidian
                          ? { backgroundColor: palette.hex, borderColor: palette.ringColor }
                          : undefined
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isActive
                          ? isObsidian
                            ? 'text-white shadow-xs'
                            : isGlass
                            ? 'bg-white/25 text-white border-white/40 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : isObsidian
                          ? 'bg-[#181427] hover:bg-[#221c38] border-white/[0.08] text-slate-200'
                          : isGlass
                          ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                          : 'bg-white/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
          isObsidian
            ? 'border-white/[0.08] bg-[#161324]/80'
            : isGlass
            ? 'border-white/15 bg-white/[0.08]'
            : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/50'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className={isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
              Tema anında aktiftir
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={
              isObsidian
                ? {
                    background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                    boxShadow: `0 8px 22px rgba(0,0,0,0.6), 0 2px 14px ${palette.glow}`,
                    borderColor: palette.ringColor,
                  }
                : undefined
            }
            className={`px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-md cursor-pointer ${
              isObsidian
                ? 'text-white border'
                : isGlass
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-md'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
            }`}
          >
            Tamam & Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
