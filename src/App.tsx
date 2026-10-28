import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Zap,
  BatteryCharging,
  Layers,
  Sparkles,
  Settings,
  SlidersHorizontal,
  Flame,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mic,
  Monitor,
  Sliders,
} from 'lucide-react';

import type { ThemeMode, PerformanceMode, MorphMode, ScheduleItem, WidgetItem } from './types.ts';
import type { SmartDisplayConfig } from './types/smartDisplay.ts';
import { DEFAULT_SMART_DISPLAY_CONFIG } from './types/smartDisplay.ts';
import { translations, type Language } from './utils/i18n.ts';
import { ThreeScene } from './components/ThreeCanvas/ThreeScene.tsx';
import { triggerHaptic, getHapticsEnabled } from './utils/haptics.ts';
import { AtmosphericWeatherBackground } from './components/Weather/AtmosphericWeatherBackground.tsx';
import { ThemeSelectorModal } from './components/Theme/ThemeSelectorModal.tsx';
import { ForecastSection } from './components/Weather/ForecastSection.tsx';
import { CoreGaugeWidget } from './components/Widgets/CoreGaugeWidget.tsx';
import { TargetControlWidget } from './components/Widgets/TargetControlWidget.tsx';
import { ModulationWidget } from './components/Widgets/ModulationWidget.tsx';
import { AnalyticsChartWidget } from './components/Widgets/AnalyticsChartWidget.tsx';
import { ReportAnalyticsHeatmapWidget } from './components/Widgets/ReportAnalyticsHeatmapWidget.tsx';
import { WeeklyScheduleWidget } from './components/Widgets/WeeklyScheduleWidget.tsx';
import { ProgramDeckView } from './components/Program/ProgramDeckView.tsx';
import { ReportDeckView } from './components/Report/ReportDeckView.tsx';
import { TelegramConfigWidget } from './components/Widgets/TelegramConfigWidget.tsx';
import { SecurityVaultWidget } from './components/Widgets/SecurityVaultWidget.tsx';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { VaultNotificationsModal } from './components/VaultNotificationsModal.tsx';
import { VoiceAssistantModal } from './components/VoiceAssistant/VoiceAssistantModal.tsx';
import { GoogleHomeModal } from './components/GoogleHome/GoogleHomeModal.tsx';
import { SmartDisplayOverlay } from './components/SmartDisplay/SmartDisplayOverlay.tsx';
import { TactileTelemetryBar } from './components/Widgets/TactileTelemetryBar.tsx';
import { TactileDialWidget } from './components/Widgets/TactileDialWidget.tsx';
import { StartupBootSplash } from './components/Startup/StartupBootSplash.tsx';
import type { MascotConfig } from './types/mascot.ts';
import { DEFAULT_MASCOT_CONFIG } from './types/mascot.ts';
import { TermoBotMascot } from './components/Mascot/TermoBotMascot.tsx';


import {
  calculateRelayStatus,
  calculateFlameModulation,
  resolveEffectiveTheme,
} from './utils/thermostatRules.ts';
import { getObsidianPalette } from './utils/obsidianPalettes.ts';
import { SecureVault, encryptData } from './utils/crypto.ts';
import {
  DEFAULT_LOCATIONS,
  type LocationItem,
  type CurrentWeather,
  type WeatherCondition,
  fetchOpenMeteoWeather,
  getFallbackForecast,
} from './utils/weather.ts';

// Initial default widgets
const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: 'target', title: 'Hedef Sıcaklık & Modlar', description: 'Termostat hedef ayarı ve hızlı akıllı modlar', icon: '🎯', enabled: true, order: 0 },
  { id: 'gauge', title: 'Oda Sıcaklığı & Nem', description: 'Canlı sensör göstergeleri ve konfor indeksi', icon: '🌡️', enabled: true, order: 1 },
  { id: 'modulation', title: 'Kombi Telemetrisi', description: 'Alev modülasyonu, su basıncı ve pompa durumu', icon: '🔥', enabled: true, order: 2 },
  { id: 'analytics', title: '24 Saatlik Analitik', description: 'Sıcaklık ve tüketim trend grafiği', icon: '📈', enabled: true, order: 3 },
  { id: 'consumption', title: 'Gaz & Tasarruf Hesabı', description: 'Tahmini tüketim ve maliyet hesabı', icon: '💰', enabled: true, order: 4 },
  { id: 'schedule', title: 'Zaman Programı', description: 'Haftalık otomatik sıcaklık programlayıcı', icon: '⏰', enabled: true, order: 5 },
  { id: 'security', title: 'AES-256 Güvenlik Kasası', description: 'Sıfır bilgi yerel şifreleme ve PIN koruması', icon: '🔐', enabled: true, order: 6 },
  { id: 'telegram', title: 'Telegram Bildirimleri', description: 'Şifreli bot tokeni ve uyarı bildirimleri', icon: '🤖', enabled: true, order: 7 },
];

const DEFAULT_SCHEDULES: ScheduleItem[] = [
  { id: '1', name: '🌙 Gece Modu', enabled: true, time: '23:00', targetTemp: 19.0 },
  { id: '2', name: '☀️ Sabah Modu', enabled: true, time: '06:30', targetTemp: 23.0 },
  { id: '3', name: '🏢 Dışarıda Modu', enabled: false, time: '08:00', targetTemp: 17.5 },
  { id: '4', name: '🛋️ Akşam Konforu', enabled: true, time: '18:30', targetTemp: 22.5 },
];

export interface SlideDef {
  id: string;
  label: string;
  icon: string;
  title: string;
}

const TABS: SlideDef[] = [
  { id: 'genel', label: 'Termo.', icon: '🏠', title: 'Termostat & Kombi Ana Kontrol' },
  { id: 'hava', label: 'Hava', icon: '🌤️', title: 'Bölgesel Hava Durumu & 5 Günlük Tahmin' },
  { id: 'rapor', label: 'Rapor', icon: '📊', title: '24s Sıcaklık & Tüketim Analitiği' },
  { id: 'program', label: 'Prog.', icon: '⏰', title: 'Haftalık Zaman Planı & Tüketim' },
];

export default function App() {
  // ── Language State: 'tr' | 'en' ──
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_language') as Language;
      if (saved === 'tr' || saved === 'en') return saved;
    }
    return 'tr';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
    }
  }, [lang]);

  const t = translations[lang] || translations.tr;

  // ── Reorderable Screens & Sub-menus State (Widget Customization) ──
  const [tabsOrder, setTabsOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_tabs_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 4 && parsed.every((p: string) => ['genel', 'hava', 'rapor', 'program'].includes(p))) {
            return parsed;
          }
        }
      } catch {}
    }
    return ['genel', 'hava', 'rapor', 'program'];
  });

  const [reportSubOrder, setReportSubOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_report_sub_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((p: string) => ['heatmap', 'bill', 'sensors'].includes(p))) {
            return parsed;
          }
        }
      } catch {}
    }
    return ['heatmap', 'bill', 'sensors'];
  });

  const [progSubOrder, setProgSubOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_prog_sub_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 2 && parsed.every((p: string) => ['schedule', 'consumption'].includes(p))) {
            return parsed;
          }
        }
      } catch {}
    }
    return ['schedule', 'consumption'];
  });

  // Dynamic tabs based on active language and custom user order
  const tabs: SlideDef[] = useMemo(() => {
    const tabMap: Record<string, SlideDef> = {
      genel: { id: 'genel', label: t.tabThermostat, icon: '🏠', title: lang === 'tr' ? 'Termostat & Kombi Ana Kontrol' : 'Thermostat & Boiler Main Control' },
      hava: { id: 'hava', label: t.tabWeather, icon: '🌤️', title: lang === 'tr' ? 'Bölgesel Hava Durumu & 5 Günlük Tahmin' : 'Regional Weather & 5-Day Forecast' },
      rapor: { id: 'rapor', label: t.tabReport, icon: '📊', title: lang === 'tr' ? '24s Sıcaklık & Tüketim Analitiği' : '24h Temperature & Usage Analytics' },
      program: { id: 'program', label: t.tabProgram, icon: '⏰', title: lang === 'tr' ? 'Haftalık Zaman Planı & Tüketim' : 'Weekly Schedule & Consumption' },
    };
    return tabsOrder.map((id) => tabMap[id]).filter(Boolean);
  }, [lang, t, tabsOrder]);

  // ── Theme State: 'glass' | 'dark' | 'light' | 'system' | 'obsidian_lavender' | 'tactile_deck' ──
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      // Automatic migration to 'tactile_deck' as the initial default theme
      const hasMigrated = localStorage.getItem('theme_migrated_tactile_v2');
      if (!hasMigrated) {
        try {
          localStorage.setItem('theme_migrated_tactile_v2', 'true');
          localStorage.setItem('theme_preference', 'tactile_deck');
        } catch {}
        return 'tactile_deck';
      }
      const saved = localStorage.getItem('theme_preference') as ThemeMode;
      if (saved === 'glass' || saved === 'light' || saved === 'dark' || saved === 'system' || saved === 'obsidian_lavender' || saved === 'tactile_deck') return saved;
    }
    return 'tactile_deck';
  });


  // ── Obsidian Palette Sub-color Option (0: Pastel Lavanta, 1: Kül Leylak, 2: Kraliyet İndigo, 3: Derin Obsidyen Dumanı) ──
  const [obsidianPaletteIdx, setObsidianPaletteIdx] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smart_thermostat_obsidian_palette');
        if (saved !== null) {
          const num = parseInt(saved, 10);
          if (num >= 0 && num <= 3) return num;
        }
      } catch {}
    }
    return 3; // Default to 'Derin Obsidyen Dumanı' as favored by user
  });

  const handleSelectObsidianPalette = (idx: number) => {
    triggerHaptic('selection');
    setObsidianPaletteIdx(idx);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_thermostat_obsidian_palette', String(idx));
      } catch {}
    }
  };

  const activeObsidianPalette = useMemo(() => {
    return getObsidianPalette(obsidianPaletteIdx);
  }, [obsidianPaletteIdx]);

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [weatherConditionOverride, setWeatherConditionOverride] = useState<WeatherCondition | null>(null);

  const [nowTime, setNowTime] = useState<Date>(() => new Date());

  // Clock tick to update system theme every 30 seconds
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Compute if it's night time (before 06:30 or after 19:30), respecting active weather condition overrides
  const isNightTime = useMemo(() => {
    if (weatherConditionOverride === 'sunny' || weatherConditionOverride === 'partly_cloudy') {
      return false;
    }
    const h = nowTime.getHours();
    return h < 6 || h >= 19;
  }, [nowTime, weatherConditionOverride]);


  // Compute effective 'light' or 'dark' for DOM styling
  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    const h = nowTime.getHours();
    const m = nowTime.getMinutes();
    const osDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    return resolveEffectiveTheme(themeMode, h, m, osDark);
  }, [themeMode, nowTime]);

  // Dual Performance Mode: 'ultra' (60 FPS, full particles) vs 'eco' (low GPU/battery saving)
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('performance_mode') as PerformanceMode;
      if (saved === 'ultra' || saved === 'eco') return saved;
    }
    return 'ultra';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('performance_mode', performanceMode);
    }
  }, [performanceMode]);

  // Visual feedback toast when switching performance modes
  const [perfToast, setPerfToast] = useState<{ title: string; desc: string; isUltra: boolean } | null>(null);
  const perfToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const togglePerformanceMode = useCallback((targetMode?: PerformanceMode) => {
    setPerformanceMode((prev) => {
      const next = targetMode ?? (prev === 'ultra' ? 'eco' : 'ultra');
      if (perfToastTimerRef.current) clearTimeout(perfToastTimerRef.current);
      setPerfToast({
        title: next === 'ultra' ? '60 FPS Ultra Canavar Modu' : 'Eco Tasarruf Modu',
        desc:
          next === 'ultra'
            ? '3D Holografik Deck, Optik Lens Blur (12px) & Retina Termostat Aktif'
            : 'Sıfır Kasma: Tüm Blur & 3D Derinlik Kapalı, Düz Ultra Hızlı 2D Kaydırma',
        isUltra: next === 'ultra',
      });
      perfToastTimerRef.current = setTimeout(() => {
        setPerfToast(null);
      }, 2600);
      return next;
    });
  }, []);

  const [reducedMotion] = useState<boolean>(false);

  // ── Startup Entrance Animation State ──
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Gracefully trigger entrance sequence on mount
    const animTimer = setTimeout(() => {
      setIsAppLoaded(true);
    }, 40);
    return () => clearTimeout(animTimer);
  }, []);

  // ── Global Haptic Feedback Toggle State ──
  const [isHapticsEnabled, setIsHapticsEnabled] = useState<boolean>(() => {
    return getHapticsEnabled();
  });

  // ── Startup Boot Sequence & Splash Screen State ──
  const [isStartupSplashEnabled, setIsStartupSplashEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_startup_splash_enabled');
      return saved !== 'false';
    }
    return true;
  });

  const [showStartupSplash, setShowStartupSplash] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_startup_splash_enabled');
      return saved !== 'false';
    }
    return true;
  });

  const [isSplashPreview, setIsSplashPreview] = useState<boolean>(false);

  const handleSplashComplete = useCallback(() => {
    setShowStartupSplash(false);
    setIsSplashPreview(false);
  }, []);

  // ── Sanal Asistan & TermoBot Maskot State ──
  const [mascotConfig, setMascotConfig] = useState<MascotConfig>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('mascot_settings_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_MASCOT_CONFIG;
  });

  const handleUpdateMascotConfig = useCallback((patch: Partial<MascotConfig>) => {
    setMascotConfig((prev) => {
      const updated = { ...prev, ...patch };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mascot_settings_config', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // ── Carousel Infinite Sliding State ──
  // virtualIndex can grow arbitrarily positive or negative for infinite loop
  const [virtualIndex, setVirtualIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragDeltaX, setDragDeltaX] = useState<number>(0);

  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const isSwipeDirectionLockedRef = useRef<boolean | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Normalized active tab index in range [0 .. tabs.length - 1]
  const activeTabIndex = useMemo(() => {
    const n = tabs.length || 4;
    return ((virtualIndex % n) + n) % n;
  }, [virtualIndex, tabs.length]);

  // Thermostat vitals
  const [currentTemp, setCurrentTemp] = useState<number>(21.8);
  const [humidity, setHumidity] = useState<number>(48);
  const [targetTemp, setTargetTemp] = useState<number>(22.5);
  const [waterPressure] = useState<number>(1.6);
  
  // Real active combustion duration (in seconds) and live ignition tracking
  const [dailyRunSeconds, setDailyRunSeconds] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const s = localStorage.getItem('live_daily_active_seconds');
      if (s) return Number(s) || 0;
    }
    return 0;
  });
  const dailyRunMinutes = Math.floor(dailyRunSeconds / 60);

  const [lastIgnitionTime, setLastIgnitionTime] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const s = localStorage.getItem('kombi_last_ignition_ts');
      if (s) return Number(s) || Date.now();
    }
    return Date.now();
  });

  const [lastExtinguishTime, setLastExtinguishTime] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const s = localStorage.getItem('kombi_last_extinguish_ts');
      if (s) return Number(s) || Date.now();
    }
    return Date.now();
  });

  const [liveTicker, setLiveTicker] = useState<number>(0);
  const isUserInteractingRef = useRef<boolean>(false);
  const userInteractTimerRef = useRef<any>(null);

  // 3D Morph Mode
  const [morphMode] = useState<MorphMode>('heat');

  // Locations & Weather
  const [locations, setLocations] = useState<LocationItem[]>(DEFAULT_LOCATIONS);
  const [activeLocation, setActiveLocation] = useState<LocationItem>(DEFAULT_LOCATIONS[0]);
  const [weather, setWeather] = useState<CurrentWeather>(() =>
    getFallbackForecast(DEFAULT_LOCATIONS[0].cityName)
  );

  const effectiveWeatherCondition: WeatherCondition = useMemo(() => {
    return weatherConditionOverride || weather.condition || 'partly_cloudy';
  }, [weatherConditionOverride, weather.condition]);


  // Modals
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isGoogleHomeOpen, setIsGoogleHomeOpen] = useState(false);
  const [isSmartDisplayOpen, setIsSmartDisplayOpen] = useState(false);

  // Smart Display & Ambient Mode Config
  const [smartDisplayConfig, setSmartDisplayConfig] = useState<SmartDisplayConfig>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('smart_display_config_v1');
        if (saved) return { ...DEFAULT_SMART_DISPLAY_CONFIG, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SMART_DISPLAY_CONFIG;
  });

  const handleUpdateSmartDisplayConfig = (partial: Partial<SmartDisplayConfig>) => {
    setSmartDisplayConfig((prev) => {
      const next = { ...prev, ...partial };
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('smart_display_config_v1', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Widgets configuration
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);

  // Weekly Schedules
  const [schedules, setSchedules] = useState<ScheduleItem[]>(DEFAULT_SCHEDULES);

  // Telegram Config
  const [telegramToken, setTelegramToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');

  // Firebase Config
  const [firebaseUrl, setFirebaseUrl] = useState<string>('https://kombi-kontrol-babd5-default-rtdb.firebaseio.com');
  const [firebaseKey, setFirebaseKey] = useState<string>('AIzaSyDMULZx8TS0HuDMlxKzQ6BixW6jXJzJ55c');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Security Vault PIN
  const [vaultPin, setVaultPin] = useState<string>('');
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);

  // Temperature History (24 hours)
  const [history] = useState(() => [
    { time: '04:00', temp: 19.2, target: 19.0, isActive: false },
    { time: '06:00', temp: 19.1, target: 19.0, isActive: false },
    { time: '07:00', temp: 22.4, target: 23.0, isActive: true },
    { time: '09:00', temp: 22.8, target: 23.0, isActive: false },
    { time: '12:00', temp: 21.9, target: 22.0, isActive: false },
    { time: '14:00', temp: 21.6, target: 22.0, isActive: true },
    { time: '16:00', temp: 22.1, target: 22.0, isActive: false },
    { time: '18:00', temp: 21.4, target: 22.5, isActive: true },
    { time: '20:00', temp: 22.3, target: 22.5, isActive: true },
    { time: '22:00', temp: 22.0, target: 22.5, isActive: true },
  ]);

  // Weather notification active state
  const [isWeatherNotificationsEnabled, setIsWeatherNotificationsEnabled] = useState<boolean>(true);
  const [weatherToast, setWeatherToast] = useState<{ title: string; message: string } | null>(null);

  const handleTriggerWeatherNotification = useCallback(() => {
    setWeatherToast({
      title: '🌤️ 3 Saatlik Periyodik Hava Bildirimi & Tedbir',
      message: `${activeLocation.name} (${activeLocation.cityName}): ${weather.temp}°C, ${weather.conditionText}. Yağış riski %${weather.forecast[0]?.rainChancePct || 15}. Evde kombi hedefi 21.5°C önerilir, dışarı çıkarken şemsiyenizi unutmayın.`,
    });
    setTimeout(() => {
      setWeatherToast((curr) => (curr?.title.includes('3 Saatlik') ? null : curr));
    }, 6000);
  }, [activeLocation, weather]);

  // Derive relay and flame modulation
  const isKombiActive = useMemo(() => {
    return calculateRelayStatus(currentTemp, targetTemp, true, 0.4);
  }, [currentTemp, targetTemp]);

  const flameLevelPercent = useMemo(() => {
    return calculateFlameModulation(currentTemp, targetTemp, isKombiActive);
  }, [currentTemp, targetTemp, isKombiActive]);

  // ── Canlı Yanma Sayacı (Aktif ateşleme anında saniye saniye artar) ──
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isKombiActive) return;
    const interval = setInterval(() => {
      setDailyRunSeconds((prev) => {
        const next = prev + 1;
        if (next % 5 === 0 && typeof localStorage !== 'undefined') {
          localStorage.setItem('live_daily_active_seconds', String(next));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isKombiActive]);

  // Ateşleme geçişlerini izle (Kombi yandı/söndü zaman damgası)
  const prevKombiActiveRef = useRef<boolean>(isKombiActive);
  useEffect(() => {
    const now = Date.now();
    if (isKombiActive && !prevKombiActiveRef.current) {
      setLastIgnitionTime(now);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kombi_last_ignition_ts', String(now));
      }
    } else if (!isKombiActive && prevKombiActiveRef.current) {
      setLastExtinguishTime(now);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kombi_last_extinguish_ts', String(now));
      }
    }
    prevKombiActiveRef.current = isKombiActive;
  }, [isKombiActive]);

  // Sıfırlama işleyicisi (Ayarlar modalından çağrıldığında canlı tüm sayaçları 0'lar)
  const handleResetHistoricalData = useCallback(() => {
    setDailyRunSeconds(0);
    const now = Date.now();
    setLastIgnitionTime(now);
    setLastExtinguishTime(now);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('live_daily_active_seconds', '0');
      localStorage.setItem('kombi_last_ignition_ts', String(now));
      localStorage.setItem('kombi_last_extinguish_ts', String(now));
    }
  }, []);

  useEffect(() => {
    const onReset = () => handleResetHistoricalData();
    window.addEventListener('thermostat_history_reset', onReset);
    return () => window.removeEventListener('thermostat_history_reset', onReset);
  }, [handleResetHistoricalData]);

  // Bugün Açık Kalma Biçimlendirmesi (1. Açıklama)
  const todayActiveFormattedText = useMemo(() => {
    void liveTicker;
    if (dailyRunSeconds <= 0) return '0 dk (Beklemede)';
    const h = Math.floor(dailyRunSeconds / 3600);
    const m = Math.floor((dailyRunSeconds % 3600) / 60);
    const s = dailyRunSeconds % 60;
    if (h > 0) return `${h} sa ${m} dk`;
    if (m > 0) return `${m} dk ${s} sn`;
    return `${s} sn`;
  }, [dailyRunSeconds, liveTicker]);

  // En Son Ateşlemeden / Sönmeden Bu Yana Durum Biçimlendirmesi (2. Açıklama)
  const ignitionStatusFormattedText = useMemo(() => {
    void liveTicker;
    const now = Date.now();
    if (isKombiActive) {
      const elapsedSec = Math.max(0, Math.floor((now - lastIgnitionTime) / 1000));
      const m = Math.floor(elapsedSec / 60);
      const s = elapsedSec % 60;
      if (m > 0) return `${m} dk ${s} sn yanıyor`;
      return `${s} sn yanıyor`;
    } else {
      const elapsedSec = Math.max(0, Math.floor((now - lastExtinguishTime) / 1000));
      const h = Math.floor(elapsedSec / 3600);
      const m = Math.floor((elapsedSec % 3600) / 60);
      const s = elapsedSec % 60;
      if (h > 0) return `${h} sa ${m} dk süredir yanmıyor`;
      if (m > 0) return `${m} dk ${s} sn süredir yanmıyor`;
      return `${s} sn süredir yanmıyor`;
    }
  }, [isKombiActive, lastIgnitionTime, lastExtinguishTime, liveTicker]);

  // 🔥 Canlı Firebase Realtime Database Senkronizasyonu (Kombiden Canlı Veri Çekme)
  useEffect(() => {
    if (!firebaseUrl) return;
    const cleanUrl = firebaseUrl.replace(/\/+$/, '');
    const endpoint = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}/kombi.json`;

    let active = true;
    const syncFromCloud = async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && active) {
          if (typeof data.sicaklik === 'number') {
            setCurrentTemp(Number(data.sicaklik.toFixed(1)));
          }
          if (typeof data.nem === 'number') {
            setHumidity(Math.round(data.nem));
          }
          if (typeof data.hedefSicaklik === 'number' && !isUserInteractingRef.current) {
            setTargetTemp(Number(data.hedefSicaklik.toFixed(1)));
          }
          if (typeof data.calismaDakika === 'number') {
            setDailyRunSeconds(data.calismaDakika * 60);
          }
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.warn('Firebase senkronizasyon hatası:', err);
        if (active) setIsCloudConnected(false);
      }
    };

    syncFromCloud();
    const interval = setInterval(syncFromCloud, 2500); // 2.5 saniyede bir canlı çek
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [firebaseUrl]);

  // Sync DOM dark class with effectiveTheme
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  // Save themeMode preference
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme_preference', themeMode);
    }
  }, [themeMode]);

  // Cycle theme mode: system -> light -> dark -> system
  const handleCycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  // Load encrypted data on mount
  useEffect(() => {
    const loadVault = async () => {
      try {
        const storedSchedules = await SecureVault.getItem<ScheduleItem[]>('schedules', DEFAULT_SCHEDULES);
        if (storedSchedules) setSchedules(storedSchedules);

        const storedWidgets = await SecureVault.getItem<WidgetItem[]>('widgets', DEFAULT_WIDGETS);
        if (storedWidgets) setWidgets(storedWidgets);

        const storedTarget = await SecureVault.getItem<number>('targetTemp', 22.5);
        if (storedTarget) setTargetTemp(storedTarget);

        const storedTg = await SecureVault.getItem<{ token: string; chatId: string }>('telegram', { token: '', chatId: '' });
        if (storedTg) {
          setTelegramToken(storedTg.token);
          setTelegramChatId(storedTg.chatId);
        }

        const storedLocations = await SecureVault.getItem<LocationItem[]>('locations', DEFAULT_LOCATIONS);
        if (storedLocations && storedLocations.length > 0) {
          setLocations(storedLocations);
          setActiveLocation(storedLocations[0]);
        }

        const storedPin = await SecureVault.getItem<string>('vaultPin', '');
        if (storedPin) {
          setVaultPin(storedPin);
          setIsVaultLocked(true);
        }
      } catch (err) {
        console.warn('Vault load error:', err);
      }
    };

    loadVault();
  }, []);

  // Fetch real weather data when active location changes
  useEffect(() => {
    let isCancelled = false;
    const loadWeather = async () => {
      const data = await fetchOpenMeteoWeather(
        activeLocation.latitude,
        activeLocation.longitude,
        activeLocation.cityName
      );
      if (!isCancelled) {
        setWeather(data);
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeLocation]);

  // ── Infinite Horizontal Sliding Navigation ──
  const navigateToTab = useCallback((targetTabIdx: number) => {
    triggerHaptic('light');
    const n = tabs.length;
    const currentTab = ((virtualIndex % n) + n) % n;
    let diff = targetTabIdx - currentTab;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    setVirtualIndex((v) => v + diff);
  }, [virtualIndex, tabs.length]);

  const slidePrev = useCallback(() => {
    triggerHaptic('selection');
    setVirtualIndex((v) => v - 1);
  }, []);

  const slideNext = useCallback(() => {
    triggerHaptic('selection');
    setVirtualIndex((v) => v + 1);
  }, []);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        slidePrev();
      } else if (e.key === 'ArrowRight') {
        slideNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slidePrev, slideNext]);

  // Mouse wheel horizontal navigation
  const lastWheelTimeRef = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-dial-widget], [data-no-swipe], .no-swipe')) {
      return;
    }
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 450) return;
    if (Math.abs(e.deltaX) > 25 || (e.shiftKey && Math.abs(e.deltaY) > 25)) {
      if (e.deltaX > 25 || e.deltaY > 25) {
        slideNext();
        lastWheelTimeRef.current = now;
      } else if (e.deltaX < -25 || e.deltaY < -25) {
        slidePrev();
        lastWheelTimeRef.current = now;
      }
    }
  };

  // ── Touch Gesture Tracking (Parmakla Kaydırma & Gerçek Zamanlı 3D Deformasyon) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, button, [role="slider"], [data-no-swipe], .no-swipe, [data-dial-widget]')) {
      return;
    }
    dragStartXRef.current = e.touches[0].clientX;
    dragStartYRef.current = e.touches[0].clientY;
    isSwipeDirectionLockedRef.current = null;
    setIsDragging(true);
    setDragDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartXRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - dragStartXRef.current;
    const dy = currentY - dragStartYRef.current;

    if (isSwipeDirectionLockedRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isSwipeDirectionLockedRef.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (isSwipeDirectionLockedRef.current === true) {
      setDragDeltaX(dx);
    }
  };

  const handleTouchEnd = () => {
    if (isSwipeDirectionLockedRef.current === true) {
      if (dragDeltaX > 50) {
        slidePrev();
      } else if (dragDeltaX < -50) {
        slideNext();
      }
    }
    dragStartXRef.current = 0;
    dragStartYRef.current = 0;
    isSwipeDirectionLockedRef.current = null;
    setIsDragging(false);
    setDragDeltaX(0);
  };

  // ── Bottom Nav Dock Mouse Wheel & Touch Swipe Handlers ──
  const lastDockWheelTimeRef = useRef<number>(0);
  const handleDockWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastDockWheelTimeRef.current < 280) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 10) {
      if (delta > 0) {
        slideNext();
      } else {
        slidePrev();
      }
      lastDockWheelTimeRef.current = now;
    }
  };

  const dockTouchStartXRef = useRef<number>(0);
  const dockTouchStartYRef = useRef<number>(0);
  const dockSwipeLockedRef = useRef<boolean | null>(null);

  const handleDockTouchStart = (e: React.TouchEvent) => {
    dockTouchStartXRef.current = e.touches[0].clientX;
    dockTouchStartYRef.current = e.touches[0].clientY;
    dockSwipeLockedRef.current = null;
  };

  const handleDockTouchMove = (e: React.TouchEvent) => {
    if (!dockTouchStartXRef.current) return;
    const dx = e.touches[0].clientX - dockTouchStartXRef.current;
    const dy = e.touches[0].clientY - dockTouchStartYRef.current;
    if (dockSwipeLockedRef.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      dockSwipeLockedRef.current = Math.abs(dx) > Math.abs(dy);
    }
  };

  const handleDockTouchEnd = (e: React.TouchEvent) => {
    if (dockSwipeLockedRef.current === true && e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const dx = touchEndX - dockTouchStartXRef.current;
      if (dx < -25) {
        slideNext(); // Swiped right-to-left -> Next tab
      } else if (dx > 25) {
        slidePrev(); // Swiped left-to-right -> Prev tab
      }
    }
    dockTouchStartXRef.current = 0;
    dockTouchStartYRef.current = 0;
    dockSwipeLockedRef.current = null;
  };

  // ── Mouse Drag Gesture Tracking (Fareyle Parmak Gibi Kaydırma) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, button, [role="slider"], [data-no-swipe], .no-swipe, [data-dial-widget]')) {
      return;
    }
    isPointerDownRef.current = true;
    dragStartXRef.current = e.clientX;
    setIsDragging(true);
    setDragDeltaX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    setDragDeltaX(dx);
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    if (dragDeltaX > 55) {
      slidePrev();
    } else if (dragDeltaX < -55) {
      slideNext();
    }
    setDragDeltaX(0);
  };

  // Location handlers
  const handleSelectLocation = (loc: LocationItem) => {
    triggerHaptic('light');
    setActiveLocation(loc);
  };

  const handleAddLocation = (name: string, cityName: string) => {
    triggerHaptic('success');
    const cityCoords: Record<string, { lat: number; lon: number }> = {
      İstanbul: { lat: 41.0082, lon: 28.9784 },
      Ankara: { lat: 39.9334, lon: 32.8597 },
      İzmir: { lat: 38.4237, lon: 27.1428 },
      Bursa: { lat: 40.1885, lon: 29.061 },
      Antalya: { lat: 36.8969, lon: 30.7133 },
      Eskişehir: { lat: 39.7767, lon: 30.5206 },
      Trabzon: { lat: 41.0027, lon: 39.7168 },
      Gaziantep: { lat: 37.0662, lon: 37.3833 },
    };

    const coords = cityCoords[cityName] || { lat: 41.0, lon: 29.0 };
    const newLoc: LocationItem = {
      id: `loc-${Date.now()}`,
      name,
      cityName,
      district: cityName,
      latitude: coords.lat,
      longitude: coords.lon,
    };

    const updated = [...locations, newLoc];
    setLocations(updated);
    setActiveLocation(newLoc);
    SecureVault.setItem('locations', updated);
  };

  // Target Temp change handler
  const handleSetTarget = useCallback((newTarget: number) => {
    triggerHaptic('medium');
    setTargetTemp(newTarget);
    SecureVault.setItem('targetTemp', newTarget);
    isUserInteractingRef.current = true;
    if (userInteractTimerRef.current) clearTimeout(userInteractTimerRef.current);
    userInteractTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 3500);

    // Buluta anında ilet
    if (firebaseUrl) {
      const cleanUrl = firebaseUrl.replace(/\/+$/, '');
      const endpoint = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}/kombi.json`;
      fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hedefSicaklik: newTarget }),
      }).catch((e) => console.error('Hedef Firebase iletim hatası:', e));
    }
  }, [firebaseUrl]);


  // Save schedules
  const handleSaveSchedules = useCallback((newSchedules: ScheduleItem[]) => {
    setSchedules(newSchedules);
    SecureVault.setItem('schedules', newSchedules);
  }, []);

  // Save Telegram config
  const handleSaveTelegram = useCallback((token: string, chatId: string) => {
    setTelegramToken(token);
    setTelegramChatId(chatId);
    SecureVault.setItem('telegram', { token, chatId });
  }, []);

  // Save Widgets
  const handleSaveWidgets = useCallback((newWidgets: WidgetItem[]) => {
    setWidgets(newWidgets);
    SecureVault.setItem('widgets', newWidgets);
  }, []);

  // ── Tab & Sub-Menu Reordering Handlers (Active Screen Customizer) ──
  const handleMoveTab = (tabId: string, direction: 'up' | 'down') => {
    setTabsOrder((prev) => {
      const idx = prev.indexOf(tabId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      try {
        localStorage.setItem('app_tabs_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMoveReportSub = (subId: string, direction: 'up' | 'down') => {
    setReportSubOrder((prev) => {
      const idx = prev.indexOf(subId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      try {
        localStorage.setItem('app_report_sub_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMoveProgSub = (subId: string, direction: 'up' | 'down') => {
    setProgSubOrder((prev) => {
      const idx = prev.indexOf(subId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      try {
        localStorage.setItem('app_prog_sub_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetWidgetOrder = () => {
    const defTabs = ['genel', 'hava', 'rapor', 'program'];
    const defReport = ['heatmap', 'bill', 'sensors'];
    const defProg = ['schedule', 'consumption'];
    setTabsOrder(defTabs);
    setReportSubOrder(defReport);
    setProgSubOrder(defProg);
    try {
      localStorage.removeItem('app_tabs_order');
      localStorage.removeItem('app_report_sub_order');
      localStorage.removeItem('app_prog_sub_order');
    } catch {}
  };

  // Security Vault Handlers
  const handleSetPin = (newPin: string) => {
    setVaultPin(newPin);
    setIsVaultLocked(true);
    SecureVault.setItem('vaultPin', newPin);
  };

  const handleUnlockVault = (inputPin: string) => {
    if (inputPin === vaultPin) {
      setIsVaultLocked(false);
      return true;
    }
    return false;
  };

  const handleLockVault = () => {
    setIsVaultLocked(true);
  };

  const handleExportBackup = async () => {
    const backupData = {
      version: 1,
      targetTemp,
      schedules,
      widgets,
      locations,
      telegramToken,
      telegramChatId,
      exportedAt: new Date().toISOString(),
    };
    const encrypted = await encryptData(backupData, vaultPin || 'kombi-export-key');
    const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kombi_termostat_sifreli_yedek_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetVault = () => {
    setVaultPin('');
    setIsVaultLocked(false);
    setSchedules(DEFAULT_SCHEDULES);
    setWidgets(DEFAULT_WIDGETS);
    setLocations(DEFAULT_LOCATIONS);
    setActiveLocation(DEFAULT_LOCATIONS[0]);
    SecureVault.removeItem('vaultPin');
    SecureVault.removeItem('schedules');
    SecureVault.removeItem('widgets');
    SecureVault.removeItem('locations');
    SecureVault.removeItem('targetTemp');
    SecureVault.removeItem('telegram');
  };

  // Thermal feeling variables (from user's HTML knob 3 hue & glow concept mapped to targetTemp)
  const thermalProgress = Math.max(0, Math.min(1, (targetTemp - 16) / 14));
  const thermalHue = Math.round((250 + thermalProgress * 140) % 360);
  const thermalLit = 0.35 + thermalProgress * 0.55 + (isKombiActive ? 0.2 : 0);
  const thermalFlameOpacity = Math.min(0.85, 0.10 + thermalProgress * 0.50 + (isKombiActive ? 0.25 : 0));

  const currentModeName =
    Math.abs(targetTemp - 20.0) < 0.25
      ? 'EKO'
      : Math.abs(targetTemp - 22.5) < 0.25
      ? 'KONFOR'
      : Math.abs(targetTemp - 18.5) < 0.25
      ? 'GECE'
      : Math.abs(targetTemp - 25.0) < 0.25
      ? 'BOOST'
      : targetTemp < 20
      ? 'TASARRUF'
      : 'MANUEL';

  return (
    <div
      style={
        themeMode === 'tactile_deck'
          ? {
              background: `
                radial-gradient(48% 42% at 78% 40%, hsl(${thermalHue} 55% 48% / 0.38), transparent 72%),
                radial-gradient(42% 40% at 20% 78%, rgba(255, 140, 60, ${thermalFlameOpacity}), transparent 72%),
                linear-gradient(215deg, #706e8e 0%, #47435a 42%, #262330 100%)
              `,
            }
          : themeMode === 'obsidian_lavender'
          ? { background: activeObsidianPalette.bgStyle }
          : undefined
      }
      className={`h-[100dvh] max-h-[100dvh] w-screen relative ${
        themeMode === 'obsidian_lavender' || themeMode === 'tactile_deck'
          ? 'text-slate-100'
          : themeMode === 'glass'
          ? 'bg-transparent text-slate-100'
          : effectiveTheme === 'dark'
          ? 'dark bg-radial-[at_top] from-slate-900 via-slate-950 to-black text-slate-100'
          : 'bg-radial-[at_top] from-slate-100 via-sky-50/40 to-slate-200/80 text-slate-800'
      } font-sans transition-all duration-500 flex flex-col selection:bg-[#8261e6] selection:text-white overflow-hidden`}
    >
      {/* ── TACTILE DECK THERMAL HUE & FLAME AMBIENT TRAILS (Ultra Canavar Modunda Aktif, Eco Modda Kapalı) ── */}
      {themeMode === 'tactile_deck' && performanceMode === 'ultra' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-700">
          {/* Volumetric Thermal Hue Aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] sm:w-[1050px] h-[580px] sm:h-[720px] rounded-full blur-[90px] sm:blur-[120px] transition-all duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 65% 55% at 50% 50%, hsl(${thermalHue} 60% 48% / ${thermalLit * 0.45}) 0%, transparent 72%)`,
            }}
          />
          {/* Warm Flame Glow radiating from behind the stage cards */}
          <div
            className="absolute -top-16 -right-16 w-[560px] h-[560px] rounded-full blur-[85px] transition-all duration-700"
            style={{
              background: `radial-gradient(circle, rgba(255, 140, 60, ${thermalFlameOpacity * 0.75}) 0%, transparent 68%)`,
            }}
          />
          <div
            className="absolute -bottom-24 -left-20 w-[500px] h-[500px] rounded-full blur-[80px] transition-all duration-700"
            style={{
              background: `radial-gradient(circle, rgba(255, 110, 40, ${thermalFlameOpacity * 0.6}) 0%, transparent 68%)`,
            }}
          />
        </div>
      )}
      {/* ── VOLUMETRIC OBSIDIAN NEON AMBIENT TRAILS (Ultra Canavar Modunda Aktif, Eco Modda Kapalı) ── */}
      {themeMode === 'obsidian_lavender' && performanceMode === 'ultra' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-700">
          {/* Central volumetric aura radiating from behind the stage cards */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] sm:w-[980px] h-[550px] sm:h-[680px] rounded-full blur-[85px] sm:blur-[115px] transition-all duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${activeObsidianPalette.volumetricGlow} 0%, ${activeObsidianPalette.cardGlow} 40%, transparent 75%)`,
            }}
          />
          {/* Top-right corner neon plume */}
          <div
            className="absolute -top-16 -right-16 w-[520px] h-[520px] rounded-full blur-[80px] transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${activeObsidianPalette.glow} 0%, transparent 68%)`,
            }}
          />
          {/* Bottom-left corner neon plume */}
          <div
            className="absolute -bottom-24 -left-20 w-[480px] h-[480px] rounded-full blur-[75px] transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${activeObsidianPalette.glow} 0%, transparent 68%)`,
            }}
          />
        </div>
      )}

      {/* ── ATMOSPHERIC LIVE WEATHER CANVAS (Hareketli Bulut, Yağmur, Kar, Sis & Güneş Arka Planı) ── */}
      {(themeMode === 'glass' || themeMode === 'system') && (
        <AtmosphericWeatherBackground
          condition={effectiveWeatherCondition}
          isNight={isNightTime}
          performanceMode={performanceMode}
          ambientTemp={weather.temp}
          cityName={activeLocation.cityName}
        />
      )}

      {/* ── WEATHER NOTIFICATION TOAST POPUP (3 Saatlik Rapor & Önlem Bildirimi) ── */}
      {weatherToast && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 max-w-sm w-[92vw] p-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-amber-500/60 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 flex items-start gap-2.5">
          <span className="text-xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-amber-400 mb-0.5">{weatherToast.title}</h5>
            <p className="text-[11px] text-slate-200 leading-snug">{weatherToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setWeatherToast(null)}
            className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white shrink-0 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── TOP NAV HEADER ── */}
      <header
        className={`relative z-40 h-14 sm:h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between border-b transition-all duration-600 ease-out ${
          isAppLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2.5'
        } ${
          themeMode === 'tactile_deck'
            ? performanceMode === 'ultra'
              ? 'border-white/[0.08] bg-[#161422]/95 text-white backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.8)]'
              : 'border-white/[0.08] bg-[#161422] text-white shadow-md'
            : themeMode === 'obsidian_lavender'
            ? performanceMode === 'ultra'
              ? 'border-white/[0.08] bg-[#0c0a13]/90 text-white backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.8)]'
              : 'border-white/[0.08] bg-[#0c0a13] text-white shadow-md'
            : themeMode === 'glass'
            ? performanceMode === 'ultra'
              ? 'border-white/15 bg-slate-950/30 text-white backdrop-blur-2xl shadow-sm'
              : 'border-white/15 bg-slate-900 text-white shadow-sm'
            : performanceMode === 'ultra'
            ? 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-slate-900 dark:text-white truncate">
                Termostat 3D
              </h1>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <span className="flex items-center gap-1 truncate">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="truncate">{activeLocation.name} ({activeLocation.cityName})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher Flag Button (Placed in front of the 4 buttons) */}
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'tr' ? 'en' : 'tr'))}
            className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'tactile_deck'
                ? 'bg-[#1b1926] hover:bg-[#252234] border-t border-l border-white/[0.22] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                : themeMode === 'obsidian_lavender'
                ? 'bg-[#151322] hover:bg-[#1f1b2f] border-t border-l border-white/[0.14] border-r border-black/60 border-b border-black/80 text-white shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : themeMode === 'glass'
                ? 'bg-white/10 hover:bg-white/20 border-white/25 text-white backdrop-blur-md shadow-white/5'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            aria-label="Dil Değiştir / Switch Language"
            title={lang === 'tr' ? 'Türkçe (English için tıklayın)' : 'English (Click for Turkish)'}
          >
            <span className="text-sm leading-none drop-shadow-xs">{lang === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
            <span className="text-[11px] font-black tracking-tight">{lang === 'tr' ? 'TR' : 'EN'}</span>
          </button>

          {/* 1. Performance Mode Switch (Ultra 60FPS Canavar Modu vs Eco Sıfır Kasma) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              togglePerformanceMode();
            }}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
              themeMode === 'tactile_deck'
                ? performanceMode === 'ultra'
                  ? 'bg-[#221f2d] border-amber-500/70 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                  : 'bg-[#1a1824] border-emerald-500/70 text-emerald-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]'
                : themeMode === 'obsidian_lavender'
                ? performanceMode === 'ultra'
                  ? 'bg-[#1e1930] border-amber-500/60 text-amber-300 shadow-md'
                  : 'bg-[#151322] border-emerald-500/60 text-emerald-300 shadow-md'
                : performanceMode === 'ultra'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 dark:text-amber-400 shadow-sm'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm'
            }`}
            title={
              performanceMode === 'ultra'
                ? '60 FPS Ultra Canavar Modu (Yumuşak Blur & 3D Derinlik Geçişleri Aktif)'
                : 'Eco Tasarruf Modu (Sıfır Kasma: Tüm Blur ve Ağır Efektler Kapalı)'
            }
            aria-label="Performans modunu değiştir"
          >
            {performanceMode === 'ultra' ? (
              <>
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-black tracking-tight">60 FPS</span>
                <span className="hidden lg:inline text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Ultra</span>
              </>
            ) : (
              <>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-black tracking-tight">ECO</span>
                <span className="hidden lg:inline text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider">Sıfır Kasma</span>
              </>
            )}
          </button>

          {/* 2. Theme & Visual Effects Modal Trigger Button (Opens Pop-up Modal) */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'tactile_deck'
                ? 'bg-[#1b1926] hover:bg-[#252234] border-t border-l border-white/[0.22] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                : themeMode === 'obsidian_lavender'
                ? 'bg-[#151322] hover:bg-[#1f1b2f] border-t border-l border-white/[0.14] border-r border-black/60 border-b border-black/80 text-[#d8caff] shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
                : themeMode === 'glass'
                ? 'bg-blue-600/30 hover:bg-blue-600/45 border-blue-400/50 text-white backdrop-blur-md shadow-blue-500/10'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            aria-label="Tema ve görsel efekt ayarları"
            title={`${t.themeMenuTitle}: ${
              themeMode === 'tactile_deck'
                ? 'Tactile Deck'
                : themeMode === 'obsidian_lavender'
                ? 'Obsidian Lavender'
                : themeMode === 'glass'
                ? t.themeGlass
                : themeMode === 'system'
                ? t.themeAuto
                : themeMode === 'dark'
                ? t.themeDark
                : t.themeLight
            }`}
          >
            {themeMode === 'tactile_deck' ? (
              <>
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold hidden sm:inline text-amber-300">Tactile Deck</span>
              </>
            ) : themeMode === 'obsidian_lavender' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#a786ff] animate-pulse" />
                <span className="text-[10px] font-bold hidden sm:inline">Obsidian</span>
              </>
            ) : themeMode === 'glass' ? (
              <>
                <Layers className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span className="text-[10px] font-bold hidden sm:inline">{t.themeGlass}</span>
              </>
            ) : themeMode === 'system' ? (
              <>
                <Laptop className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold hidden sm:inline">{t.themeAuto}</span>
              </>
            ) : themeMode === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold hidden sm:inline">{t.themeDark}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold hidden sm:inline">{t.themeLight}</span>
              </>
            )}
          </button>

          {/* 3. Customize Widgets Button */}
          {/* 3. Customize Widgets & Menu Order Button */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            style={
              themeMode === 'obsidian_lavender'
                ? {
                    borderColor: activeObsidianPalette.borderUnder,
                    color: activeObsidianPalette.textColor,
                    boxShadow: `0 4px 14px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 12px ${activeObsidianPalette.glow.replace(/[\d.]+\)$/, '0.25)')}`,
                  }
                : undefined
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'tactile_deck'
                ? 'bg-[#1b1926] hover:bg-[#252234] border-t border-l border-white/[0.22] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                : themeMode === 'obsidian_lavender'
                ? 'bg-[#151322] hover:bg-[#201c32] border-t border-l border-white/[0.18] border-r border-b text-white shadow-[0_4px_14px_rgba(0,0,0,0.7)]'
                : themeMode === 'glass'
                ? 'bg-slate-950/40 hover:bg-slate-900/60 border border-white/20 hover:border-white/35 text-white backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3)]'
                : effectiveTheme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm'
                : 'bg-white/85 hover:bg-slate-100 border border-slate-200/90 text-slate-700 shadow-sm'
            }`}
            aria-label={t.customizeWidgets}
            title={t.customizeWidgets}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Smart Display Quick Launch (Mobil, Tablet & PC) */}
          <button
            type="button"
            onClick={() => setIsSmartDisplayOpen(true)}
            style={
              themeMode === 'obsidian_lavender'
                ? {
                    borderColor: activeObsidianPalette.borderUnder,
                    color: activeObsidianPalette.ringColor,
                  }
                : undefined
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'tactile_deck'
                ? 'bg-[#1b1926] hover:bg-[#252234] border-t border-l border-white/[0.22] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                : themeMode === 'obsidian_lavender'
                ? 'bg-[#151322] hover:bg-[#201c32] border-t border-l border-white/[0.18] border-r border-b shadow-[0_4px_14px_rgba(0,0,0,0.7)]'
                : themeMode === 'glass'
                ? 'bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/40 text-white backdrop-blur-md'
                : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-400/40'
            }`}
            aria-label="Smart Display / Ambiyans Modu"
            title="Smart Display / Ambiyans Modunu Başlat"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>

          {/* 4. Settings Gear Button (Ayarlar Çarkı - Aktif Temaya Tam Uyumlu) */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            style={
              themeMode === 'obsidian_lavender'
                ? {
                    borderColor: activeObsidianPalette.borderUnder,
                    color: activeObsidianPalette.textColor,
                    boxShadow: `0 4px 14px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 12px ${activeObsidianPalette.glow.replace(/[\d.]+\)$/, '0.25)')}`,
                  }
                : undefined
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer group ${
              themeMode === 'tactile_deck'
                ? 'bg-[#1b1926] hover:bg-[#252234] border-t border-l border-white/[0.22] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
                : themeMode === 'obsidian_lavender'
                ? 'bg-[#151322] hover:bg-[#201c32] border-t border-l border-white/[0.18] border-r border-b text-white shadow-[0_4px_14px_rgba(0,0,0,0.7)]'
                : themeMode === 'glass'
                ? 'bg-slate-950/40 hover:bg-slate-900/60 border border-white/20 hover:border-white/35 text-white backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3)]'
                : effectiveTheme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm'
                : 'bg-white/85 hover:bg-slate-100 border border-slate-200/90 text-slate-700 shadow-sm'
            }`}
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
          >
            <Settings className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
          </button>
        </div>
      </header>

      {/* ── Mode Switch Floating Notification Toast ── */}
      {perfToast && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-3 max-w-[92vw]">
          <div
            className={`px-3.5 py-2 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-2.5 ${
              perfToast.isUltra
                ? 'bg-[#1e182e]/95 border-amber-500/60 text-amber-300 shadow-[0_12px_36px_rgba(245,158,11,0.25)]'
                : 'bg-[#101b1b]/95 border-emerald-500/60 text-emerald-300 shadow-[0_12px_36px_rgba(16,185,129,0.2)]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                perfToast.isUltra ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {perfToast.isUltra ? (
                <Zap className="w-4 h-4 fill-current animate-pulse" />
              ) : (
                <BatteryCharging className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <span>{perfToast.title}</span>
              </div>
              <p className="text-[10.5px] text-white/80 font-medium leading-tight">
                {perfToast.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3D FLOATING CAROUSEL STAGE (Infinite Horizontal Pickup Deformation with Finger/Mouse Swipe) ── */}
      <main
        ref={stageRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full flex items-center justify-center overflow-hidden stage-3d select-none pt-1 sm:pt-1.5 pb-[56px] sm:pb-[64px] px-1.5 sm:px-3 cursor-grab active:cursor-grabbing touch-pan-y transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isAppLoaded
            ? 'opacity-100 scale-100 translate-y-0 filter-none'
            : 'opacity-0 scale-[0.96] translate-y-3.5 blur-[2px]'
        }`}
      >
        {/* Subtle Ambient Glow Behind Floating Windows (Ultra Canavar Modunda Aktif, Eco Modda Kapalı) */}
        {performanceMode === 'ultra' && (
          <div
            className={`absolute pointer-events-none w-[600px] h-[400px] rounded-full blur-[120px] transition-all duration-700 ${
              effectiveTheme === 'dark'
                ? isKombiActive
                  ? 'bg-orange-600/15'
                  : 'bg-indigo-600/12'
                : isKombiActive
                ? 'bg-amber-400/20'
                : 'bg-sky-400/15'
            }`}
          />
        )}

        {/* Floating Left / Right Navigation Buttons (Desktop & Tablet) */}
        <button
          type="button"
          onClick={slidePrev}
          aria-label="Önceki bölüme kaydır"
          className="absolute left-2 sm:left-5 lg:left-8 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700 shadow-xl text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all hidden md:flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={slideNext}
          aria-label="Sonraki bölüme kaydır"
          className="absolute right-2 sm:right-5 lg:right-8 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700 shadow-xl text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all hidden md:flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* ── 3D FLOATING CARDS (Ultra Canavar Modunda 3D Holografik Deck + Lens Odak Blur, Eco Modda Düz 2D Kaydırma) ── */}
        <div
          className="relative w-full max-w-5xl h-full max-h-[890px] flex items-center justify-center"
          style={{
            perspective: performanceMode === 'ultra' ? '1400px' : 'none',
            transformStyle: performanceMode === 'ultra' ? 'preserve-3d' : 'flat',
          }}
        >
          {tabs.map((tab, idx) => {
            const n = tabs.length;
            const currentTab = ((virtualIndex % n) + n) % n;
            let diff = idx - currentTab;
            if (diff > n / 2) diff -= n;
            if (diff < -n / 2) diff += n;

            // Compute effective 3D pickup deformation during finger/mouse drag
            const containerWidth = stageRef.current?.clientWidth || 550;
            const dragFraction = isDragging ? dragDeltaX / (containerWidth * 0.85) : 0;
            const effectiveOffset = diff + dragFraction;
            const absOffset = Math.abs(effectiveOffset);

            const isUltra = performanceMode === 'ultra';
            const isCenter = absOffset < 0.35;

            // 60 FPS ULTRA CANAVAR MODU:
            // 1. Kartlar ekrandan tamamen kaybolup gitmez: Sağ ve sol kanatlarda (effectiveOffset * 82%) 3D derinlikte durur.
            // 2. Kamera Odak Derinliği (Depth-of-Field Blur): Merkezdeki kart 0px kristal net; yan kanattaki kartlar lüks 12px buzlu lens fluluğuna ve %68 parlaklığa geçer.
            // 3. Opaklık koruması: Kartlar saydamlaşıp yok olmaz (opaklık 0.90 - 1.0 arası kalır), böylece gerçek bir optik netleme/flulaşma hissi yaşanır!
            // 4. Yan kanattaki flulaşmış karta dokunulduğunda doğrudan merkeze akıcı geçiş yapar.
            // ECO TASARRUF MODU:
            // 1. Sıfır Kasma: Tüm blur filtreleri (filter: none) ve 3D derinlik matrisi tamamen kapalıdır.
            // 2. Düz 2D yatay kaydırma (translateX: 100%, rotate: 0, translateZ: 0, scale: 1).
            // 3. Ultra hızlı ve hafif 220ms geçiş; ekrandan çıkan kartlar anında bellekten kaldırılır.
            const rotateY = isUltra ? Math.max(-32, Math.min(32, -effectiveOffset * 28)) : 0;
            const rotateZ = isUltra ? Math.max(-4, Math.min(4, effectiveOffset * -1.8)) : 0;
            const translateZ = isUltra ? -Math.min(360, absOffset * 220) : 0;
            const translateX = isUltra ? effectiveOffset * 82 : effectiveOffset * 100; // in %
            const scale = isUltra
              ? Math.max(0.78, 1 - Math.pow(absOffset, 1.1) * 0.16)
              : 1;
            const opacity = isUltra
              ? Math.max(0, 1 - Math.pow(Math.max(0, absOffset - 0.72), 1.5) * 2.2)
              : absOffset > 0.95 ? 0 : 1;
            const zIndex = isUltra ? Math.round(100 - absOffset * 25) : isCenter ? 50 : 10;

            // Ultra Canavar Modu Gerçekçi Lens Odak & Flulaşma (Depth of Field):
            // Merkez kart: 0px blur, 1.0 parlaklık.
            // Uzaklaşan veya yan kanattaki kart: 12px lens bluru ve odak dışı yumuşak ton.
            const blurPx = isUltra ? Math.min(12, absOffset * 10.5) : 0;
            const brightness = isUltra ? Math.max(0.68, 1 - absOffset * 0.32) : 1;
            const filterStyle = isUltra && blurPx > 0.3
              ? `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})`
              : 'none';

            // Only render cards reasonably close in space (Eco cuts immediately to save CPU)
            if (absOffset > (isUltra ? 2.1 : 1.05)) return null;

            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (!isCenter && isUltra && absOffset < 1.4) {
                    triggerHaptic('light');
                    navigateToTab(idx);
                  }
                }}
                style={{
                  transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                  filter: filterStyle,
                  opacity,
                  zIndex,
                  transition: isDragging
                    ? 'none'
                    : isUltra
                    ? 'transform 0.58s cubic-bezier(0.16, 1, 0.3, 1), filter 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease'
                    : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transformOrigin: '50% 50%',
                  pointerEvents: isCenter || (isUltra && absOffset < 1.35) ? 'auto' : 'none',
                  cursor: !isCenter && isUltra && absOffset < 1.35 ? 'pointer' : 'default',
                  boxShadow: !isUltra
                    ? undefined
                    : themeMode === 'obsidian_lavender'
                    ? isCenter
                      ? `0 28px 75px -15px rgba(0,0,0,0.95), 0 0 55px ${activeObsidianPalette.cardGlow}, inset 0 1px 1.5px rgba(255,255,255,0.18)`
                      : '0 12px 35px -10px rgba(0,0,0,0.8)'
                    : isCenter
                    ? '0 25px 65px -15px rgba(0,0,0,0.7), 0 0 35px rgba(249,115,22,0.15)'
                    : '0 10px 30px rgba(0,0,0,0.5)',
                  borderColor:
                    themeMode === 'obsidian_lavender' ? activeObsidianPalette.cardBorder : undefined,
                  willChange: isDragging ? 'transform' : isUltra ? 'transform, filter, opacity' : 'transform',
                }}
                className={`absolute inset-0 w-full h-full rounded-[30px] sm:rounded-[36px] overflow-hidden flex flex-col ${
                  themeMode === 'obsidian_lavender'
                    ? isUltra
                      ? 'bg-[#12101b]/95 border backdrop-blur-2xl text-white'
                      : 'bg-[#12101b] border border-white/10 text-white'
                    : themeMode === 'tactile_deck'
                    ? isUltra
                      ? 'bg-[#1b1924]/95 border-t border-l border-white/[0.18] border-r border-black/80 border-b-2 border-b-black/90 shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white'
                      : 'bg-[#1b1924] border-t border-l border-white/[0.18] border-r border-black/80 border-b-2 border-b-black/90 shadow-lg text-white'
                    : themeMode === 'glass'
                    ? isUltra
                      ? 'bg-slate-950/20 border border-white/30 shadow-[0_25px_60px_rgba(0,0,0,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-1.5px_2px_rgba(255,255,255,0.15)] backdrop-blur-md backdrop-saturate-150 text-white'
                      : 'bg-slate-900 border border-white/20 text-white'
                    : effectiveTheme === 'dark'
                    ? isUltra
                      ? 'bg-slate-900/90 border border-slate-700/70 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06),0_12px_36px_-10px_rgba(249,115,22,0.18)] backdrop-blur-2xl'
                      : 'bg-slate-900 border border-slate-700/70 shadow-md'
                    : isUltra
                    ? 'bg-white/90 border border-white/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.9),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl'
                    : 'bg-white border border-slate-200 shadow-md'
                }`}
              >
                {/* Frosted Glass Top Sheen & Curved Bevel Glare (Sadece Ultra Canavar Modunda) */}
                {isUltra && (themeMode === 'glass' || themeMode === 'obsidian_lavender' || themeMode === 'tactile_deck') && (
                  <div
                    style={
                      themeMode === 'obsidian_lavender'
                        ? {
                            background: `linear-gradient(to bottom, ${activeObsidianPalette.glow.replace(/[\d.]+\)$/, '0.18)')} 0%, transparent 100%)`,
                          }
                        : themeMode === 'tactile_deck'
                        ? {
                            background: 'linear-gradient(to bottom, rgba(255, 140, 60, 0.12) 0%, transparent 100%)',
                          }
                        : undefined
                    }
                    className={`absolute inset-x-0 top-0 h-36 pointer-events-none rounded-t-[30px] sm:rounded-t-[36px] ${
                      themeMode === 'glass'
                        ? 'bg-gradient-to-b from-white/[0.14] via-white/[0.03] to-transparent'
                        : ''
                    }`}
                  />
                )}

                {/* Floating Window Top Header Bar */}
                <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between shrink-0 relative z-10 ${
                  themeMode === 'obsidian_lavender'
                    ? isUltra ? 'border-white/[0.08] bg-[#14121e]/85 backdrop-blur-md' : 'border-white/[0.08] bg-[#14121e]'
                    : themeMode === 'tactile_deck'
                    ? isUltra ? 'border-white/[0.10] bg-[#171520]/90 backdrop-blur-md' : 'border-white/[0.10] bg-[#171520]'
                    : themeMode === 'glass'
                    ? isUltra ? 'border-white/15 bg-white/[0.08] backdrop-blur-md' : 'border-white/15 bg-slate-900'
                    : isUltra ? 'border-slate-200/70 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/40' : 'border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                      {tab.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1">
                      <span>👈</span>
                      <span className="hidden sm:inline">{t.swipeHint}</span>
                      <span>👉</span>
                    </span>
                  </div>
                </div>

                {/* Floating Window Content Body */}
                <div className={`flex-1 ${tab.id === 'genel' || tab.id === 'program' || tab.id === 'rapor' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'} p-2.5 sm:p-5 md:p-6 flex flex-col relative z-10`}>
                  
                  {/* ── CARD 1: GENEL (ÜSTTE STATÜ, ORTADA KÜÇÜLTÜLMÜŞ TERMOSTAT, ALTTA YATAY MOD BUTONLARI & STEPPER) ── */}
                  {tab.id === 'genel' && (
                    <div className="h-full w-full flex flex-col justify-between overflow-hidden select-none">
                      {/* Top Badges / Telemetry Bar */}
                      {themeMode === 'tactile_deck' ? (
                        <div className="w-full mb-1 shrink-0">
                          {/* Image 2: Sleek compact dark tactile telemetry capsule */}
                          <TactileTelemetryBar
                            currentTemp={currentTemp}
                            humidity={humidity}
                            waterPressure={1.6}
                            targetTemp={targetTemp}
                            isKombiActive={isKombiActive}
                            flameLevelPercent={flameLevelPercent}
                            thermalHue={thermalHue}
                          />
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between mb-1 shrink-0">
                          <div className={`px-2.5 py-1 rounded-full border shadow-xs flex items-center gap-1.5 sm:gap-2 backdrop-blur-md ${
                            themeMode === 'obsidian_lavender'
                              ? 'bg-[#151322] border-white/[0.08] shadow-[0_6px_16px_-3px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.12)] text-white'
                              : themeMode === 'glass'
                              ? 'bg-white/[0.12] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)] text-white'
                              : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                          }`}>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isKombiActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span className={`text-xs font-bold ${themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                              {isKombiActive ? t.activeHeating : t.standby}
                            </span>
                            <span className={`text-[10px] font-mono ${themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-[#c8b7f8]' : 'text-slate-500'}`}>
                              (%{flameLevelPercent} {t.modulation})
                            </span>
                          </div>

                          <div className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md ${
                            themeMode === 'obsidian_lavender'
                              ? 'bg-[#151322] border-white/[0.08] shadow-[0_6px_16px_-3px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.12)] text-white'
                              : themeMode === 'glass'
                              ? 'bg-white/[0.12] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)] text-white'
                              : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
                          }`}>
                            <span className={themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-[#a89dc7]' : 'text-slate-400'}>{t.liveRoom}</span>
                            <span className={`font-mono font-bold ${themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{currentTemp}°C</span>
                            <span className={themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-[#a89dc7]' : 'text-slate-400'}>• %{humidity}</span>
                          </div>
                        </div>
                      )}

                      {/* Center: Scaled 3D Thermostat or Tactile Dial (Image 3) */}
                      {themeMode === 'tactile_deck' ? (
                        <div className="flex-1 w-full flex items-center justify-center relative my-auto">
                          {/* Image 3: Exact 3D Rotary Thermostat with Glowing Marker and [-] ±0.5°C [+] */}
                          <TactileDialWidget
                            targetTemp={targetTemp}
                            currentTemp={currentTemp}
                            isKombiActive={isKombiActive}
                            onSetTarget={handleSetTarget}
                            activeModeName={currentModeName}
                            thermalHue={thermalHue}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[480px] h-[220px] xs:h-[250px] sm:h-[300px] md:h-[350px] mx-auto flex items-center justify-center relative my-auto">
                          <ThreeScene
                            key={`three-scene-${performanceMode}`}
                            theme={effectiveTheme}
                            morphMode={morphMode}
                            targetTemp={targetTemp}
                            currentTemp={currentTemp}
                            isKombiActive={isKombiActive}
                            flameLevelPercent={flameLevelPercent}
                            performanceMode={performanceMode === 'eco'}
                            reducedMotion={reducedMotion}
                            onSetTarget={handleSetTarget}
                          />
                        </div>
                      )}

                      {/* Non-tactile deck only: Dual Counter Bar + Stepper Strip */}
                      {themeMode !== 'tactile_deck' && (
                        <>
                          {/* ── TERMOSTAT ALTI CANLI ÇİFTLİ SAYAÇ BARI ── */}
                          <div className={`w-full flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border backdrop-blur-md shadow-2xs my-1 sm:my-1.5 transition-all ${
                            themeMode === 'obsidian_lavender'
                              ? 'bg-[#13111c]/95 border-white/[0.08] shadow-[0_12px_26px_-4px_rgba(0,0,0,0.8),inset_0_1px_1.5px_rgba(255,255,255,0.12),inset_0_-1.5px_2px_rgba(0,0,0,0.4)] text-white'
                              : themeMode === 'glass'
                              ? 'bg-white/[0.10] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3),0_6px_20px_rgba(0,0,0,0.25)] text-white'
                              : 'bg-white/85 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 shadow-xs'
                          }`}>
                            {/* 1. Açıklama: Bugün Açık Kalma Sayacı */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate ${
                                  themeMode === 'glass' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {t.todayActiveCounterLabel}
                                </span>
                                <span className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
                                  themeMode === 'glass' ? 'text-white' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {todayActiveFormattedText}
                                </span>
                              </div>
                            </div>

                            {/* Dikey İnce Ayırıcı Çizgi */}
                            <div className={`h-7 w-[1px] mx-2 shrink-0 ${
                              themeMode === 'glass' ? 'bg-white/15' : 'bg-slate-200 dark:bg-slate-700'
                            }`} />

                            {/* 2. Açıklama: En Son Ateşlemeden / Sönmeden Bu Yana Durum Sayacı */}
                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                              <div className="flex flex-col min-w-0 items-end">
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate flex items-center gap-1 ${
                                  themeMode === 'glass' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isKombiActive ? 'bg-orange-500 animate-pulse' : 'bg-sky-400'
                                  }`} />
                                  {t.lastIgnitionCounterLabel}
                                </span>
                                <span className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
                                  isKombiActive
                                    ? 'text-orange-500 drop-shadow-xs'
                                    : themeMode === 'glass'
                                    ? 'text-sky-300'
                                    : 'text-sky-600 dark:text-sky-400'
                                }`}>
                                  {ignitionStatusFormattedText}
                                </span>
                              </div>
                              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isKombiActive
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-400/40 animate-pulse'
                                  : 'bg-sky-500/15 text-sky-400 border-sky-400/30'
                              }`}>
                                {isKombiActive ? <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Target Stepper Strip (Compact Horizontal Frosted Glass / Obsidian Lavender) */}
                          <div className={`w-full flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all ${
                            themeMode === 'obsidian_lavender'
                              ? 'bg-[#13111c]/95 border-t border-l border-white/[0.12] border-r border-black/60 border-b-2 border-b-black/80 shadow-[0_12px_26px_-4px_rgba(0,0,0,0.8),inset_0_1px_1.5px_rgba(255,255,255,0.12),inset_0_-1.5px_2px_rgba(0,0,0,0.4)] text-white'
                              : themeMode === 'glass'
                              ? 'bg-white/[0.10] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.3)] text-white'
                              : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70 shadow-2xs'
                          }`}>
                            <button
                              type="button"
                              onClick={() => handleSetTarget(Math.max(10, Math.round((targetTemp - 0.5) * 2) / 2))}
                              className={`w-8 h-8 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 text-base cursor-pointer ${
                                themeMode === 'obsidian_lavender'
                                  ? 'bg-[#1a1727] hover:bg-[#252138] text-[#e2d9f3] border-t border-l border-white/[0.14] border-r border-black/60 border-b border-black/80 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1px_1px_rgba(0,0,0,0.4)]'
                                  : themeMode === 'glass'
                                  ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                                  : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white shadow-2xs'
                              }`}
                              title="Hedef sıcaklığı 0.5°C azalt"
                            >
                              -
                            </button>

                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-semibold uppercase tracking-wider hidden xs:inline ${
                                themeMode === 'obsidian_lavender'
                                  ? 'text-[#9f94bf]'
                                  : themeMode === 'glass'
                                  ? 'text-slate-300'
                                  : 'text-slate-400'
                              }`}>
                                {t.targetTemp}
                              </span>
                              <span
                                style={themeMode === 'obsidian_lavender' ? { color: activeObsidianPalette.textColor } : undefined}
                                className={`text-lg sm:text-xl font-black font-mono drop-shadow-sm ${
                                  themeMode === 'obsidian_lavender' ? '' : 'text-orange-500'
                                }`}
                              >
                                {targetTemp.toFixed(1)}°C
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSetTarget(Math.min(32, Math.round((targetTemp + 0.5) * 2) / 2))}
                              style={
                                themeMode === 'obsidian_lavender'
                                  ? {
                                      background: `linear-gradient(135deg, ${activeObsidianPalette.hex} 0%, ${activeObsidianPalette.ringColor} 50%, ${activeObsidianPalette.borderUnder} 100%)`,
                                      borderColor: activeObsidianPalette.borderUnder,
                                      boxShadow: `0 6px 16px rgba(0,0,0,0.7), 0 2px 10px ${activeObsidianPalette.glow}, inset 0 1px 1px rgba(255,255,255,0.35)`,
                                    }
                                  : undefined
                              }
                              className={`w-8 h-8 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 text-base cursor-pointer ${
                                themeMode === 'obsidian_lavender'
                                  ? 'text-white border-t border-l border-white/30 border-r border-b'
                                  : themeMode === 'glass'
                                  ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xs'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30 border border-orange-400/50'
                              }`}
                              title="Hedef sıcaklığı 0.5°C artır"
                            >
                              +
                            </button>
                          </div>
                        </>
                      )}

                      {/* Bottom: Preset Mode Buttons */}
                      <div className="w-full shrink-0 mt-auto pt-1">
                        {themeMode === 'tactile_deck' ? (
                          /* ── EXACT 4 CAPSULE BUTTONS FROM USER'S IMAGE 1 (BOMBELİ 3D + DERECE GÖSTERGELİ) ── */
                          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
                            {[
                              { id: 'EKO', label: 'EKO', temp: 20.0, icon: '🍃' },
                              { id: 'KONFOR', label: 'KONFOR', temp: 22.5, icon: '🔥' },
                              { id: 'GECE', label: 'GECE', temp: 18.5, icon: '🌙' },
                              { id: 'BOOST', label: 'BOOST', temp: 25.0, icon: '⚡' },
                            ].map((preset) => {
                              const isActive = Math.abs(targetTemp - preset.temp) < 0.25;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleSetTarget(preset.temp)}
                                  className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer font-bold transition-all duration-150 active:translate-y-1"
                                  style={{
                                    border: isActive
                                      ? '1px solid rgba(255, 200, 150, 0.45)'
                                      : '1px solid rgba(255, 255, 255, 0.16)',
                                    background: isActive
                                      ? 'linear-gradient(172deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 38%, transparent 60%), radial-gradient(ellipse 75% 100% at 50% 50%, rgba(255,140,50,0.92) 0%, rgba(210,80,20,0.65) 55%, transparent 85%), #2e2420'
                                      : 'linear-gradient(172deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.04) 40%, transparent 60%), radial-gradient(ellipse 70% 90% at 50% 45%, rgba(255,255,255,0.11) 0%, transparent 70%), #2a2734',
                                    boxShadow: isActive
                                      ? '0 3px 0 #0c0b10, 0 6px 14px rgba(0,0,0,0.8), 0 0 24px rgba(255,140,50,0.6), inset 0 1.5px 2px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.7)'
                                      : '0 6px 0 #0c0b10, 0 12px 18px rgba(0,0,0,0.7), inset 0 1.5px 2px rgba(255,255,255,0.3), inset 0 -2px 3px rgba(0,0,0,0.6)',
                                    transform: isActive ? 'translateY(3px)' : 'none',
                                    color: isActive ? '#fff7ed' : '#cfc9da',
                                    textShadow: isActive
                                      ? '0 0 4px #fff, 0 0 12px #ff9a4a, 0 0 20px #ff8a3a'
                                      : 'none',
                                  }}
                                >
                                  <span className={`text-xs sm:text-sm leading-none ${isActive ? 'drop-shadow-[0_0_8px_#ff9a4a]' : ''}`}>
                                    {preset.icon}
                                  </span>
                                  <span className="text-[11px] sm:text-xs font-black tracking-wide leading-tight">
                                    {preset.label}
                                  </span>
                                  <span className={`text-[10px] sm:text-[11px] font-mono font-black ${isActive ? 'text-amber-200' : 'text-slate-400'}`}>
                                    {preset.temp.toFixed(1)}°
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Original 5 presets for other themes */
                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
                            {[
                              { label: t.presetNight, temp: 18.5, icon: '🌙' },
                              { label: t.presetEco, temp: 20.0, icon: '🍃' },
                              { label: t.presetComfort, temp: 22.5, icon: '🔥' },
                              { label: t.presetAway, temp: 16.0, icon: '💼' },
                              { label: t.presetBoost, temp: 25.0, icon: '⚡' },
                            ].map((preset) => {
                              const isActive = Math.abs(targetTemp - preset.temp) < 0.25;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleSetTarget(preset.temp)}
                                  style={
                                    isActive && themeMode === 'obsidian_lavender'
                                      ? {
                                          background: `linear-gradient(135deg, ${activeObsidianPalette.hex} 0%, ${activeObsidianPalette.ringColor} 50%, ${activeObsidianPalette.borderUnder} 100%)`,
                                          borderColor: activeObsidianPalette.borderUnder,
                                          boxShadow: `0 10px 22px -3px rgba(0,0,0,0.8), 0 4px 14px ${activeObsidianPalette.glow}, inset 0 1px 1px rgba(255,255,255,0.35)`,
                                        }
                                      : undefined
                                  }
                                  className={`flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-center transition-all duration-200 cursor-pointer w-full min-w-0 ${
                                    isActive
                                      ? themeMode === 'obsidian_lavender'
                                        ? 'text-white font-extrabold border-t border-l border-white/30 border-r border-b-2 scale-[1.03]'
                                        : themeMode === 'glass'
                                        ? 'bg-white/25 text-white font-extrabold border-2 border-white/40 shadow-md backdrop-blur-md scale-[1.03]'
                                        : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold shadow-lg shadow-orange-500/35 border border-orange-400/80 scale-[1.03]'
                                      : themeMode === 'obsidian_lavender'
                                      ? 'bg-[#14121e]/90 hover:bg-[#1c1929] text-[#c8b7f8] border-t border-l border-white/[0.12] border-r border-black/60 border-b-2 border-b-black/80 shadow-[0_8px_18px_-2px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-1.5px_1.5px_rgba(0,0,0,0.5)]'
                                      : themeMode === 'glass'
                                      ? 'bg-white/[0.09] hover:bg-white/[0.18] text-white border border-white/20 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)]'
                                      : 'bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-orange-400'
                                  }`}
                                >
                                  <span className="text-sm sm:text-base leading-none mb-0.5 drop-shadow-xs">{preset.icon}</span>
                                  <span className="text-[11px] sm:text-xs font-bold leading-tight truncate w-full">
                                    {preset.label}
                                  </span>
                                  <span
                                    className={`text-[10px] sm:text-xs font-mono font-extrabold ${
                                      isActive ? 'text-white' : themeMode === 'glass' || themeMode === 'obsidian_lavender' ? 'text-[#c8b7f8]' : 'text-slate-400 dark:text-slate-400'
                                    }`}
                                  >
                                    {preset.temp}°
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 text-center leading-tight mt-1">
                          {t.dialAdjustHint}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── CARD 2: HAVA DURUMU ── */}
                  {tab.id === 'hava' && (
                    <div className="h-full flex flex-col justify-center">
                      <ForecastSection
                        weather={weather}
                        locations={locations}
                        activeLocation={activeLocation}
                        onSelectLocation={handleSelectLocation}
                        onAddLocation={handleAddLocation}
                        notificationsEnabled={isWeatherNotificationsEnabled}
                        onToggleNotifications={setIsWeatherNotificationsEnabled}
                        onTriggerTestNotification={handleTriggerWeatherNotification}
                        themeMode={themeMode}
                        obsidianPalette={activeObsidianPalette}
                        lang={lang}
                      />
                    </div>
                  )}

                  {/* ── CARD 3: RAPOR ── */}
                  {tab.id === 'rapor' && (
                    <div className="h-full w-full overflow-hidden select-none">
                      <ReportDeckView
                        isKombiActive={isKombiActive}
                        flameLevelPercent={flameLevelPercent}
                        waterPressure={waterPressure}
                        pumpRpm={1420}
                        currentTemp={currentTemp}
                        humidity={humidity}
                        targetTemp={targetTemp}
                        dailyRunMinutes={dailyRunMinutes}
                        lastIgnitionTime={lastIgnitionTime}
                        themeMode={themeMode}
                        lang={lang}
                        obsidianPalette={activeObsidianPalette}
                        reportSubOrder={reportSubOrder}
                      />
                    </div>
                  )}

                  {/* ── CARD 4: PROGRAM ── */}
                  {tab.id === 'program' && (
                    <div className="h-full w-full overflow-hidden select-none">
                      <ProgramDeckView
                        schedules={schedules}
                        onSaveSchedules={handleSaveSchedules}
                        isEncrypted={true}
                        dailyRunMinutes={dailyRunMinutes}
                        flameLevelPercent={flameLevelPercent}
                        themeMode={themeMode}
                        lang={lang}
                        obsidianPalette={activeObsidianPalette}
                        progSubOrder={progSubOrder}
                      />
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── FIXED BOTTOM AESTHETIC FLOATING TAB DOCK (4'lü Bar + Dışında Sağda Sesli Komut Butonu) ── */}
      <nav
        aria-label="Sabit Alt Gezinme Barı"
        className={`fixed bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[96vw] select-none flex items-center gap-1.5 sm:gap-2.5 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100 ${
          isAppLoaded
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* 4'lü Menü Çerçevesi (Termo., Hava, Rapor, Prog. - Mouse Wheel & Swipe Yetkili) */}
        <div
          onWheel={handleDockWheel}
          onTouchStart={handleDockTouchStart}
          onTouchMove={handleDockTouchMove}
          onTouchEnd={handleDockTouchEnd}
          onTouchCancel={handleDockTouchEnd}
          style={
            themeMode === 'obsidian_lavender'
              ? {
                  boxShadow: `0 16px 40px -5px rgba(0,0,0,0.85), 0 0 25px ${activeObsidianPalette.cardGlow}, inset 0 1px 1.5px rgba(255,255,255,0.12), inset 0 -1.5px 2px rgba(0,0,0,0.5)`,
                }
              : themeMode === 'tactile_deck'
              ? {
                  boxShadow: '0 16px 40px rgba(0,0,0,0.92), 0 0 30px rgba(255,140,50,0.15), inset 0 1.5px 2px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.8)',
                }
              : undefined
          }
          className={`flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-full ${
            performanceMode === 'ultra' ? 'backdrop-blur-2xl' : ''
          } transition-all touch-pan-x ${
            themeMode === 'obsidian_lavender'
              ? 'bg-[#12101b] border-t border-l border-white/[0.12] border-r border-black/70 border-b-2 border-b-black/85'
              : themeMode === 'tactile_deck'
              ? 'bg-[#161422] border border-white/[0.14]'
              : themeMode === 'glass'
              ? performanceMode === 'ultra'
                ? 'bg-slate-950/40 border border-white/20 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                : 'bg-slate-900 border border-white/20 shadow-md'
              : performanceMode === 'ultra'
              ? 'bg-white/85 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-700/80 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.25)]'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md'
          }`}
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTabIndex === idx;
            return (
              <button
                key={tab.id}
                type="button"
                onPointerDown={() => triggerHaptic('selection')}
                onClick={() => {
                  triggerHaptic('selection');
                  navigateToTab(idx);
                }}
                style={
                  isActive && themeMode === 'obsidian_lavender'
                    ? {
                        borderColor: activeObsidianPalette.borderUnder,
                        boxShadow: `0 8px 18px rgba(0,0,0,0.7), 0 2px 14px ${activeObsidianPalette.glow}, inset 0 1px 1px rgba(255,255,255,0.35)`,
                      }
                    : isActive && themeMode === 'tactile_deck'
                    ? {
                        background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                        border: '1px solid rgba(255, 200, 150, 0.45)',
                        boxShadow: '0 2px 0 #0c0b10, 0 4px 10px rgba(0,0,0,0.8), 0 0 22px rgba(255,145,50,0.6), inset 0 1.5px 2px rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.7)',
                        transform: 'translateY(2px)',
                        color: '#fff7ed',
                        textShadow: '0 0 8px rgba(255,160,70,0.8)',
                      }
                    : !isActive && themeMode === 'tactile_deck'
                    ? {
                        background: 'linear-gradient(172deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 40%, transparent 60%), radial-gradient(ellipse 70% 90% at 50% 45%, rgba(255,255,255,0.10) 0%, transparent 70%), #272533',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 4px 0 #0c0b10, 0 8px 14px rgba(0,0,0,0.7), inset 0 1px 1.5px rgba(255,255,255,0.25), inset 0 -1.5px 2px rgba(0,0,0,0.5)',
                        color: '#cfc9db',
                      }
                    : undefined
                }
                className={`relative px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-w-0 whitespace-nowrap active:translate-y-0.5 ${
                  isActive
                    ? themeMode === 'obsidian_lavender'
                      ? `bg-gradient-to-r ${activeObsidianPalette.gradient} text-white border-t border-l border-white/30 border-r border-b-2 scale-105`
                      : themeMode === 'tactile_deck'
                      ? ''
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-orange-500 text-white shadow-md shadow-blue-500/30 dark:shadow-orange-500/30 scale-105'
                    : themeMode === 'obsidian_lavender'
                    ? 'text-[#9a93b5] hover:text-white hover:bg-[#1f1b2d] border border-transparent hover:border-white/[0.06]'
                    : themeMode === 'tactile_deck'
                    ? 'hover:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span className="text-xs sm:text-sm shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse hidden sm:inline-block shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 4'lü Barın DIŞINDA, EN SAĞINDA AYNI HİZADA SESLİ KOMUT BUTONU */}
        <button
          type="button"
          onPointerDown={() => triggerHaptic('medium')}
          onClick={() => {
            triggerHaptic('medium');
            setIsVoiceAssistantOpen(true);
          }}
          style={
            themeMode === 'tactile_deck'
              ? {
                  background: 'linear-gradient(172deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 40%, transparent 60%), radial-gradient(circle at 50% 45%, rgba(255,145,50,0.9), #2f2520)',
                  border: '1px solid rgba(255, 200, 150, 0.45)',
                  boxShadow: '0 4px 0 #0c0b10, 0 8px 16px rgba(0,0,0,0.8), 0 0 20px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.5)',
                }
              : undefined
          }
          className={`relative p-2 xs:p-2.5 sm:p-3 rounded-2xl sm:rounded-full backdrop-blur-2xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 shadow-lg group shrink-0 ${
            themeMode === 'obsidian_lavender'
              ? `bg-gradient-to-tr ${activeObsidianPalette.gradient} border-t border-l border-white/35 border-r border-[#3b1c8a] border-b border-b-[#230e58] text-white shadow-[0_8px_22px_rgba(0,0,0,0.7),0_0_15px_rgba(130,97,230,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)]`
              : themeMode === 'tactile_deck'
              ? 'text-white'
              : themeMode === 'glass'
              ? 'bg-gradient-to-tr from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 border border-white/30 text-white shadow-blue-500/30'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 border border-blue-400/40'
          }`}
          title={t.voiceAssistantBtnTooltip}
          aria-label={t.voiceAssistantTitle}
        >
          <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
        </button>
      </nav>

      {/* ── MODALS ── */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={themeMode}
        onSelectTheme={(newTheme) => setThemeMode(newTheme)}
        performanceMode={performanceMode}
        onSelectPerformanceMode={(perf) => togglePerformanceMode(perf)}
        activeWeatherCondition={effectiveWeatherCondition}
        onSelectWeatherConditionOverride={setWeatherConditionOverride}
        weatherConditionOverride={weatherConditionOverride}
        cityName={activeLocation.cityName}
        lang={lang}
        obsidianPaletteIdx={obsidianPaletteIdx}
        onSelectObsidianPaletteIdx={handleSelectObsidianPalette}
      />

      <WidgetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        tabsOrder={tabsOrder}
        onMoveTab={handleMoveTab}
        reportSubOrder={reportSubOrder}
        onMoveReportSub={handleMoveReportSub}
        progSubOrder={progSubOrder}
        onMoveProgSub={handleMoveProgSub}
        onResetOrder={handleResetWidgetOrder}
        themeMode={themeMode}
        obsidianPalette={activeObsidianPalette}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dbUrl={firebaseUrl}
        apiKey={firebaseKey}
        onSaveCloudSettings={(url, key) => {
          setFirebaseUrl(url);
          setFirebaseKey(key);
          setIsCloudConnected(true);
        }}
        isConnected={isCloudConnected}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenGoogleHomeModal={() => setIsGoogleHomeOpen(true)}
        lang={lang}
        isWeatherNotificationsEnabled={isWeatherNotificationsEnabled}
        onToggleWeatherNotifications={setIsWeatherNotificationsEnabled}
        onTriggerTestNotification={handleTriggerWeatherNotification}
        onResetHistoricalData={handleResetHistoricalData}
        smartDisplayConfig={smartDisplayConfig}
        onUpdateSmartDisplayConfig={handleUpdateSmartDisplayConfig}
        onLaunchSmartDisplay={() => setIsSmartDisplayOpen(true)}
        themeMode={themeMode}
        obsidianPalette={activeObsidianPalette}
        isHapticsEnabled={isHapticsEnabled}
        onToggleHaptics={setIsHapticsEnabled}
        isStartupSplashEnabled={isStartupSplashEnabled}
        onToggleStartupSplash={setIsStartupSplashEnabled}
        onPreviewStartupSplash={() => {
          setIsSplashPreview(true);
          setShowStartupSplash(true);
        }}
        mascotConfig={mascotConfig}
        onUpdateMascotConfig={handleUpdateMascotConfig}
        currentTemp={currentTemp}
        targetTemp={targetTemp}
        isKombiActive={isKombiActive}
      />

      <VaultNotificationsModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isVaultLocked={isVaultLocked}
        vaultPin={vaultPin}
        onSetPin={handleSetPin}
        onUnlockVault={handleUnlockVault}
        onLockVault={handleLockVault}
        onExportBackup={handleExportBackup}
        onResetVault={handleResetVault}
        telegramToken={telegramToken}
        telegramChatId={telegramChatId}
        onSaveTelegram={handleSaveTelegram}
        themeMode={themeMode}
      />

      {/* ── SESLİ KOMUT ASİSTANI MODALI ── */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        lang={lang}
        targetTemp={targetTemp}
        currentTemp={currentTemp}
        isKombiActive={isKombiActive}
        flameLevelPercent={flameLevelPercent}
        waterPressure={waterPressure}
        todayActiveText={todayActiveFormattedText}
        onSetTargetTemp={handleSetTarget}
        onNavigateToTab={(idx) => navigateToTab(idx)}
        themeMode={themeMode}
      />

      {/* ── GOOGLE HOME & ASİSTAN ENTEGRASYON MODALI ── */}
      <GoogleHomeModal
        isOpen={isGoogleHomeOpen}
        onClose={() => setIsGoogleHomeOpen(false)}
        lang={lang}
        firebaseUrl={firebaseUrl}
        currentTemp={currentTemp}
        targetTemp={targetTemp}
        isKombiActive={isKombiActive}
        onSetTargetTemp={handleSetTarget}
        themeMode={themeMode}
      />

      {/* ── SMART DISPLAY & AMBİYANS MODU OVERLAY (Tablet & Masaüstü) ── */}
      <SmartDisplayOverlay
        isOpen={isSmartDisplayOpen}
        onClose={() => setIsSmartDisplayOpen(false)}
        config={smartDisplayConfig}
        onUpdateConfig={handleUpdateSmartDisplayConfig}
        currentTemp={currentTemp}
        targetTemp={targetTemp}
        isKombiActive={isKombiActive}
        weather={weather}
        onSetTargetTemp={handleSetTarget}
        themeMode={themeMode}
        mascotConfig={mascotConfig}
      />

      {/* ── Mini TermoBot Companion on Main Screen (if user enabled in settings) ── */}
      {mascotConfig.enabled && mascotConfig.showOnMainScreen && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-30 pointer-events-auto">
          <TermoBotMascot
            themeMode={themeMode}
            currentTemp={currentTemp}
            targetTemp={targetTemp}
            isKombiActive={isKombiActive}
            size="sm"
            interactive={true}
          />
        </div>
      )}

      {/* ── TACTILE HARDWARE STARTUP BOOT SPLASH (Mekanik Teşhis & Alev Kalibrasyonu) ── */}
      {showStartupSplash && (
        <StartupBootSplash
          onComplete={handleSplashComplete}
          isPreview={isSplashPreview}
        />
      )}
    </div>
  );
}
