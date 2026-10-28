import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  BookOpen,
  Moon,
  Heart,
  Check,
  Lock,
  ChevronDown,
  Play,
  Clock,
  Image as ImageIcon,
  Eye,
  Sliders,
} from 'lucide-react';
import type { MascotConfig, MascotState, MascotScreenSaverBg } from '../../types/mascot.ts';
import { DEFAULT_MASCOT_CONFIG } from '../../types/mascot.ts';
import { TermoBotMascot } from '../Mascot/TermoBotMascot.tsx';
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
  const isGlass = themeMode === 'glass';

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
                TermoBot
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
              Ekran boşta kaldığında devreye giren, dokununca 3 sn tepki verip uyanan robot ekran koruyucu
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

          {/* ── BEKLEME SÜRESİ AYARI ── */}
          <div className="space-y-1.5">
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
            <p className="text-[9.5px] text-white/50 px-1">
              Uygulamada herhangi bir tuşa basılmadığında ekran koruyucu devreye girer.
            </p>
          </div>

          {/* ── ARKA PLAN SEÇİMİ (3 ÖZEL TEMA + SAF SİYAH + CUSTOM) ── */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ekran Koruyucu Arka Planı:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'black' as MascotScreenSaverBg, label: '⬛ Saf OLED Siyah', desc: 'Sıfır güç, tam karanlık' },
                { id: 'cyber_station' as MascotScreenSaverBg, label: '🧪 Termo Lab', desc: 'Fütüristik mavi grid' },
                { id: 'warm_hearth' as MascotScreenSaverBg, label: '🔥 Sıcak Köşe', desc: 'Köz ve şömine ambiyansı' },
                { id: 'midnight_purple' as MascotScreenSaverBg, label: '🌌 Gece Nebula', desc: 'Derin obsidyen gökyüzü' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => updateConfig({ backgroundMode: bg.id })}
                  className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex flex-col justify-between ${
                    activeConfig.backgroundMode === bg.id
                      ? isTactile
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm ring-1 ring-amber-400/40'
                        : 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-[10.5px] leading-tight">{bg.label}</div>
                  <div className="text-[9px] text-white/60 mt-1">{bg.desc}</div>
                </button>
              ))}
            </div>

            {/* Arka Planı Blur Göster Seçeneği */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 mt-1">
              <div className="text-left">
                <span className="text-[11px] font-bold text-white block">Arka Planı Blur Göster</span>
                <span className="text-[9px] text-white/60">Görsele hafif buzlu cam bulanıklığı uygular</span>
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

            {/* Özel Duvar Kağıdı Girişi */}
            <div className="flex gap-1.5 mt-1">
              <input
                type="text"
                placeholder="Özel Duvar Kağıdı Görsel URL (https://...jpg)..."
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

          {/* ── CANLI MASKOT DAVRANIŞ TESTİ (PLAYGROUND) ── */}
          <div
            className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-3 relative overflow-hidden ${
              isTactile ? 'bg-[#13111c] border-amber-500/20 shadow-inner' : 'bg-black/40 border-white/10 shadow-inner'
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold">
              <span className="text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Canlı Maskot Davranış Testi</span>
              </span>
              <span className="text-[10px] text-white/50">Robota dokunup tepkisini dinleyin!</span>
            </div>

            <div className="py-2 flex items-center justify-center min-h-[160px]">
              <TermoBotMascot
                state={previewState}
                themeMode={themeMode}
                currentTemp={currentTemp}
                targetTemp={targetTemp}
                isKombiActive={isKombiActive}
                size="md"
                interactive={true}
              />
            </div>

            {/* State Switcher Buttons */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap w-full pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSelectState('idle')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  previewState === 'idle' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <span>🟢 Boşta</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('reading')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  previewState === 'reading' ? 'bg-blue-500 text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Kitap Okuma</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('sleeping')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  previewState === 'sleeping' ? 'bg-indigo-500 text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Uykuda (Zzz)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('happy')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  previewState === 'happy' ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <Heart className="w-3 h-3 fill-current text-rose-300" />
                <span>Dokun & Sev!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
