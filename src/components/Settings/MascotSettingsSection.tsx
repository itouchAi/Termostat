import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  BookOpen,
  Moon,
  Heart,
  ChevronDown,
  Play,
  Clock,
  Image as ImageIcon,
  Upload,
  Volume2,
  VolumeX,
  Cat,
  Footprints,
  Lightbulb,
} from 'lucide-react';
import type { MascotConfig, MascotState, MascotScreenSaverBg, MascotType } from '../../types/mascot.ts';
import { DEFAULT_MASCOT_CONFIG } from '../../types/mascot.ts';
import { UniversalMascot } from '../Mascot/UniversalMascot.tsx';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface MascotSettingsSectionProps {
  themeMode?: ThemeMode;
  config?: MascotConfig;
  onUpdateConfig?: (newConfig: Partial<MascotConfig>) => void;
  onLaunchScreenSaver?: () => void;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  headerPrefix?: React.ReactNode;
}

export const MascotSettingsSection: React.FC<MascotSettingsSectionProps> = ({
  themeMode = 'glass',
  config: externalConfig,
  onUpdateConfig,
  onLaunchScreenSaver,
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
  isOpen = false,
  onToggleOpen,
  headerPrefix,
}) => {
  const isTactile = themeMode === 'tactile_deck';
  const isObsidian = themeMode === 'obsidian_lavender';

  const [localConfig, setLocalConfig] = useState<MascotConfig>(() => {
    if (externalConfig) return externalConfig;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('mascot_settings_config');
      if (saved) {
        try {
          return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_MASCOT_CONFIG;
  });

  const activeConfig = externalConfig ?? localConfig;
  const [previewState, setPreviewState] = useState<MascotState>('idle');
  const [customUrlInput, setCustomUrlInput] = useState(activeConfig.customWallpaperUrl || '');

  const updateConfig = (patch: Partial<MascotConfig>) => {
    triggerHaptic('selection');
    const updated = { ...activeConfig, ...patch };
    setLocalConfig(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mascot_settings_config', JSON.stringify(updated));
    }
    onUpdateConfig?.(patch);
  };

  const handleSelectState = (st: MascotState) => {
    triggerHaptic('light');
    setPreviewState(st);
  };

  // Handle local image file upload from device
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        triggerHaptic('success');
        updateConfig({
          backgroundMode: 'custom',
          customWallpaperUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Playground background preview renderer (mirrors MascotScreenSaverOverlay)
  const renderPlaygroundBackground = () => {
    const { backgroundMode, customWallpaperUrl, isBackgroundBlurred } = activeConfig;
    const blurClass = isBackgroundBlurred ? 'blur-md scale-110' : '';

    if (backgroundMode === 'custom' && customWallpaperUrl) {
      return (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${blurClass}`}
          style={{
            backgroundImage: `url(${customWallpaperUrl})`,
            filter: isBackgroundBlurred ? 'blur(6px) brightness(0.55)' : 'brightness(0.75)',
          }}
        />
      );
    }
    if (backgroundMode === 'cyber_station') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-500 ${blurClass}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#090b14] via-[#0d162e] to-[#05070e]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.3) 0%, transparent 60%), linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 26px 26px, 26px 26px',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
        </div>
      );
    }
    if (backgroundMode === 'warm_hearth') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-500 ${blurClass}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1d0b05] via-[#2c1308] to-[#0c0402]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(249,115,22,0.3)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-orange-600/30 to-transparent blur-md" />
        </div>
      );
    }
    if (backgroundMode === 'midnight_purple') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-500 ${blurClass}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0414] via-[#1a0f30] to-[#06020c]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.3)_0%,transparent_60%)]" />
          <div className="absolute bottom-4 left-1/4 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        </div>
      );
    }
    // Saf OLED Siyah
    return (
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl flex flex-col shadow-xs border transition-all duration-300 overflow-hidden ${
        isObsidian
          ? isOpen
            ? 'bg-[#181427] border-purple-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-[#151221] border-white/[0.08] hover:border-white/[0.18]'
          : isTactile
          ? isOpen
            ? 'bg-[#1c1929] border-amber-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
            : 'bg-[#181523] border-t border-l border-white/[0.14] border-r border-black/70 border-b border-black/90 hover:border-white/25'
          : isOpen
          ? 'bg-white/10 border-white/25 backdrop-blur-md shadow-lg'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      {/* ── HEADER & MASTER TOGGLE ── */}
      <div
        onClick={onToggleOpen}
        className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {headerPrefix}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isTactile
                ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-purple-500/30'
            }`}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
              <span>Sanal Asistan & Ekran Koruyucu</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isTactile
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                }`}
              >
                {activeConfig.type === 'cat'
                  ? 'Mırnav'
                  : activeConfig.type === 'rabbit'
                  ? 'Puki'
                  : activeConfig.type === 'human_male'
                  ? 'Mert'
                  : activeConfig.type === 'human_female'
                  ? 'Ela'
                  : 'TermoBot'}
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
              Boşta kalınca yürüyen, düşünen, tık tık vuran, 3 döngü sonra derin uyuyan maskot
            </p>
          </div>
        </div>

        {/* Master Toggle & Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => updateConfig({ enabled: !activeConfig.enabled })}
            style={
              activeConfig.enabled && isTactile
                ? {
                    background:
                      'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                    boxShadow:
                      '0 3px 0 #0c0b10, 0 6px 12px rgba(0,0,0,0.8), 0 0 12px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255, 200, 150, 0.45)',
                    color: '#fff7ed',
                  }
                : undefined
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
              activeConfig.enabled
                ? isObsidian
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-t border-l border-white/25 border-r border-b'
                  : isTactile
                  ? ''
                  : 'bg-emerald-600 text-white shadow-emerald-500/30'
                : isTactile
                ? 'bg-[#221f2f] text-slate-400 border border-white/10'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Ekran koruyucu asistanı aç veya kapat"
          >
            <span>{activeConfig.enabled ? 'Açık ✓' : 'Kapalı'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3.5 border-t border-white/[0.08]">
          {/* ── ŞİMDİ TEST ET / BAŞLAT BUTONU ── */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onLaunchScreenSaver?.();
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 ${
              isTactile
                ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#3a344d] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_3px_0_#0c0b10,0_4px_10px_rgba(0,0,0,0.8)]'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ekran Koruyucuyu Şimdi Başlat (Önizle)</span>
          </button>

          {/* ── 1. MASKOT KARAKTERİ SEÇİMİ (5 KARAKTER) ── */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Maskot Karakteri Seçimi:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'termobot' as MascotType, icon: '🤖', name: 'TermoBot', desc: 'Retro Robot' },
                { id: 'cat' as MascotType, icon: '🐱', name: 'Mırnav', desc: 'Petek Kedisi' },
                { id: 'rabbit' as MascotType, icon: '🐰', name: 'Puki', desc: 'Tavşan' },
                { id: 'human_male' as MascotType, icon: '🧑', name: 'Mert', desc: 'Erkek Asistan' },
                { id: 'human_female' as MascotType, icon: '👩', name: 'Ela', desc: 'Kadın Asistan' },
              ].map((m) => {
                const isSelected = activeConfig.type === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateConfig({ type: m.id })}
                    className={`p-2 rounded-xl text-center border cursor-pointer transition-all flex flex-col items-center justify-between ${
                      isSelected
                        ? isTactile
                          ? 'bg-amber-500/25 border-amber-500 text-white shadow-sm ring-1 ring-amber-400'
                          : 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="font-bold text-[11px]">{m.name}</div>
                    <div className="text-[8.5px] text-white/50">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. BEKLEME SÜRESİ AYARI ── */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Otomatik Devreye Girme Süresi (Boşta Kalma):</span>
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { sec: 15, label: '15 sn' },
                { sec: 30, label: '30 sn' },
                { sec: 60, label: '1 dk' },
                { sec: 120, label: '2 dk' },
                { sec: 300, label: '5 dk' },
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => updateConfig({ screensaverTimeoutSec: item.sec })}
                  className={`py-1.5 px-1 rounded-xl text-center text-[10.5px] font-bold transition-all cursor-pointer border ${
                    activeConfig.screensaverTimeoutSec === item.sec
                      ? isTactile
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 3. ARKA PLAN SEÇİMİ & CİHAZDAN GÖRSEL YÜKLEME ── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ekran Koruyucu Arka Planı (Önizlemeli):</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'black' as MascotScreenSaverBg, label: '⬛ Saf OLED Siyah', desc: 'Tam karanlık' },
                { id: 'cyber_station' as MascotScreenSaverBg, label: '🧪 Termo Lab', desc: 'Siber mavi grid' },
                { id: 'warm_hearth' as MascotScreenSaverBg, label: '🔥 Sıcak Köşe', desc: 'Köz ve şömine' },
                { id: 'midnight_purple' as MascotScreenSaverBg, label: '🌌 Gece Nebula', desc: 'Derin obsidyen' },
                {
                  id: 'custom' as MascotScreenSaverBg,
                  label: '🖼️ Özel / Cihaz',
                  desc: activeConfig.customWallpaperUrl ? 'Yüklendi ✓' : 'Resim seçin',
                },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => updateConfig({ backgroundMode: bg.id })}
                  className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex flex-col justify-between ${
                    activeConfig.backgroundMode === bg.id
                      ? isTactile
                        ? 'bg-amber-500/25 border-amber-500 text-white shadow-sm ring-2 ring-amber-400'
                        : 'bg-purple-600/35 border-purple-400 text-white shadow-sm ring-2 ring-purple-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-[10.5px] leading-tight">{bg.label}</div>
                  <div className="text-[9px] text-white/60 mt-1">{bg.desc}</div>
                </button>
              ))}
            </div>

            {/* Arka Planı Blur Göster & Ses Efektleri Ayarı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {/* Blur Göster */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-left">
                  <span className="text-[11px] font-bold text-white block">Arka Planı Blur Göster</span>
                  <span className="text-[9px] text-white/60">Buzlu cam bulanıklığı uygular</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig({ isBackgroundBlurred: !activeConfig.isBackgroundBlurred })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    activeConfig.isBackgroundBlurred
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {activeConfig.isBackgroundBlurred ? 'Aktif ✓' : 'Kapalı'}
                </button>
              </div>

              {/* Ses Efektleri (Mute/Unmute) */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-left flex items-center gap-1.5">
                  {activeConfig.soundEffectsEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <span className="text-[11px] font-bold text-white block">Maskot Sesleri</span>
                    <span className="text-[9px] text-white/60">Tık tık, adım, uyanma sesleri</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig({ soundEffectsEnabled: !activeConfig.soundEffectsEnabled })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    activeConfig.soundEffectsEnabled
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {activeConfig.soundEffectsEnabled ? 'Açık 🔊' : 'Sessiz 🔇'}
                </button>
              </div>
            </div>

            {/* Cihazdan Görsel Seç Butonu, URL Girişi & Görseli Kaldır / Sıfırla */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cihazdan Resim / Duvar Kağıdı Seç</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDeviceImageUpload}
                  />
                </label>

                <div className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Veya Görsel URL (https://...jpg)..."
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        triggerHaptic('selection');
                        updateConfig({
                          backgroundMode: 'custom',
                          customWallpaperUrl: customUrlInput.trim(),
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Uygula
                  </button>
                </div>
              </div>

              {/* Özel Görsel Yüklendiyse Kaldır / Varsayılana Dön Butonu */}
              {activeConfig.customWallpaperUrl && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
                  <span className="truncate max-w-[200px] sm:max-w-xs text-[10.5px]">
                    🖼️ Yüklü Görsel: {activeConfig.customWallpaperUrl.startsWith('data:') ? 'Cihazdan seçildi' : activeConfig.customWallpaperUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('warning');
                      setCustomUrlInput('');
                      updateConfig({
                        backgroundMode: 'black',
                        customWallpaperUrl: '',
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer shadow-sm transition-all"
                  >
                    Görseli Kaldır & Sıfırla ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. CANLI MASKOT & ARKA PLAN ÖNİZLEME ALANI (CANLI PREVIEW) ── */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-[11px] font-bold px-1">
              <span className="text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Canlı Önizleme & Davranış Testi</span>
              </span>
              <span className="text-[10px] text-white/50">Dokununca 1.5 sn'de uyanır</span>
            </div>

            {/* Arka planı birebir simüle eden canlı kutu */}
            <div className="relative rounded-2xl border border-white/15 overflow-hidden flex flex-col items-center justify-center min-h-[220px] shadow-inner transition-all duration-500">
              {/* Arka Plan Katmanı (Buzlama ve Tema) */}
              {renderPlaygroundBackground()}

              {/* Bilgi Rozetleri (Arka Plan ve Maskot Tipi) */}
              <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-20 pointer-events-none text-[9px] font-mono font-bold">
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-white/90 border border-white/10 backdrop-blur-sm">
                  {activeConfig.type === 'cat'
                    ? '🐱 Mırnav'
                    : activeConfig.type === 'rabbit'
                    ? '🐰 Puki'
                    : activeConfig.type === 'human_male'
                    ? '🧑 Mert'
                    : activeConfig.type === 'human_female'
                    ? '👩 Ela'
                    : '🤖 TermoBot'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-amber-300 border border-white/10 backdrop-blur-sm">
                  {activeConfig.backgroundMode === 'cyber_station'
                    ? '🧪 Termo Lab'
                    : activeConfig.backgroundMode === 'warm_hearth'
                    ? '🔥 Sıcak Köşe'
                    : activeConfig.backgroundMode === 'midnight_purple'
                    ? '🌌 Gece Nebula'
                    : activeConfig.backgroundMode === 'custom'
                    ? '🖼️ Özel Duvar Kağıdı'
                    : '⬛ Saf OLED Siyah'}
                  {activeConfig.isBackgroundBlurred ? ' (Blur)' : ''}
                </span>
              </div>

              {/* Maskot Karakteri */}
              <div className="relative z-10 py-6">
                <UniversalMascot
                  type={activeConfig.type}
                  state={previewState}
                  themeMode={themeMode}
                  currentTemp={currentTemp}
                  targetTemp={targetTemp}
                  isKombiActive={isKombiActive}
                  size="md"
                  interactive={true}
                  soundEnabled={activeConfig.soundEffectsEnabled}
                />
              </div>
            </div>

            {/* Hareket / Davranış Butonları */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleSelectState('idle')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  previewState === 'idle' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                🟢 Boşta
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('walking')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  previewState === 'walking' ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                <Footprints className="w-2.5 h-2.5" />
                <span>Gezinme</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('knocking')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  previewState === 'knocking' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                }`}
              >
                🤔 Tık Tık
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('thinking')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  previewState === 'thinking' ? 'bg-yellow-500 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                }`}
              >
                <Lightbulb className="w-2.5 h-2.5" />
                <span>Düşünme</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('reading')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  previewState === 'reading' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                <BookOpen className="w-2.5 h-2.5" />
                <span>Kitap</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('deep_sleep')}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  previewState === 'deep_sleep' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                <Moon className="w-2.5 h-2.5" />
                <span>Derin Uyku</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
