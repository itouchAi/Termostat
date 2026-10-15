import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Zap,
  Settings,
  SlidersHorizontal,
  Flame,
  LayoutGrid,
  ShieldCheck,
  ChevronDown,
  Clock,
} from 'lucide-react';

import type { ThemeMode, MorphMode, ScheduleItem, WidgetItem } from './types.ts';
import { ThreeScene } from './components/ThreeCanvas/ThreeScene.tsx';
import { ForecastSection } from './components/Weather/ForecastSection.tsx';
import { CoreGaugeWidget } from './components/Widgets/CoreGaugeWidget.tsx';
import { TargetControlWidget } from './components/Widgets/TargetControlWidget.tsx';
import { ModulationWidget } from './components/Widgets/ModulationWidget.tsx';
import { AnalyticsChartWidget } from './components/Widgets/AnalyticsChartWidget.tsx';
import { WeeklyScheduleWidget } from './components/Widgets/WeeklyScheduleWidget.tsx';
import { ConsumptionWidget } from './components/Widgets/ConsumptionWidget.tsx';
import { TelegramConfigWidget } from './components/Widgets/TelegramConfigWidget.tsx';
import { SecurityVaultWidget } from './components/Widgets/SecurityVaultWidget.tsx';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

import {
  calculateRelayStatus,
  calculateFlameModulation,
  evaluateActiveSchedule,
  resolveEffectiveTheme,
} from './utils/thermostatRules.ts';
import { SecureVault, encryptData } from './utils/crypto.ts';
import {
  DEFAULT_LOCATIONS,
  type LocationItem,
  type CurrentWeather,
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

const SECTIONS = [
  { id: 'sec-thermostat', label: 'Termostat' },
  { id: 'sec-weather', label: 'Hava Durumu' },
  { id: 'sec-target', label: 'Hedef Sıcaklık' },
  { id: 'sec-modulation', label: 'Kombi Röle' },
  { id: 'sec-analytics', label: 'Analitik & Diğer' },
];

export default function App() {
  // ── Theme State: 'light' | 'dark' | 'system' ──
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_preference') as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'system'; // Default to system automatic schedule
  });

  const [nowTime, setNowTime] = useState<Date>(() => new Date());

  // Clock tick to update system theme every 30 seconds
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Compute effective 'light' or 'dark'
  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    const h = nowTime.getHours();
    const m = nowTime.getMinutes();
    const osDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    return resolveEffectiveTheme(themeMode, h, m, osDark);
  }, [themeMode, nowTime]);

  const [performanceMode, setPerformanceMode] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ana' | 'rapor' | 'program' | 'all'>('ana');

  // Thermostat vitals
  const [currentTemp, setCurrentTemp] = useState<number>(21.8);
  const [humidity, setHumidity] = useState<number>(48);
  const [targetTemp, setTargetTemp] = useState<number>(22.5);
  const [waterPressure, setWaterPressure] = useState<number>(1.6);
  const [dailyRunMinutes, setDailyRunMinutes] = useState<number>(145);

  // 3D Morph Mode
  const [morphMode, setMorphMode] = useState<MorphMode>('heat');

  // Locations & Weather
  const [locations, setLocations] = useState<LocationItem[]>(DEFAULT_LOCATIONS);
  const [activeLocation, setActiveLocation] = useState<LocationItem>(DEFAULT_LOCATIONS[0]);
  const [weather, setWeather] = useState<CurrentWeather>(() =>
    getFallbackForecast(DEFAULT_LOCATIONS[0].cityName)
  );

  // Modals
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // Active section tracker for Apple-style dot pagination
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-thermostat');

  // Temperature History
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

  // Derive relay and flame modulation
  const isKombiActive = useMemo(() => {
    return calculateRelayStatus(currentTemp, targetTemp, true, 0.4);
  }, [currentTemp, targetTemp]);

  const flameLevelPercent = useMemo(() => {
    return calculateFlameModulation(currentTemp, targetTemp, isKombiActive);
  }, [currentTemp, targetTemp, isKombiActive]);

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

  // Section Observer for Apple-style dot pagination
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.35;
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSectionId(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Location handlers
  const handleSelectLocation = (loc: LocationItem) => {
    setActiveLocation(loc);
  };

  const handleAddLocation = (name: string, cityName: string) => {
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
    setTargetTemp(newTarget);
    SecureVault.setItem('targetTemp', newTarget);
  }, []);

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

  const handleToggleWidget = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    handleSaveWidgets(updated);
  };

  const handleMoveWidget = (id: string, dir: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const tempOrder = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = tempOrder;

    handleSaveWidgets(sorted);
  };

  const handleResetWidgets = () => {
    handleSaveWidgets(DEFAULT_WIDGETS);
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

  return (
    <div
      className={`min-h-screen ${
        effectiveTheme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
      } font-sans transition-colors duration-500 flex flex-col selection:bg-blue-500 selection:text-white scroll-smooth`}
    >
      {/* ── TOP NAV HEADER ── */}
      <header className="sticky top-0 z-50 min-h-16 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 md:px-8 flex items-center justify-between shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 dark:text-white truncate">
                Kombi Termostat 3D
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                SABİT KADRAN
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {activeLocation.name} ({activeLocation.cityName})
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                AES-256
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Performance Mode Switch */}
          <button
            type="button"
            onClick={() => setPerformanceMode((p) => !p)}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              performanceMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Düşük donanımlı cihazlarda yüksek FPS modu"
            aria-label="Performans modunu değiştir"
          >
            <Zap className={`w-3.5 h-3.5 ${performanceMode ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden md:inline">
              {performanceMode ? 'Performans Modu' : 'Canlı Alev'}
            </span>
          </button>

          {/* 3-State Theme Toggle (Gündüz / Gece / Sistem Otomatik) */}
          <button
            type="button"
            onClick={handleCycleTheme}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            aria-label={`Tema modunu değiştir (Şu an: ${
              themeMode === 'system' ? 'Sistem Otomatik' : themeMode === 'dark' ? 'Gece' : 'Gündüz'
            })`}
            title={`Tema: ${
              themeMode === 'system'
                ? `Sistem (Otomatik Saat: ${effectiveTheme === 'dark' ? 'Gece' : 'Gündüz'})`
                : themeMode === 'dark'
                ? 'Gece Modu'
                : 'Gündüz Modu'
            }`}
          >
            {themeMode === 'system' ? (
              <>
                <Laptop className="w-4 h-4 text-blue-500" />
                <span className="text-[11px] font-bold hidden sm:inline">Oto</span>
              </>
            ) : themeMode === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-bold hidden sm:inline">Gece</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold hidden sm:inline">Gündüz</span>
              </>
            )}
          </button>

          {/* Customize Widgets Button */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            aria-label="Widget'ları Kişiselleştir"
            title="Widget'ları Kişiselleştir"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Cloud Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            aria-label="Ayarlar"
            title="Ayarlar & Firebase"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── APPLE-STYLE RIGHT-SIDE VERTICAL SECTION DOTS ── */}
      <nav
        aria-label="Bölüm Gezintisi"
        className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2.5 bg-slate-900/30 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-full border border-slate-200/40 dark:border-slate-700/50 shadow-lg"
      >
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollToSection(sec.id)}
            aria-label={`${sec.label} bölümüne kaydır`}
            title={sec.label}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSectionId === sec.id
                ? 'bg-blue-500 scale-125 ring-4 ring-blue-500/20'
                : 'bg-slate-400/60 dark:bg-slate-500 hover:bg-blue-400'
            }`}
          />
        ))}
      </nav>

      {/* ── MAIN APPLE-STYLE SNAP SCROLL CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col gap-8 md:gap-14">
        
        {/* ── BÖLÜM 1: SABİT TERMOSTAT & KADRAN ── */}
        <section
          id="sec-thermostat"
          aria-label="Sabit 3D Termostat"
          className="min-h-[82vh] flex flex-col justify-between items-center rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8"
        >
          {/* Top Status Banner */}
          <div className="w-full flex items-center justify-between">
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isKombiActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {isKombiActive ? 'Aktif Isıtma 🔥' : 'Beklemede ❄️'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                (%{flameLevelPercent} modülasyon)
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Bağlı:</span>
              <span className="text-slate-800 dark:text-white font-bold">Kombi #1</span>
            </div>
          </div>

          {/* Centerpiece: Fixed 3D Thermostat with authentic bottom flame */}
          <div className="w-full max-w-md my-auto py-4">
            <ThreeScene
              theme={effectiveTheme}
              morphMode={morphMode}
              targetTemp={targetTemp}
              currentTemp={currentTemp}
              isKombiActive={isKombiActive}
              performanceMode={performanceMode}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Bottom Smooth Slide-Down Indicator */}
          <button
            type="button"
            onClick={() => scrollToSection('sec-weather')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold tracking-wide">
              Hava Durumu İçin Aşağı Kaydırın
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-y-0.5" />
          </button>
        </section>

        {/* ── BÖLÜM 2: 5 GÜNLÜK HAVA TAHMİNİ & KONUM ── */}
        <section
          id="sec-weather"
          aria-label="5 Günlük Hava Tahmini ve Konum"
          className="min-h-[70vh] flex flex-col justify-center rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              Bölgesel Hava Durumu & 5 Günlük Tahmin
            </h2>
            <button
              type="button"
              onClick={() => scrollToSection('sec-target')}
              className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline"
            >
              Hedef Ayarlara Geç <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <ForecastSection
            weather={weather}
            locations={locations}
            activeLocation={activeLocation}
            onSelectLocation={handleSelectLocation}
            onAddLocation={handleAddLocation}
          />
        </section>

        {/* ── BÖLÜM 3: GEZİNME SEKMELERİ & HEDEF SICAKLIK KONTROLÜ ── */}
        <section
          id="sec-target"
          aria-label="Sekmeler ve Hedef Sıcaklık"
          className="min-h-[75vh] flex flex-col justify-center rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8"
        >
          {/* Evenly distributed 4 Tabs Bar (Genel, Rapor, Program, Tümü) */}
          <div className="w-full mb-6">
            <div className="grid grid-cols-4 w-full bg-slate-200/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 gap-1 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('ana')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ana'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="text-sm">🏠</span>
                <span className="truncate">Genel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rapor')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'rapor'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="text-sm">📊</span>
                <span className="truncate">Rapor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'program'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="text-sm">⏰</span>
                <span className="truncate">Program</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="truncate">Tümü</span>
              </button>
            </div>
          </div>

          {/* Target Temperature Control Card */}
          <TargetControlWidget
            targetTemp={targetTemp}
            onSetTarget={handleSetTarget}
            isKombiActive={isKombiActive}
          />
        </section>

        {/* ── BÖLÜM 4: KOMBİ RÖLE & TELEMETRİ + ORTAM SENSÖRLERİ ── */}
        <section
          id="sec-modulation"
          aria-label="Kombi Röle ve Telemetri"
          className="min-h-[75vh] flex flex-col justify-center rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ModulationWidget
              isKombiActive={isKombiActive}
              flameLevelPercent={flameLevelPercent}
              waterPressureBar={waterPressure}
              pumpRpm={1420}
            />
            <CoreGaugeWidget
              currentTemp={currentTemp}
              humidity={humidity}
              targetTemp={targetTemp}
              isKombiActive={isKombiActive}
            />
          </div>
        </section>

        {/* ── BÖLÜM 5: ANALİTİK, TÜKETİM & GÜVENLİK ── */}
        <section
          id="sec-analytics"
          aria-label="Analitik ve Güvenlik"
          className="min-h-[75vh] flex flex-col justify-center rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl p-5 sm:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <AnalyticsChartWidget
              history={history}
              dailyRunMinutes={dailyRunMinutes}
            />
            <ConsumptionWidget
              dailyRunMinutes={dailyRunMinutes}
              flameLevelPercent={flameLevelPercent}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <WeeklyScheduleWidget
                schedules={schedules}
                onSaveSchedules={handleSaveSchedules}
                isEncrypted={true}
              />
            </div>
            <div className="md:col-span-1">
              <SecurityVaultWidget
                isLocked={isVaultLocked}
                hasCustomPin={!!vaultPin}
                onSetPin={handleSetPin}
                onUnlockVault={handleUnlockVault}
                onLockVault={handleLockVault}
                onExportEncryptedBackup={handleExportBackup}
                onResetVault={handleResetVault}
              />
            </div>
            <div className="md:col-span-1">
              <TelegramConfigWidget
                token={telegramToken}
                chatId={telegramChatId}
                onSaveConfig={handleSaveTelegram}
                isEncrypted={true}
              />
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-slate-700 dark:text-slate-200">Kombi Akıllı Termostat</span>
          <span>• Akıcı Apple Sayfa Deneyimi & Otomatik Saat Teması</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            AES-256 Korumalı
          </span>
          <span>|</span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-blue-500 transition-colors"
          >
            Bulut Bağlantısı
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="hover:text-blue-500 transition-colors"
          >
            Widget Düzeni
          </button>
        </div>
      </footer>

      {/* ── MODALS ── */}
      <WidgetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onToggleWidget={handleToggleWidget}
        onMoveWidget={handleMoveWidget}
        onResetWidgets={handleResetWidgets}
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
      />
    </div>
  );
}
