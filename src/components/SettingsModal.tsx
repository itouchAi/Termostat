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
  Smartphone,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { triggerHaptic, isHapticSupported, getHapticsEnabled, setHapticsEnabled, type HapticFeedbackType } from '../utils/haptics.ts';
import { translations, type Language } from '../utils/i18n.ts';
import type { SmartDisplayConfig } from '../types/smartDisplay.ts';
import type { ThemeMode } from '../types.ts';
import { type ObsidianPalette, getObsidianPalette } from '../utils/obsidianPalettes.ts';
import type { MascotConfig } from '../types/mascot.ts';
import { MascotSettingsSection } from './Settings/MascotSettingsSection.tsx';
import { EspDiagnosticsSection } from './Settings/EspDiagnosticsSection.tsx';
import { SmartDisplaySettingsSection } from './Settings/SmartDisplaySettingsSection.tsx';

export const DEFAULT_SETTINGS_MENU_ORDER: string[] = [
  'vault',          // 1. Şifreli Kasa & Bildirimler (Image 1 top)
  'google_home',    // 2. Google Home & Asistan (Image 1 bottom)
  'smart_display',  // 3. Smart Display & Ambiyans (Images 2, 3, 4, 5, 6)
  'notifications',  // 4. Bildirim Ayarları & Otomasyon (Image 7)
  'haptics',        // 5. Haptik Titreşim & Dokunma (Image 8)
  'boot_splash',    // 6. Açılış Seremonisi (Boot Efekti) (Image 9)
  'mascot',         // 7. Sanal Asistan & Sevimli Maskot (Images 10, 11)
  'esp_hardware',   // 8. ESP Donanım Güvenlik & Günlüğü (Images 12, 13)
  'cloud',          // 9. Bulut Ayarları (Image 14)
  'reset',          // 10. Geçmiş Veri Resetleme (Image 15)
];

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
  isHapticsEnabled?: boolean;
  onToggleHaptics?: (enabled: boolean) => void;
  isStartupSplashEnabled?: boolean;
  onToggleStartupSplash?: (enabled: boolean) => void;
  onPreviewStartupSplash?: () => void;
  mascotConfig?: MascotConfig;
  onUpdateMascotConfig?: (cfg: Partial<MascotConfig>) => void;
  onLaunchScreenSaver?: () => void;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
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
  isHapticsEnabled: isHapticsEnabledProp,
  onToggleHaptics,
  isStartupSplashEnabled: isStartupSplashEnabledProp,
  onToggleStartupSplash,
  onPreviewStartupSplash,
  mascotConfig,
  onUpdateMascotConfig,
  onLaunchScreenSaver,
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
}) => {
  const t = translations[lang] || translations.tr;
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const isTactile = themeMode === 'tactile_deck';
  const palette = obsidianPalette || getObsidianPalette(3);
  const [localUrl, setLocalUrl] = useState(dbUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  // Accordion state: only one menu open at a time (null = all collapsed in sleek frame)
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  // Edit mode for reordering: when false, drag handles & arrows are hidden to keep titles uncrowded
  const [isReorderEditMode, setIsReorderEditMode] = useState<boolean>(false);

  // Menu order state with localStorage persistence
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('settings_menu_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = DEFAULT_SETTINGS_MENU_ORDER.filter((id) => parsed.includes(id));
            const missing = DEFAULT_SETTINGS_MENU_ORDER.filter((id) => !parsed.includes(id));
            return [...valid, ...missing];
          }
        }
      } catch (e) {
        console.warn('Error reading settings_menu_order', e);
      }
    }
    return DEFAULT_SETTINGS_MENU_ORDER;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleSection = (id: string) => {
    triggerHaptic('selection');
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  const moveSection = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= menuOrder.length) return;
    triggerHaptic('selection');
    const newOrder = [...menuOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setMenuOrder(newOrder);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('settings_menu_order', JSON.stringify(newOrder));
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex !== dropIndex) {
      triggerHaptic('medium');
      const newOrder = [...menuOrder];
      const [moved] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, moved);
      setMenuOrder(newOrder);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('settings_menu_order', JSON.stringify(newOrder));
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetMenuOrder = () => {
    triggerHaptic('selection');
    setMenuOrder(DEFAULT_SETTINGS_MENU_ORDER);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('settings_menu_order');
    }
  };

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

  // Global haptic feedback toggle state (persisted in localStorage)
  const [localHapticsEnabled, setLocalHapticsEnabled] = useState<boolean>(() => {
    if (isHapticsEnabledProp !== undefined) return isHapticsEnabledProp;
    return getHapticsEnabled();
  });

  useEffect(() => {
    if (isHapticsEnabledProp !== undefined) {
      setLocalHapticsEnabled(isHapticsEnabledProp);
    }
  }, [isHapticsEnabledProp]);

  const handleMasterHapticsToggle = (enabled: boolean) => {
    setLocalHapticsEnabled(enabled);
    setHapticsEnabled(enabled);
    onToggleHaptics?.(enabled);
    if (enabled) {
      triggerHaptic('success', true);
    }
  };

  // Startup boot animation toggle state (persisted in localStorage)
  const [localStartupSplashEnabled, setLocalStartupSplashEnabled] = useState<boolean>(() => {
    if (isStartupSplashEnabledProp !== undefined) return isStartupSplashEnabledProp;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_startup_splash_enabled');
      return saved !== 'false';
    }
    return true;
  });

  useEffect(() => {
    if (isStartupSplashEnabledProp !== undefined) {
      setLocalStartupSplashEnabled(isStartupSplashEnabledProp);
    }
  }, [isStartupSplashEnabledProp]);

  const handleToggleStartupSplash = (enabled: boolean) => {
    setLocalStartupSplashEnabled(enabled);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('app_startup_splash_enabled', String(enabled));
      } catch {}
    }
    onToggleStartupSplash?.(enabled);
    triggerHaptic('medium');
  };

  // Haptic feedback testing state
  const [activeHapticTest, setActiveHapticTest] = useState<string | null>(null);

  const handleTestHapticPulse = (type: HapticFeedbackType, label: string) => {
    triggerHaptic(type, true);
    setActiveHapticTest(label);
    setTimeout(() => {
      setActiveHapticTest(null);
    }, 1200);
  };

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

  if (!isOpen || typeof document === 'undefined') return null;

  const renderHeaderPrefix = (index: number) => {
    if (!isReorderEditMode) return null;
    return (
      <div
        className="flex items-center gap-0.5 text-white/60 hover:text-white shrink-0 select-none mr-1.5 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
                    className="cursor-grab active:cursor-grabbing p-1 text-amber-400/90 hover:text-amber-300 transition-colors"
          title="Sıralamayı değiştirmek için sürükleyin"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      <div className="flex flex-col -space-y-1">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => moveSection(index, 'up')}
          className={`p-0.5 text-[9px] leading-none transition-opacity ${
            index === 0
              ? 'opacity-20 cursor-not-allowed'
              : 'opacity-70 hover:opacity-100 hover:text-amber-300 cursor-pointer active:scale-110'
          }`}
          title="Yukarı taşı"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={index === menuOrder.length - 1}
          onClick={() => moveSection(index, 'down')}
          className={`p-0.5 text-[9px] leading-none transition-opacity ${
            index === menuOrder.length - 1
              ? 'opacity-20 cursor-not-allowed'
              : 'opacity-70 hover:opacity-100 hover:text-amber-300 cursor-pointer active:scale-110'
          }`}
          title="Aşağı taşı"
        >
          ▼
        </button>
      </div>
    </div>
    );
  };

  const getCardClasses = (isOpen: boolean, isDanger = false, index: number) => {
    const isDragging = draggedIndex === index;
    const isOver = dragOverIndex === index;

    let baseBg = '';
    if (isDanger) {
      baseBg = isObsidian
        ? isOpen
          ? 'bg-rose-950/30 border-rose-500/40 shadow-lg'
          : 'bg-rose-950/20 border-rose-500/25 hover:border-rose-500/40 text-white'
        : isTactile
        ? isOpen
          ? 'bg-[#251720] border-rose-500/40 shadow-lg'
          : 'bg-[#1e151d] border-t border-l border-rose-500/20 border-r border-b border-black/80 text-white'
        : isOpen
        ? 'bg-rose-500/15 border-rose-400/40 backdrop-blur-md text-white'
        : 'bg-rose-500/10 border-rose-400/20 text-white';
    } else {
      baseBg = isObsidian
        ? isOpen
          ? 'bg-[#181427] border-purple-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-white'
          : 'bg-[#151221] border-white/[0.08] hover:border-white/[0.18] text-white'
        : isTactile
        ? isOpen
          ? 'bg-[#1c1929] border-amber-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] text-white'
          : 'bg-[#181523] border-t border-l border-white/[0.14] border-r border-black/70 border-b border-black/90 hover:border-white/25 text-white'
        : isOpen
        ? 'bg-white/10 border-white/25 backdrop-blur-md shadow-lg text-white'
        : 'bg-white/5 border-white/10 hover:border-white/20 text-white';
    }

    return `rounded-2xl border transition-all duration-300 overflow-hidden ${baseBg} ${
      isDragging ? 'opacity-40' : ''
    } ${isOver ? 'ring-2 ring-amber-400/70' : ''}`;
  };

  // 1. ŞİFRELİ KASA & BİLDİRİMLER (Image 1 top)
  const renderVaultSection = (index: number) => {
    const isOpen = openSectionId === 'vault';
    return (
      <div
        key="vault"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('vault')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                  : 'bg-amber-500 text-white shadow-amber-500/30'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>{t.vaultCardTitle}</span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isTactile
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  AES-256
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                {t.vaultCardSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVaultModal?.();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_3px_0_#0c0b10,0_4px_8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
              }`}
              title="Şifreli kasa penceresini aç"
            >
              <span>{t.openVault}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleSection('vault')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            <p className="text-white/70 text-[11px] leading-relaxed">
              Telegram acil bildirim botu anahtarları, emniyet parametreleri ve alarm kontakları AES-256 CBC şifreleme ve PBKDF2 anahtar türetme ile saklanır.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                ✓ PIN Koruması Devrede
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                ✓ 256-Bit Donanım Seviyesi Şifreleme
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVaultModal?.();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Şifreli Kasa ve Bildirim Merkezini Aç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // 2. GOOGLE HOME & ASİSTAN (Image 1 bottom)
  const renderGoogleHomeSection = (index: number) => {
    const isOpen = openSectionId === 'google_home';
    return (
      <div
        key="google_home"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('google_home')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                  : 'bg-gradient-to-tr from-blue-600 to-emerald-500 text-white shadow-blue-500/30'
              }`}
            >
              <span className="text-sm">🏠</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>{t.googleHomeTitle}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    isTactile
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {t.googleHomeBadge}
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                {t.googleHomeSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoogleHomeModal?.();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_3px_0_#0c0b10,0_4px_8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
              title="Google Home entegrasyon penceresini aç"
            >
              <span>Yönet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleSection('google_home')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            <p className="text-white/70 text-[11px] leading-relaxed">
              Google Home ekosistemi ve Google Asistan ile sesli kombi kontrolü sağlayın. Firebase Realtime Database köprüsü üzerinden çift yönlü telemetri senkronizasyonu yapılır.
            </p>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>🎙️ Örnek Sesli Komutlar:</span>
              </div>
              <div className="text-[10px] text-blue-300 font-mono">
                • "Hey Google, salon termostatını 22.5 derece yap"
                <br />
                • "Hey Google, kombi açık mı?"
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoogleHomeModal?.();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <span>Google Home & Asistan Entegrasyonunu Yönet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // 3. SMART DISPLAY & AMBİYANS (Images 2, 3, 4, 5, 6)
  const renderSmartDisplaySection = (index: number) => (
    <div
      key="smart_display"
            onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`transition-opacity ${draggedIndex === index ? 'opacity-40' : ''} ${
        dragOverIndex === index ? 'ring-2 ring-amber-400/70 rounded-2xl' : ''
      }`}
    >
      <SmartDisplaySettingsSection
        smartDisplayConfig={smartDisplayConfig}
        onUpdateSmartDisplayConfig={onUpdateSmartDisplayConfig}
        onLaunchSmartDisplay={onLaunchSmartDisplay}
        themeMode={themeMode}
        obsidianPalette={palette}
        isOpen={openSectionId === 'smart_display'}
        onToggleOpen={() => toggleSection('smart_display')}
        headerPrefix={renderHeaderPrefix(index)}
      />
    </div>
  );

  // 4. BİLDİRİM AYARLARI & OTOMASYON (Image 7)
  const renderNotificationsSection = (index: number) => {
    const isOpen = openSectionId === 'notifications';
    return (
      <div
        key="notifications"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('notifications')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30'
                  : 'bg-amber-500 text-white shadow-amber-500/30'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>{t.notifSectionTitle}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  3 Saatlik & Acil
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                {t.notifSectionSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Devrede
            </span>
            <button
              type="button"
              onClick={() => toggleSection('notifications')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            {/* 1. Otomatik 3 Saatlik Bildirim Switch & Test Butonu (Image 7) */}
            <div
              className={`p-2.5 rounded-xl flex flex-col gap-2 ${
                isObsidian
                  ? 'bg-[#1e1930] border border-white/[0.08]'
                  : isTactile
                  ? 'bg-[#221e30] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-white'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWeatherNotificationsEnabled ? (
                    <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-bold text-xs text-white">
                    Otomatik 3 Saatlik Periyodik Durum Bildirimi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleWeatherNotifications?.(!isWeatherNotificationsEnabled)}
                  style={
                    isWeatherNotificationsEnabled && isTactile
                      ? {
                          background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                          boxShadow: '0 3px 0 #0c0b10, 0 6px 12px rgba(0,0,0,0.8), 0 0 12px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                          border: '1px solid rgba(255, 200, 150, 0.45)',
                          color: '#fff7ed',
                        }
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
                    isWeatherNotificationsEnabled
                      ? isTactile
                        ? ''
                        : 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30'
                      : isTactile
                      ? 'bg-[#181523] text-slate-400 border border-white/10'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{isWeatherNotificationsEnabled ? 'Devrede' : 'Kapalı'}</span>
                </button>
              </div>

              <p className="text-[10px] text-white/70 leading-relaxed">
                Her 3 saatte bir kombi durumu, hava tahmini ve akıllı ısıtma tedbirleri otomatik gönderilir.
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                <span className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
                  ⏱️ Periyot: 3 Saatte Bir (Otomatik)
                </span>
                <button
                  type="button"
                  onClick={handleTriggerTest}
                  disabled={testSent}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                    testSent
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isTactile
                      ? 'bg-[#181523] hover:bg-[#252035] text-amber-300 border-amber-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>{testSent ? 'Gönderildi!' : 'Test Bildirimi Gönder'}</span>
                </button>
              </div>
            </div>

            {/* 2. Acil & Kritik Emniyet Bildirimleri (Image 7) */}
            <div
              className={`p-2.5 rounded-xl flex flex-col gap-2 ${
                isObsidian
                  ? 'bg-[#1e1930] border border-white/[0.08]'
                  : isTactile
                  ? 'bg-[#221e30] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-white'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-bold text-xs text-white">
                    Acil & Kritik Emniyet Bildirimleri
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCritical(!isCriticalAlertsEnabled)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
                    isCriticalAlertsEnabled
                      ? 'bg-rose-600 text-white font-bold shadow-rose-600/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{isCriticalAlertsEnabled ? 'Devrede' : 'Kapalı'}</span>
                </button>
              </div>

              <p className="text-[10px] text-white/70 leading-relaxed">
                Düşük su basıncı (&lt;1.0 Bar), brülör alev sönmesi ve donma riski (&lt;5°C) durumunda anında sesli ve görsel acil uyarı üretilir.
              </p>

              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400 pt-1 border-t border-white/[0.08]">
                <Check className="w-3 h-3" />
                <span>Basınç & Donma Koruma İzleyicisi Devrede</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. HAPTİK TİTREŞİM & DOKUNMA (Image 8)
  const renderHapticsSection = (index: number) => {
    const isOpen = openSectionId === 'haptics';
    return (
      <div
        key="haptics"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('haptics')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>Haptik Titreşim & Dokunma</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Titreşim
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                Tüm butonlar, kadran ve alt dock için dokunsal geri bildirim
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleMasterHapticsToggle(!localHapticsEnabled)}
              style={
                localHapticsEnabled && isTactile
                  ? {
                      background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                      boxShadow: '0 3px 0 #0c0b10, 0 6px 12px rgba(0,0,0,0.8), 0 0 12px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255, 200, 150, 0.45)',
                      color: '#fff7ed',
                    }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
                localHapticsEnabled
                  ? isTactile
                    ? ''
                    : 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span>{localHapticsEnabled ? 'Açık ✓' : 'Pasif'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('haptics')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-amber-300 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Uygulama genelinde dokunmatik titreşim aktif.
              </span>
              <span className="text-[10px] font-mono text-amber-400/80">Canlı Geri Bildirim</span>
            </div>

            {/* 4 Test Butonu (Image 8) */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'light' as const, label: 'Hafif Tık', dur: '40ms', icon: '⚡' },
                { type: 'selection' as const, label: 'Seçim Tıkı', dur: '55ms', icon: '🎯' },
                { type: 'medium' as const, label: 'Orta Adım', dur: '80ms', icon: '🔥' },
                { type: 'heavy' as const, label: 'Güçlü Vuruş', dur: '140ms', icon: '💥' },
              ].map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => handleTestHapticPulse(btn.type, btn.label)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 ${
                    activeHapticTest === btn.label
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-md scale-102'
                      : isTactile
                      ? 'bg-[#181523] border-white/10 hover:border-amber-500/50 text-white'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                  }`}
                >
                  <span className="text-base">{btn.icon}</span>
                  <span className="font-bold text-xs">{btn.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">{btn.dur}</span>
                </button>
              ))}
            </div>

            {/* Android Rehberi (Image 8) */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-[10px] text-white/80">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <span>📱 Android'de Titreşim Hissedilmiyorsa:</span>
              </div>
              <ul className="space-y-1 pl-3 list-disc marker:text-amber-400">
                <li>
                  <strong>Sistem Titreşimi:</strong> Telefonunuzda <em>Ayarlar &gt; Ses ve Titreşim &gt; Dokunmatik Geri Bildirim</em> açık olmalıdır.
                </li>
                <li>
                  <strong>Pil Tasarrufu:</strong> Pil Tasarruf Modu açıkken Android titreşim motorunu durdurur.
                </li>
                <li>
                  <strong>Xiaomi / HyperOS / MIUI:</strong> <em>Ayarlar &gt; Ses & Titreşim &gt; Haptik Düzeyi</em> çubuğunu artırınız.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 6. AÇILIŞ SEREMONİSİ (BOOT EFEKTİ) (Image 9)
  const renderBootSplashSection = (index: number) => {
    const isOpen = openSectionId === 'boot_splash';
    return (
      <div
        key="boot_splash"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('boot_splash')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30'
                  : 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-orange-500/30'
              }`}
            >
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>Açılış Seremonisi (Boot Efekti)</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Boot
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                Uygulama açılırken akıllı termostat kalibrasyon animasyonu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleToggleStartupSplash(!localStartupSplashEnabled)}
              style={
                localStartupSplashEnabled && isTactile
                  ? {
                      background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                      boxShadow: '0 3px 0 #0c0b10, 0 6px 12px rgba(0,0,0,0.8), 0 0 12px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255, 200, 150, 0.45)',
                      color: '#fff7ed',
                    }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
                localStartupSplashEnabled
                  ? isTactile
                    ? ''
                    : 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span>{localStartupSplashEnabled ? 'Açık ✓' : 'Pasif'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('boot_splash')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            <p className="text-white/70 text-[11px] leading-relaxed">
              İlk yüklemede dönen kalibrasyon göstergesi, telemetri teşhisi ve haptik titreşim karşılaması sergilenir.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
              <span className="text-[10px] text-amber-300 flex items-center gap-1 font-semibold">
                ✨ Önizleme Testi:
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onPreviewStartupSplash?.();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-white/15"
              >
                <Play className="w-3 h-3 fill-current text-amber-400" />
                <span>Animasyonu Önizle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 7. SANAL ASİSTAN & SEVİMLİ MASKOT (Images 10, 11)
  const renderMascotSection = (index: number) => (
    <div
      key="mascot"
            onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`transition-opacity ${draggedIndex === index ? 'opacity-40' : ''} ${
        dragOverIndex === index ? 'ring-2 ring-amber-400/70 rounded-2xl' : ''
      }`}
    >
      <MascotSettingsSection
        themeMode={themeMode}
        config={mascotConfig}
        onUpdateConfig={onUpdateMascotConfig}
        onLaunchScreenSaver={onLaunchScreenSaver}
        currentTemp={currentTemp}
        targetTemp={targetTemp}
        isKombiActive={isKombiActive}
        isOpen={openSectionId === 'mascot'}
        onToggleOpen={() => toggleSection('mascot')}
        headerPrefix={renderHeaderPrefix(index)}
      />
    </div>
  );

  // 8. ESP DONANIM GÜVENLİK & GÜNLÜĞÜ (Images 12, 13)
  const renderEspHardwareSection = (index: number) => (
    <div
      key="esp_hardware"
            onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`transition-opacity ${draggedIndex === index ? 'opacity-40' : ''} ${
        dragOverIndex === index ? 'ring-2 ring-amber-400/70 rounded-2xl' : ''
      }`}
    >
      <EspDiagnosticsSection
        themeMode={themeMode}
        isConnected={isConnected}
        isOpen={openSectionId === 'esp_hardware'}
        onToggleOpen={() => toggleSection('esp_hardware')}
        headerPrefix={renderHeaderPrefix(index)}
      />
    </div>
  );

  // 9. BULUT SENKRONİZASYON & VERİTABANI (Image 14)
  const renderCloudSection = (index: number) => {
    const isOpen = openSectionId === 'cloud';
    return (
      <div
        key="cloud"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, false, index)}
      >
        <div
          onClick={() => toggleSection('cloud')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>Bulut Senkronizasyon & Veritabanı</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Firebase RTDB
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                Firebase gerçek zamanlı veri senkronizasyonu ve AES-256 kasa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isConnected ? 'Bağlı & Aktif' : 'Çevrimdışı'}
            </span>
            <button
              type="button"
              onClick={() => toggleSection('cloud')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
            {/* Bulut Senkronizasyon Durumu Kutusu (Image 14) */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
              <span className="text-white/80 font-medium text-xs">
                Bulut Senkronizasyon Durumu:
              </span>
              <span
                className={`font-bold text-[11px] px-3 py-1 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                ● {isConnected ? 'Bağlı & Aktif' : 'Çevrimdışı (Yerel Mod)'}
              </span>
            </div>

            {/* Firebase Database URL Input */}
            <div>
              <label className="font-semibold block mb-1 text-white/90 flex items-center gap-1.5 text-xs">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Firebase Database URL:
              </label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                placeholder="https://kombi-kontrol-babd5-default-rtdb.firebaseio.com"
                className="w-full px-3 py-2 rounded-xl font-mono text-xs bg-black/40 border border-white/15 text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Firebase Web API Key Input */}
            <div>
              <label className="font-semibold block mb-1 text-white/90 flex items-center gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Firebase Web API Key:
              </label>
              <input
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSyDMULZx..."
                className="w-full px-3 py-2 rounded-xl font-mono text-xs bg-black/40 border border-white/15 text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* AES Kasa Rozeti (Image 14) */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2 text-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Firebase yapılandırmanız ve sıcaklık programlarınız yerel AES-256 kasasında saklanır.
              </p>
            </div>

            {/* Kaydet Butonu */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Ayarlar Başarıyla Kaydedildi</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Bulut Yapılandırmasını Kaydet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 10. GEÇMİŞ VERİLERİ VE TÜKETİM KAYITLARINI SIFIRLA (Image 15)
  const renderResetSection = (index: number) => {
    const isOpen = openSectionId === 'reset';
    return (
      <div
        key="reset"
                onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={getCardClasses(isOpen, true, index)}
      >
        <div
          onClick={() => toggleSection('reset')}
          className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderHeaderPrefix(index)}
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
                <span>Geçmiş Verileri ve Tüketim Kayıtlarını Sıfırla</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Sıfırlama
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
                Hafızadaki tüm geçmiş kullanım, sıcaklık saatlik kayıtları ve fatura telemetrisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
              Sıfırla
            </span>
            <button
              type="button"
              onClick={() => toggleSection('reset')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-rose-500/20">
            {/* Warning Message (Image 15) */}
            <p className="text-[11px] text-white/80 leading-relaxed">
              Hafızadaki tüm geçmiş kullanım, sıcaklık saatlik kayıtları ve fatura telemetrisi tamamen sıfırlanacaktır. Canlı test öncesi tertemiz başlangıç sağlar.
            </p>

            {resetSuccess ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 justify-center">
                <Check className="w-4 h-4" />
                <span>{t.resetDataSuccess}</span>
              </div>
            ) : isConfirmingReset ? (
              <div className="flex items-center gap-2 pt-1 border-t border-rose-500/30">
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md"
                >
                  Evet, Tümünü Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="py-2 px-4 rounded-xl font-semibold text-xs cursor-pointer bg-white/10 hover:bg-white/20 text-slate-300 transition-all"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-900/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Geçmiş Verileri Sıfırla</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (sectionId: string, index: number) => {
    switch (sectionId) {
      case 'vault':
        return renderVaultSection(index);
      case 'google_home':
        return renderGoogleHomeSection(index);
      case 'smart_display':
        return renderSmartDisplaySection(index);
      case 'notifications':
        return renderNotificationsSection(index);
      case 'haptics':
        return renderHapticsSection(index);
      case 'boot_splash':
        return renderBootSplashSection(index);
      case 'mascot':
        return renderMascotSection(index);
      case 'esp_hardware':
        return renderEspHardwareSection(index);
      case 'cloud':
        return renderCloudSection(index);
      case 'reset':
        return renderResetSection(index);
      default:
        return null;
    }
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
        className={`rounded-3xl p-4 sm:p-5 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 ${
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
          className={`flex items-center justify-between pb-3 border-b shrink-0 ${
            isObsidian
              ? 'border-white/[0.08]'
              : isTactile
              ? 'border-white/[0.1]'
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
                  : isTactile
                  ? {
                      background: 'linear-gradient(135deg, rgba(255,140,50,0.2), rgba(210,85,20,0.1))',
                      borderColor: 'rgba(255,160,80,0.3)',
                      color: '#fcd34d',
                    }
                  : undefined
              }
              className={`p-2 rounded-xl ${
                isObsidian || isTactile
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
                  isObsidian || isGlass || isTactile ? 'text-white' : 'text-slate-800 dark:text-white'
                }`}
              >
                {t.settingsModalTitle}
              </h2>
              <p
                className={`text-xs ${
                  isObsidian
                    ? 'text-[#c3b6e8]'
                    : isTactile
                    ? 'text-slate-300'
                    : isGlass
                    ? 'text-white/70'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.settingsModalSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMenuOrder}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                isTactile
                  ? 'bg-amber-500/10 text-amber-300/80 hover:text-amber-200 border border-amber-500/20 hover:bg-amber-500/20'
                  : 'bg-white/5 text-white/70 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
              title="Menü sıralamasını varsayılana sıfırla"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıralamayı Sıfırla</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all ${
                isObsidian
                  ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                  : isTactile
                  ? 'bg-[#221f2f] hover:bg-[#2c283c] text-amber-300 border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                  : isGlass
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body - Accordion Items */}
        <div className="py-3 space-y-2.5 text-xs overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* Sürükle Bırak Bilgi Şeridi & Düzenle Butonu */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-white/60 border-b border-white/[0.06] mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <GripVertical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Menüleri sürükle veya oklarla sırala</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetMenuOrder}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Menü sıralamasını varsayılana sıfırla"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsReorderEditMode(!isReorderEditMode);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isReorderEditMode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                }`}
                title="Menü sıralama tutamaçlarını ve oklarını göster / gizle"
              >
                {isReorderEditMode ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Tamamla</span>
                  </>
                ) : (
                  <>
                    <span>✏️ Düzenle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {menuOrder.map((sectionId, index) => renderSection(sectionId, index))}
        </div>

        {/* Footer */}
        <div
          className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${
            isObsidian
              ? 'border-white/[0.08]'
              : isTactile
              ? 'border-white/[0.1]'
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
                : isTactile
                ? 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
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
                : isTactile
                ? {
                    background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                    boxShadow: '0 4px 0 #0c0b10, 0 8px 16px rgba(0,0,0,0.8), 0 0 16px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255, 200, 150, 0.45)',
                    color: '#fff7ed',
                  }
                : undefined
            }
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 ${
              isObsidian
                ? 'border-t border-l border-white/25 border-r border-b'
                : isTactile
                ? ''
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
