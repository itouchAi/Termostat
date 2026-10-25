import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Cloud,
  Key,
  Check,
  ShieldCheck,
  Database,
  Lock,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Bell,
  BellOff,
  ShieldAlert,
  Send,
  Zap,
  Monitor,
  Tv,
  Music,
  Image as ImageIcon,
  Sliders,
  Moon,
  Sun,
  Play,
  Upload,
  Link,
  FileVideo,
  Volume2,
  Layers,
  Activity,
  Maximize,
} from 'lucide-react';
import { translations, type Language } from '../utils/i18n.ts';
import type { SmartDisplayConfig } from '../types/smartDisplay.ts';
import type { ThemeMode } from '../types.ts';
import { type ObsidianPalette, getObsidianPalette } from '../utils/obsidianPalettes.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbUrl: string;
  apiKey: string;
  onSaveCloudSettings: (dbUrl: string, apiKey: string) => void;
  isConnected: boolean;
  onOpenVaultModal?: () => void;
  onOpenGoogleHomeModal?: () => void;
  onResetHistoricalData?: () => void;
  lang?: Language;
  isWeatherNotificationsEnabled?: boolean;
  onToggleWeatherNotifications?: (enabled: boolean) => void;
  onTriggerTestNotification?: () => void;
  smartDisplayConfig?: SmartDisplayConfig;
  onUpdateSmartDisplayConfig?: (cfg: Partial<SmartDisplayConfig>) => void;
  onLaunchSmartDisplay?: () => void;
  themeMode?: ThemeMode;
  obsidianPalette?: ObsidianPalette;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dbUrl,
  apiKey,
  onSaveCloudSettings,
  isConnected,
  onOpenVaultModal,
  onOpenGoogleHomeModal,
  onResetHistoricalData,
  lang = 'tr',
  isWeatherNotificationsEnabled = true,
  onToggleWeatherNotifications,
  onTriggerTestNotification,
  smartDisplayConfig,
  onUpdateSmartDisplayConfig,
  onLaunchSmartDisplay,
  themeMode = 'glass',
  obsidianPalette,
}) => {
  const t = translations[lang] || translations.tr;
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const isTactile = themeMode === 'tactile_deck';
  const palette = obsidianPalette || getObsidianPalette(3);
  const [localUrl, setLocalUrl] = useState(dbUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  // Critical alerts toggle
  const [isCriticalAlertsEnabled, setIsCriticalAlertsEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedVal = localStorage.getItem('notifications_critical_alerts');
      return savedVal !== 'false';
    }
    return true;
  });

  const [testSent, setTestSent] = useState<boolean>(false);

  const handleToggleCritical = (enabled: boolean) => {
    setIsCriticalAlertsEnabled(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notifications_critical_alerts', String(enabled));
    }
  };

  const handleTriggerTest = () => {
    onTriggerTestNotification?.();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  // Reset confirmation state
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSave = () => {
    onSaveCloudSettings(localUrl.trim(), localKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  const handleExecuteReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('smart_thermostat_historical_db_v2');
        localStorage.removeItem('daily_costs');
        localStorage.removeItem('gas_consumption_history');
        localStorage.removeItem('hourly_telemetry_logs');
        localStorage.setItem('live_daily_active_seconds', '0');
        localStorage.setItem('kombi_last_ignition_ts', String(Date.now()));
        localStorage.setItem('kombi_last_extinguish_ts', String(Date.now()));
        window.dispatchEvent(new Event('thermostat_history_reset'));
      } catch {}
    }
    onResetHistoricalData?.();
    setResetSuccess(true);
    setIsConfirmingReset(false);
    setTimeout(() => {
      setResetSuccess(false);
    }, 2800);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        style={
          isObsidian
            ? {
                boxShadow: `0 25px 70px rgba(0,0,0,0.95), 0 0 50px ${palette.cardGlow}`,
                borderColor: palette.cardBorder,
              }
            : isTactile
            ? {
                boxShadow: '0 25px 70px rgba(0,0,0,0.98), 0 0 35px rgba(255,140,50,0.18)',
              }
            : undefined
        }
        className={`rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.18] border-r border-black/70 border-b-2 border-b-black/85 text-white backdrop-blur-2xl'
            : isTactile
            ? 'bg-[#161422]/98 border-t border-l border-white/[0.18] border-r border-black/80 border-b-2 border-b-black/95 text-white backdrop-blur-2xl'
            : isGlass
            ? 'bg-slate-950/75 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 sm:pb-4 border-b shrink-0 ${
            isObsidian
              ? 'border-white/[0.08]'
              : isGlass
              ? 'border-white/15'
              : 'border-slate-100 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={
                isObsidian
                  ? {
                      borderColor: palette.borderUnder,
                      color: palette.textColor,
                      background: `linear-gradient(135deg, ${palette.hex}25, ${palette.ringColor}15)`,
                    }
                  : undefined
              }
              className={`p-2 rounded-xl ${
                isObsidian
                  ? 'border shadow-xs'
                  : isGlass
                  ? 'bg-white/10 text-sky-300 border border-white/15 backdrop-blur-md'
                  : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className={`text-base font-bold ${
                  isObsidian || isGlass ? 'text-white' : 'text-slate-800 dark:text-white'
                }`}
              >
                {t.settingsModalTitle}
              </h2>
              <p
                className={`text-xs ${
                  isObsidian
                    ? 'text-[#c3b6e8]'
                    : isGlass
                    ? 'text-white/70'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.settingsModalSub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all ${
              isObsidian
                ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                : isGlass
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* ── ŞİFRELİ KASA & BİLDİRİMLER LİNKİ ── */}
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs ${
              isObsidian
                ? 'bg-[#181427] border border-amber-500/25 text-white'
                : isGlass
                ? 'bg-amber-500/10 border border-amber-400/25 backdrop-blur-md text-white'
                : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-indigo-950/40 border border-amber-400/40 dark:border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div
                  className={`font-bold text-xs flex items-center gap-1.5 truncate ${
                    isObsidian || isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  <span>{t.vaultCardTitle}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    AES-256
                  </span>
                </div>
                <p
                  className={`text-[10px] truncate ${
                    isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t.vaultCardSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVaultModal?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
              title="Şifreli kasa ve bildirim pop-up penceresini aç"
            >
              <span>{t.openVault}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── GOOGLE HOME & ASİSTAN ENTEGRASYONU ── */}
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs ${
              isObsidian
                ? 'bg-[#181427] border border-blue-500/25 text-white'
                : isGlass
                ? 'bg-blue-500/10 border border-blue-400/25 backdrop-blur-md text-white'
                : 'bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-amber-500/10 dark:from-blue-950/40 dark:via-emerald-950/30 dark:to-amber-950/40 border border-blue-400/40 dark:border-blue-500/30'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                <span className="text-sm">🏠</span>
              </div>
              <div className="min-w-0">
                <div
                  className={`font-bold text-xs flex items-center gap-1.5 truncate ${
                    isObsidian || isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  <span>{t.googleHomeTitle}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    {t.googleHomeBadge}
                  </span>
                </div>
                <p
                  className={`text-[10px] truncate ${
                    isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t.googleHomeSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoogleHomeModal?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
              title="Google Home entegrasyonu ve simülatörünü aç"
            >
              <span>Yönet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── SMART DISPLAY & AMBİYANS MODU (Tablet / Masaüstü Ekranı) ── */}
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-3 shadow-xs ${
              isObsidian
                ? 'bg-[#181427] border border-purple-500/25 text-white'
                : isGlass
                ? 'bg-purple-500/10 border border-purple-400/25 backdrop-blur-md text-white'
                : 'bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-purple-400/40 dark:border-purple-500/30'
            }`}
          >
            {/* Header with Master Toggle */}
            <div
              className={`flex items-center justify-between pb-2 border-b ${
                isObsidian
                  ? 'border-white/[0.08]'
                  : isGlass
                  ? 'border-white/15'
                  : 'border-purple-200/50 dark:border-purple-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                    <span>Smart Display & Ambiyans</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      Tablet / PC
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Masaüstü veya duvarda canlı saat, hava ve medya ekranı
                  </p>
                </div>
              </div>

              {/* Master Opt-in Switch (Kullanıcı onay tiki) */}
              <button
                type="button"
                onClick={() =>
                  onUpdateSmartDisplayConfig?.({
                    enabled: !smartDisplayConfig?.enabled,
                  })
                }
                style={
                  smartDisplayConfig?.enabled && isObsidian
                    ? {
                        background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                        borderColor: palette.borderUnder,
                        boxShadow: `0 2px 10px ${palette.glow}`,
                      }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 ${
                  smartDisplayConfig?.enabled
                    ? isObsidian
                      ? 'text-white border-t border-l border-white/25 border-r border-b'
                      : 'bg-purple-600 text-white shadow-purple-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Smart Display özelliğini aç veya kapat"
              >
                <span>{smartDisplayConfig?.enabled ? 'Açık ✓' : 'Kapalı'}</span>
              </button>
            </div>

            {/* Smart Display Expanded Settings (Visible only when enabled) */}
            {smartDisplayConfig?.enabled && (
              <div className="flex flex-col gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Launch Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchSmartDisplay?.();
                  }}
                  style={
                    isObsidian
                      ? {
                          background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                          borderColor: palette.borderUnder,
                          boxShadow: `0 4px 14px rgba(0,0,0,0.6), 0 0 14px ${palette.glow}`,
                        }
                      : undefined
                  }
                  className={`w-full py-2.5 px-4 rounded-xl active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    isObsidian
                      ? 'border-t border-l border-white/25 border-r border-b'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
                  }`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Smart Display'i Şimdi Başlat (Tam Ekran)</span>
                </button>

                {/* 1. Görüntü / Medya Modu Seçimi */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-purple-500" />
                    <span>Ekran Modu:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {[
                      { id: 'aod', label: '🌙 Always-On Display (AOD)', desc: 'Siyah Ekran + Büyük Saat + Hava' },
                      { id: 'video_audio_muted_mp3', label: '🎬 Sessiz Video + MP3', desc: 'Canlı arka plan + ortam müziği' },
                      { id: 'video', label: '🔥 Canlı Video / Doğa', desc: 'Şömine & canlı doğa döngüsü' },
                      { id: 'slideshow', label: '🖼️ Slayt Gösterisi', desc: 'Fotoğraflar arası otomatik geçiş' },
                      { id: 'image', label: '📸 Tekli Görsel', desc: 'Sakin sabit fotoğraf' },
                    ].map((m) => {
                      const isSelected = (smartDisplayConfig.mode || 'aod') === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            onUpdateSmartDisplayConfig?.({
                              mode: m.id as any,
                            })
                          }
                          style={
                            isSelected && isObsidian
                              ? {
                                  background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                                  borderColor: palette.borderUnder,
                                  boxShadow: `0 2px 10px ${palette.glow}`,
                                }
                              : undefined
                          }
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? isObsidian
                                ? 'text-white border-t border-l border-white/25 border-r border-b font-bold'
                                : 'bg-purple-600 text-white border-purple-500 shadow-xs font-bold'
                              : 'bg-white/80 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="truncate font-semibold">{m.label}</div>
                          <div
                            className={`text-[9px] truncate mt-0.5 ${
                              isSelected ? 'text-purple-100' : 'text-slate-400'
                            }`}
                          >
                            {m.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Slayt & Görsel Geçiş Ayarları */}
                {(smartDisplayConfig.mode === 'slideshow' || smartDisplayConfig.mode === 'image') && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-300 dark:border-purple-800/60 flex flex-col gap-2">
                    <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300">
                      {smartDisplayConfig.mode === 'slideshow' ? 'Slayt Süresi & Geçiş Efekti' : 'Görsel Geçiş Efekti'}
                    </span>
                    <div className={smartDisplayConfig.mode === 'slideshow' ? 'grid grid-cols-2 gap-2 text-[10px]' : 'flex flex-col text-[10px]'}>
                      {smartDisplayConfig.mode === 'slideshow' && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block mb-1">
                            Slayt Değişim Süresi:
                          </span>
                          <div className="flex gap-1">
                            {[5, 10, 15, 30].map((sec) => (
                              <button
                                key={sec}
                                type="button"
                                onClick={() =>
                                  onUpdateSmartDisplayConfig?.({
                                    slideshowIntervalSec: sec,
                                  })
                                }
                                className={`flex-1 py-1 rounded-lg font-bold ${
                                  smartDisplayConfig.slideshowIntervalSec === sec
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {sec}s
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block mb-1">
                          Geçiş Efekti (Fade / Kayma / Zoom):
                        </span>
                        <div className="flex gap-1">
                          {[
                            { id: 'fade', label: 'Fade' },
                            { id: 'slide', label: 'Kayma' },
                            { id: 'zoom', label: 'Zoom' },
                          ].map((eff) => (
                            <button
                              key={eff.id}
                              type="button"
                              onClick={() =>
                                onUpdateSmartDisplayConfig?.({
                                  slideTransition: eff.id as any,
                                })
                              }
                              className={`flex-1 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                                smartDisplayConfig.slideTransition === eff.id
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {eff.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Görsel / Video Teması & Çoklu Medya Seçimi */}
                {smartDisplayConfig.mode !== 'aod' && (
                  <div className="flex flex-col gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>Görsel / Video Teması:</span>
                      </label>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {smartDisplayConfig.mode === 'image' ? '📸 Tekli Görsel' : '🎬 Canlı / Hareketli'}
                      </span>
                    </div>

                    {/* Dahili Tema Seçenekleri */}
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {[
                        { id: 'fireplace', label: '🔥 Şömine Alevi' },
                        { id: 'rainy_window', label: '🌧️ Yağmurlu Cam' },
                        { id: 'winter_snow', label: '❄️ Kış & Kar' },
                        { id: 'sunset_forest', label: '🌲 Gün Batımı' },
                        { id: 'aurora', label: '🌌 Kutup Işıkları' },
                        { id: 'minimal_black', label: '🌑 Minimal Siyah' },
                        { id: 'custom', label: '📁 Dışarıdan Medya' },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() =>
                            onUpdateSmartDisplayConfig?.({
                              presetTheme: th.id as any,
                            })
                          }
                          className={`p-1.5 rounded-lg border text-center transition-all truncate font-semibold cursor-pointer ${
                            smartDisplayConfig.presetTheme === th.id
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                              : 'bg-white/90 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {th.label}
                        </button>
                      ))}
                    </div>

                    {/* Görsel Yerleşim Modu: Oto / Fit / Stretch (User requested) */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Maximize className="w-3 h-3 text-indigo-500" />
                        Görsel Yerleşim Modu:
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        {[
                          { id: 'cover', label: '🖼️ Oto (Cover)', desc: 'Ekranı doldur' },
                          { id: 'contain', label: '📐 Fit (Sığdır)', desc: 'Orantılı tam boy' },
                          { id: 'fill', label: '↔️ Stretch (Uzat)', desc: 'Ekran boyu esnet' },
                        ].map((fit) => (
                          <button
                            key={fit.id}
                            type="button"
                            onClick={() =>
                              onUpdateSmartDisplayConfig?.({
                                imageFitMode: fit.id as any,
                              })
                            }
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                              (smartDisplayConfig.imageFitMode || 'cover') === fit.id
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <div className="truncate">{fit.label}</div>
                            <div className="text-[8px] opacity-75 font-normal truncate mt-0.5">
                              {fit.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dışarıdan Çoklu Video / Görsel Yükleme Paneli */}
                    {(smartDisplayConfig.presetTheme === 'custom' ||
                      (smartDisplayConfig.customImages && smartDisplayConfig.customImages.length > 0) ||
                      (smartDisplayConfig.customVideos && smartDisplayConfig.customVideos.length > 0) ||
                      smartDisplayConfig.customImageUrl ||
                      smartDisplayConfig.customVideoUrl) && (
                      <div className="mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 flex flex-col gap-2.5 animate-in fade-in">
                        {/* Çoklu Video Seçimi (Video modları için) */}
                        {(smartDisplayConfig.mode === 'video' ||
                          smartDisplayConfig.mode === 'video_audio_muted_mp3') && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <FileVideo className="w-3 h-3 text-indigo-500" />
                                Çoklu Video Oynatma Listesi:
                              </span>
                              <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {smartDisplayConfig.customVideos?.length || 0} Video
                              </span>
                            </div>

                            {/* Video listesi */}
                            {smartDisplayConfig.customVideos && smartDisplayConfig.customVideos.length > 0 && (
                              <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                                {smartDisplayConfig.customVideos.map((vid, idx) => (
                                  <div
                                    key={vid.id || idx}
                                    className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded text-[9px] font-medium border border-slate-200 dark:border-slate-700"
                                  >
                                    <span className="truncate flex-1 min-w-0 pr-1">
                                      {idx + 1}. {vid.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = smartDisplayConfig.customVideos.filter(
                                          (_, i) => i !== idx
                                        );
                                        onUpdateSmartDisplayConfig?.({ customVideos: updated });
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                                      title="Videoyu Listeden Sil"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Video URL'si veya çoklu dosya seçin..."
                                value={smartDisplayConfig.customVideoUrl || ''}
                                onChange={(e) =>
                                  onUpdateSmartDisplayConfig?.({
                                    customVideoUrl: e.target.value,
                                    presetTheme: 'custom',
                                  })
                                }
                                className="flex-1 px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                              <label className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                                <Upload className="w-2.5 h-2.5" />
                                <span>Çoklu Video Seç</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="video/*,video/mp4,video/webm,video/ogg,video/quicktime"
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      const newVideos = Array.from(files).map((f) => ({
                                        id: Math.random().toString(36).substring(2, 9),
                                        name: f.name,
                                        url: URL.createObjectURL(f),
                                      }));
                                      onUpdateSmartDisplayConfig?.({
                                        customVideos: [
                                          ...(smartDisplayConfig.customVideos || []),
                                          ...newVideos,
                                        ],
                                        mode: 'video',
                                        presetTheme: 'custom',
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Çoklu Görsel / Slayt Seçimi (Görsel ve Slayt modları için) */}
                        {(smartDisplayConfig.mode === 'image' ||
                          smartDisplayConfig.mode === 'slideshow') && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-blue-500" />
                                Çoklu Görsel & Slayt Listesi:
                              </span>
                              <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400">
                                {smartDisplayConfig.customImages?.length || 0} Görsel Yüklendi
                              </span>
                            </div>

                            {/* Yüklenen görsellerin küçük resim listesi */}
                            {smartDisplayConfig.customImages && smartDisplayConfig.customImages.length > 0 && (
                              <div className="max-h-28 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                                {smartDisplayConfig.customImages.map((img, idx) => (
                                  <div
                                    key={img.id || idx}
                                    className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded text-[9px] font-medium border border-slate-200 dark:border-slate-700 gap-1.5"
                                  >
                                    <img
                                      src={img.url}
                                      alt="Önizleme"
                                      className="w-5 h-5 rounded object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                                    />
                                    <span className="truncate flex-1 min-w-0">{img.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = smartDisplayConfig.customImages.filter(
                                          (_, i) => i !== idx
                                        );
                                        onUpdateSmartDisplayConfig?.({ customImages: updated });
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer shrink-0"
                                      title="Görseli Listeden Sil"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Görsel URL'si veya çoklu fotoğraf seçin..."
                                value={smartDisplayConfig.customImageUrl || ''}
                                onChange={(e) =>
                                  onUpdateSmartDisplayConfig?.({
                                    customImageUrl: e.target.value,
                                    presetTheme: 'custom',
                                  })
                                }
                                className="flex-1 px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                              <label className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                                <Upload className="w-2.5 h-2.5" />
                                <span>Çoklu Görsel Seç</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const fileList = e.target.files;
                                    if (fileList && fileList.length > 0) {
                                      const files = Array.from(fileList);
                                      const readPromises = files.map((file) => {
                                        return new Promise<{ id: string; name: string; url: string }>((resolve) => {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            const dataUrl = ev.target?.result as string;
                                            resolve({
                                              id: Math.random().toString(36).substring(2, 9),
                                              name: file.name,
                                              url: dataUrl || URL.createObjectURL(file),
                                            });
                                          };
                                          reader.onerror = () => {
                                            resolve({
                                              id: Math.random().toString(36).substring(2, 9),
                                              name: file.name,
                                              url: URL.createObjectURL(file),
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      });

                                      const newItems = await Promise.all(readPromises);
                                      onUpdateSmartDisplayConfig?.({
                                        customImages: [
                                          ...(smartDisplayConfig.customImages || []),
                                          ...newItems,
                                        ],
                                        mode: 'slideshow',
                                        presetTheme: 'custom',
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Arka Plan Sesi / MP3 Müzik & Çoklu MP3 & Ekolayzır & Kayan Yazı */}
                <div className="flex flex-col gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-pink-500" />
                      <span>Ortam Sesi & MP3 Çalma Listesi:</span>
                    </label>
                    <span className="text-[9px] font-mono text-pink-600 dark:text-pink-400">
                      Ses: %{Math.round((smartDisplayConfig.audioVolume ?? 0.5) * 100)}
                    </span>
                  </div>

                  {/* MP3 Parça Listesi */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    {[
                      { id: 'none', label: '🔇 Sessiz' },
                      { id: 'fireplace', label: '🪵 Şömine Çıtırtısı' },
                      { id: 'rain', label: '🌧️ Sakin Yağmur' },
                      { id: 'lofi', label: '🎧 Lofi Akustik' },
                      { id: 'relax_piano', label: '🎹 Relax Piyano' },
                      { id: 'nature', label: '🌲 Doğa & Kuşlar' },
                      { id: 'custom', label: '🎵 Dışarıdan MP3' },
                    ].map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() =>
                          onUpdateSmartDisplayConfig?.({
                            audioTrack: tr.id as any,
                          })
                        }
                        className={`p-1.5 rounded-lg border text-center transition-all truncate font-semibold cursor-pointer ${
                          (smartDisplayConfig.audioTrack || 'none') === tr.id
                            ? 'bg-pink-600 text-white border-pink-500 shadow-xs'
                            : 'bg-white/90 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>

                  {/* Dışarıdan Çoklu MP3 Yükleme Paneli */}
                  {smartDisplayConfig.audioTrack === 'custom' && (
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/60 flex flex-col gap-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          Çoklu MP3 Müzik Listesi:
                        </span>
                        <span className="text-[9px] font-mono font-bold text-pink-600">
                          {smartDisplayConfig.customAudioTracks?.length || 0} Parça
                        </span>
                      </div>

                      {/* Çoklu parça listesi */}
                      {smartDisplayConfig.customAudioTracks && smartDisplayConfig.customAudioTracks.length > 0 && (
                        <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                          {smartDisplayConfig.customAudioTracks.map((trk, idx) => (
                            <div
                              key={trk.id || idx}
                              className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded text-[9px] font-medium border border-slate-200 dark:border-slate-700"
                            >
                              <span className="truncate flex-1 min-w-0 pr-1">
                                {idx + 1}. {trk.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = smartDisplayConfig.customAudioTracks.filter(
                                    (_, i) => i !== idx
                                  );
                                  onUpdateSmartDisplayConfig?.({ customAudioTracks: updated });
                                }}
                                className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                                title="Parçayı Listeden Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="https://example.com/muzik.mp3 veya dosya seçin..."
                          value={smartDisplayConfig.customAudioUrl || ''}
                          onChange={(e) =>
                            onUpdateSmartDisplayConfig?.({
                              customAudioUrl: e.target.value,
                            })
                          }
                          className="flex-1 px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                        <label className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                          <Upload className="w-2.5 h-2.5" />
                          <span>Çoklu MP3 Seç</span>
                          <input
                            type="file"
                            multiple
                            accept="audio/mp3,audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                const newTracks = Array.from(files).map((f) => ({
                                  id: Math.random().toString(36).substring(2, 9),
                                  name: f.name.replace(/\.[^/.]+$/, ''),
                                  url: URL.createObjectURL(f),
                                }));
                                onUpdateSmartDisplayConfig?.({
                                  customAudioTracks: [
                                    ...(smartDisplayConfig.customAudioTracks || []),
                                    ...newTracks,
                                  ],
                                  audioTrack: 'custom',
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Kayan Yazı Şarkı İsmi Seçeneği (Aç / Kapa - User requested) */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Üst Kayan Yazı Şarkı İsmi
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Ekranın üstünde çalan parçayı kayan bant olarak gösterir
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSmartDisplayConfig?.({
                          showMarqueeTrackTitle: !smartDisplayConfig.showMarqueeTrackTitle,
                        })
                      }
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition-all ${
                        smartDisplayConfig.showMarqueeTrackTitle !== false
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {smartDisplayConfig.showMarqueeTrackTitle !== false ? 'Açık' : 'Kapalı'}
                    </button>
                  </div>

                  {/* Canlı Müzik Ekolayzır Modu & Tema Seçimi (User requested) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-purple-500" />
                          Canlı Müzik Ekolayzır Modu
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Açıkken arka plan hafif blur olur, ekolayzır ön planda parlar
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSmartDisplayConfig?.({
                            equalizerEnabled: !smartDisplayConfig.equalizerEnabled,
                          })
                        }
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition-all ${
                          smartDisplayConfig.equalizerEnabled
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {smartDisplayConfig.equalizerEnabled ? 'Aktif' : 'Pasif'}
                      </button>
                    </div>

                    {/* Ekolayzır Temaları */}
                    {smartDisplayConfig.equalizerEnabled && (
                      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                        <span className="text-[9px] font-bold text-slate-500">
                          Ekolayzır Stili:
                        </span>
                        <div className="grid grid-cols-3 gap-1 text-[10px]">
                          {[
                            { id: 'bars', label: '📊 Neon Barlar' },
                            { id: 'wave', label: '🌊 Sıvı Akış' },
                            { id: 'pulse', label: '💫 Nabız Halka' },
                          ].map((eq) => (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() =>
                                onUpdateSmartDisplayConfig?.({
                                  equalizerStyle: eq.id as any,
                                })
                              }
                              className={`py-1 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                                (smartDisplayConfig.equalizerStyle || 'bars') === eq.id
                                  ? 'bg-purple-600 text-white border-purple-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {eq.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ses Seviyesi Slider */}
                  {smartDisplayConfig.audioTrack !== 'none' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Volume2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={smartDisplayConfig.audioVolume ?? 0.5}
                        onChange={(e) =>
                          onUpdateSmartDisplayConfig?.({
                            audioVolume: Number(e.target.value),
                          })
                        }
                        className="flex-1 accent-pink-600 cursor-pointer h-1.5 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Ekran Aydınlık Ayarı & Canlı Önizleme */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Dahili Ekran Aydınlık Ayarı
                    </span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-black">
                      %{smartDisplayConfig.brightnessPercent || 85}
                    </span>
                  </div>

                  {/* Canlı Ekran Aydınlığı Simülasyonu (Kullanıcının çalıştığını görmesi için) */}
                  <div
                    className="relative w-full h-16 rounded-xl bg-black overflow-hidden border border-slate-700/50 flex items-center justify-between px-3 text-white transition-all duration-200 shadow-inner"
                    style={{
                      filter: `brightness(${smartDisplayConfig.brightnessPercent || 85}%)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black tracking-tight text-white">
                        22:45
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">00</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 text-[10px]">
                      <span>🌤️ 18°C</span>
                      <span className="text-amber-400 font-bold">• 22.5°C</span>
                    </div>

                    <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-400">
                      Canlı Aydınlık: %{smartDisplayConfig.brightnessPercent || 85}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={smartDisplayConfig.brightnessPercent || 85}
                    onChange={(e) =>
                      onUpdateSmartDisplayConfig?.({
                        brightnessPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg"
                  />

                  {/* Hızlı Aydınlık Butonları */}
                  <div className="flex gap-1 text-[9px]">
                    {[
                      { pct: 20, label: '🌙 Gece (%20)' },
                      { pct: 50, label: '🌆 Loş (%50)' },
                      { pct: 85, label: '☀️ Normal (%85)' },
                      { pct: 100, label: '⚡ Tam (%100)' },
                    ].map((btn) => (
                      <button
                        key={btn.pct}
                        type="button"
                        onClick={() =>
                          onUpdateSmartDisplayConfig?.({
                            brightnessPercent: btn.pct,
                          })
                        }
                        className={`flex-1 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          smartDisplayConfig.brightnessPercent === btn.pct
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Ekran Kapanma / Uyku Süresi */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    Ekran Uyku / Kapanma Süresi
                  </span>
                  <div className="flex gap-1.5 text-[10px]">
                    {[
                      { min: 0, label: 'Sürekli Açık' },
                      { min: 1, label: '1 Dk' },
                      { min: 5, label: '5 Dk' },
                      { min: 15, label: '15 Dk' },
                      { min: 30, label: '30 Dk' },
                    ].map((tmo) => (
                      <button
                        key={tmo.min}
                        type="button"
                        onClick={() =>
                          onUpdateSmartDisplayConfig?.({
                            sleepTimeoutMin: tmo.min,
                          })
                        }
                        className={`flex-1 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                          smartDisplayConfig.sleepTimeoutMin === tmo.min
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {tmo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. OLED Burn-In Koruması */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      OLED Piksel Koruma
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Saati 60 saniyede bir hafif kaydırarak ekranı korur
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSmartDisplayConfig?.({
                        burnInProtection: !smartDisplayConfig.burnInProtection,
                      })
                    }
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      smartDisplayConfig.burnInProtection
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {smartDisplayConfig.burnInProtection ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── BİLDİRİM AYARLARI & OTOMASYON (3 Saatlik & Acil Emniyet Bildirimleri) ── */}
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-3 shadow-xs ${
              isObsidian
                ? 'bg-[#181427] border border-white/[0.08] text-white'
                : isGlass
                ? 'bg-white/[0.06] border border-white/15 backdrop-blur-md text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-2 border-b ${
                isObsidian
                  ? 'border-white/[0.08]'
                  : isGlass
                  ? 'border-white/15'
                  : 'border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4
                    className={`font-bold text-xs ${
                      isObsidian || isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {t.notifSectionTitle}
                  </h4>
                  <p
                    className={`text-[10px] ${
                      isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {t.notifSectionSub}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Otomatik 3 Saatlik Bildirim Switch & Test Butonu */}
            <div
              className={`p-2.5 rounded-xl flex flex-col gap-2 ${
                isObsidian
                  ? 'bg-[#1e1930] border border-white/[0.08]'
                  : isGlass
                  ? 'bg-white/[0.08] border border-white/15'
                  : 'bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-750'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWeatherNotificationsEnabled ? (
                    <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`font-bold text-xs ${
                      isObsidian || isGlass ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t.notif3hTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleWeatherNotifications?.(!isWeatherNotificationsEnabled)}
                  style={
                    isWeatherNotificationsEnabled && isObsidian
                      ? {
                          background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                          borderColor: palette.borderUnder,
                          boxShadow: `0 2px 10px ${palette.glow}`,
                        }
                      : undefined
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isWeatherNotificationsEnabled
                      ? isObsidian
                        ? 'text-white border-t border-l border-white/25 border-r border-b'
                        : 'bg-amber-500 text-white shadow-xs'
                      : isObsidian || isGlass
                      ? 'bg-white/10 text-white/60 hover:bg-white/15'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isWeatherNotificationsEnabled ? t.notifActive : t.notifInactive}
                </button>
              </div>

              <p
                className={`text-[10px] leading-relaxed ${
                  isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.notif3hDesc}
              </p>

              <div
                className={`flex items-center justify-between pt-1 border-t ${
                  isObsidian
                    ? 'border-white/[0.08]'
                    : isGlass
                    ? 'border-white/15'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className="text-[10px] font-mono text-amber-500 dark:text-amber-400 font-semibold">
                  ⏱️ Periyot: 3 Saatte Bir (Otomatik)
                </span>
                <button
                  type="button"
                  onClick={handleTriggerTest}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-amber-400/30"
                  title="Test bildirimi simülasyonu çalıştır"
                >
                  <Send className="w-3 h-3" />
                  <span>{testSent ? 'Bildirim Gönderildi!' : t.notifTestBtn}</span>
                </button>
              </div>
            </div>

            {/* 2. Acil & Kritik Güvenlik Bildirimleri Switch */}
            <div
              className={`p-2.5 rounded-xl flex flex-col gap-2 ${
                isObsidian
                  ? 'bg-[#1e1930] border border-white/[0.08]'
                  : isGlass
                  ? 'bg-white/[0.08] border border-white/15'
                  : 'bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-750'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span
                    className={`font-bold text-xs ${
                      isObsidian || isGlass ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t.notifCriticalTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCritical(!isCriticalAlertsEnabled)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isCriticalAlertsEnabled
                      ? 'bg-rose-600 text-white shadow-xs'
                      : isObsidian || isGlass
                      ? 'bg-white/10 text-white/60 hover:bg-white/15'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isCriticalAlertsEnabled ? t.notifActive : t.notifInactive}
                </button>
              </div>

              <p
                className={`text-[10px] leading-relaxed ${
                  isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.notifCriticalDesc}
              </p>

              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Basınç & Donma Koruma İzleyicisi Devrede</span>
              </div>
            </div>
          </div>

          {/* ── GEÇMİŞ VERİLERİ SIFIRLAMA BÖLÜMÜ (İstenen Özellik) ── */}
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 ${
              isObsidian
                ? 'bg-rose-950/25 border border-rose-500/30 text-white'
                : isGlass
                ? 'bg-rose-500/10 border border-rose-400/25 backdrop-blur-md text-white'
                : 'bg-rose-500/10 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-rose-500 dark:text-rose-300 block">
                  {t.resetDataSectionTitle}
                </span>
                <p
                  className={`text-[10px] leading-relaxed mt-0.5 ${
                    isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.resetDataWarning}
                </p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 justify-center">
                <Check className="w-4 h-4" />
                <span>{t.resetDataSuccess}</span>
              </div>
            ) : isConfirmingReset ? (
              <div
                className={`flex items-center gap-2 pt-1 border-t ${
                  isObsidian
                    ? 'border-rose-900/60'
                    : isGlass
                    ? 'border-rose-400/20'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  Evet, Tümünü Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className={`py-1.5 px-3 rounded-xl font-semibold text-xs cursor-pointer ${
                    isObsidian
                      ? 'bg-[#1e1930] text-slate-300 hover:bg-[#2b2542]'
                      : isGlass
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full py-2 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600 hover:text-white text-rose-500 dark:text-rose-400 font-bold text-xs border border-rose-300/60 dark:border-rose-700/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.resetDataBtn}</span>
              </button>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between ${
              isObsidian
                ? 'bg-[#181427] border border-white/[0.08] text-white'
                : isGlass
                ? 'bg-white/[0.06] border border-white/15 backdrop-blur-md text-white'
                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={
                isObsidian
                  ? 'text-[#c3b6e8] font-medium'
                  : isGlass
                  ? 'text-white/80 font-medium'
                  : 'text-slate-600 dark:text-slate-300 font-medium'
              }
            >
              Bulut Senkronizasyon Durumu:
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isConnected ? t.cloudSyncConnected : t.cloudSyncOffline}
            </span>
          </div>

          <div>
            <label
              className={`font-semibold block mb-1.5 flex items-center gap-1.5 ${
                isObsidian || isGlass ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              {t.firebaseUrlLabel}
            </label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="https://kombi-projeniz-rtdb.firebaseio.com"
              className={`w-full px-3 py-2 rounded-xl font-mono focus:outline-none transition-all ${
                isObsidian
                  ? 'bg-[#1a162b] border border-white/[0.12] text-white placeholder-slate-500 focus:border-[#8261e6] focus:ring-1 focus:ring-[#8261e6]'
                  : isGlass
                  ? 'bg-white/[0.08] border border-white/20 text-white placeholder-slate-400 focus:ring-1 focus:ring-sky-400'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>

          <div>
            <label
              className={`font-semibold block mb-1.5 flex items-center gap-1.5 ${
                isObsidian || isGlass ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              {t.firebaseKeyLabel}
            </label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSyDMULZx..."
              className={`w-full px-3 py-2 rounded-xl font-mono focus:outline-none transition-all ${
                isObsidian
                  ? 'bg-[#1a162b] border border-white/[0.12] text-white placeholder-slate-500 focus:border-[#8261e6] focus:ring-1 focus:ring-[#8261e6]'
                  : isGlass
                  ? 'bg-white/[0.08] border border-white/20 text-white placeholder-slate-400 focus:ring-1 focus:ring-sky-400'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>

          <div
            className={`p-3 rounded-xl border flex items-start gap-2 ${
              isObsidian
                ? 'bg-[#1e1930] border-purple-500/25 text-purple-200'
                : isGlass
                ? 'bg-sky-500/10 border-sky-400/25 text-sky-200'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Firebase yapılandırmanız ve sıcaklık programlarınız yerel AES-256 kasasında saklanır.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`pt-3 sm:pt-4 border-t flex items-center justify-end gap-2 shrink-0 ${
            isObsidian
              ? 'border-white/[0.08]'
              : isGlass
              ? 'border-white/15'
              : 'border-slate-100 dark:border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              isObsidian
                ? 'text-[#c3b6e8] hover:bg-white/[0.08] hover:text-white'
                : isGlass
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={
              isObsidian
                ? {
                    background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                    borderColor: palette.borderUnder,
                    boxShadow: `0 6px 18px rgba(0,0,0,0.7), 0 0 14px ${palette.glow}`,
                  }
                : undefined
            }
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 ${
              isObsidian
                ? 'border-t border-l border-white/25 border-r border-b'
                : isGlass
                ? 'bg-white/20 hover:bg-white/30 border border-white/25 backdrop-blur-md shadow-md'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                {t.settingsSaved}
              </>
            ) : (
              t.saveSettings
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
