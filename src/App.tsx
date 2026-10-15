import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sun,
  Moon,
  Zap,
  Settings,
  SlidersHorizontal,
  Flame,
  LayoutGrid,
  ShieldCheck,
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
} from './utils/thermostatRules.ts';
import { SecureVault, encryptData } from './utils/crypto.ts';
import {
  DEFAULT_LOCATIONS,
  type LocationItem,
  type CurrentWeather,
  fetchOpenMeteoWeather,
  getFallbackForecast,
} from './utils/weather.ts';

// Initial default widgets (cleaned up)
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

export default function App() {
  // ── Core States ──
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_preference');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

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

  // Sync DOM dark class with theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme_preference', theme);
  }, [theme]);

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
    // Refresh weather every 15 minutes
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeLocation]);

  // Location handlers
  const handleSelectLocation = (loc: LocationItem) => {
    setActiveLocation(loc);
  };

  const handleAddLocation = (name: string, cityName: string) => {
    // City coords table
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

  // Target Temp change handler (persists encrypted)
  const handleSetTarget = useCallback((newTarget: number) => {
    setTargetTemp(newTarget);
    SecureVault.setItem('targetTemp', newTarget);
  }, []);

  // Save schedules (persists encrypted)
  const handleSaveSchedules = useCallback((newSchedules: ScheduleItem[]) => {
    setSchedules(newSchedules);
    SecureVault.setItem('schedules', newSchedules);
  }, []);

  // Save Telegram config (persists encrypted)
  const handleSaveTelegram = useCallback((token: string, chatId: string) => {
    setTelegramToken(token);
    setTelegramChatId(chatId);
    SecureVault.setItem('telegram', { token, chatId });
  }, []);

  // Save Widgets (persists encrypted)
  const handleSaveWidgets = useCallback((newWidgets: WidgetItem[]) => {
    setWidgets(newWidgets);
    SecureVault.setItem('widgets', newWidgets);
  }, []);

  // Widget Customization Helpers
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

  // Render individual widget by ID
  const renderWidgetById = (id: string) => {
    switch (id) {
      case 'target':
        return (
          <TargetControlWidget
            key={id}
            targetTemp={targetTemp}
            onSetTarget={handleSetTarget}
            isKombiActive={isKombiActive}
          />
        );
      case 'gauge':
        return (
          <CoreGaugeWidget
            key={id}
            currentTemp={currentTemp}
            humidity={humidity}
            targetTemp={targetTemp}
            isKombiActive={isKombiActive}
          />
        );
      case 'modulation':
        return (
          <ModulationWidget
            key={id}
            isKombiActive={isKombiActive}
            flameLevelPercent={flameLevelPercent}
            waterPressureBar={waterPressure}
            pumpRpm={1420}
          />
        );
      case 'analytics':
        return (
          <AnalyticsChartWidget
            key={id}
            history={history}
            dailyRunMinutes={dailyRunMinutes}
          />
        );
      case 'consumption':
        return (
          <ConsumptionWidget
            key={id}
            dailyRunMinutes={dailyRunMinutes}
            flameLevelPercent={flameLevelPercent}
          />
        );
      case 'schedule':
        return (
          <WeeklyScheduleWidget
            key={id}
            schedules={schedules}
            onSaveSchedules={handleSaveSchedules}
            isEncrypted={true}
          />
        );
      case 'security':
        return (
          <SecurityVaultWidget
            key={id}
            isLocked={isVaultLocked}
            hasCustomPin={!!vaultPin}
            onSetPin={handleSetPin}
            onUnlockVault={handleUnlockVault}
            onLockVault={handleLockVault}
            onExportEncryptedBackup={handleExportBackup}
            onResetVault={handleResetVault}
          />
        );
      case 'telegram':
        return (
          <TelegramConfigWidget
            key={id}
            token={telegramToken}
            chatId={telegramChatId}
            onSaveConfig={handleSaveTelegram}
            isEncrypted={true}
          />
        );
      default:
        return null;
    }
  };

  // Filter widgets by active tab or custom view
  const activeWidgetIds = useMemo(() => {
    const enabled = [...widgets].filter((w) => w.enabled).sort((a, b) => a.order - b.order);

    if (activeTab === 'all') {
      return enabled.map((w) => w.id);
    }
    if (activeTab === 'ana') {
      return ['target', 'gauge', 'modulation'].filter((id) =>
        widgets.find((w) => w.id === id)?.enabled
      );
    }
    if (activeTab === 'rapor') {
      return ['analytics', 'consumption', 'modulation'].filter((id) =>
        widgets.find((w) => w.id === id)?.enabled
      );
    }
    if (activeTab === 'program') {
      return ['schedule', 'security', 'telegram'].filter((id) =>
        widgets.find((w) => w.id === id)?.enabled
      );
    }
    return enabled.map((w) => w.id);
  }, [activeTab, widgets]);

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
      } font-sans transition-colors duration-500 flex flex-col selection:bg-blue-500 selection:text-white`}
    >
      {/* ── TOP NAV HEADER ── */}
      <header className="sticky top-0 z-40 min-h-16 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 md:px-8 flex items-center justify-between shadow-xs">
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
              {performanceMode ? 'Performans Modu' : 'Canlı Alev Modu'}
            </span>
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            aria-label={theme === 'dark' ? 'Gündüz moduna geç' : 'Gece moduna geç'}
            title={theme === 'dark' ? 'Gündüz Modu' : 'Gece Modu'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 transition-transform rotate-0" />
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

      {/* ── MAIN VIEWPORT & 3D STAGE ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col gap-5">
        {/* Top Section: Static Thermostat & Integrated 5-Day Weather Forecast */}
        <section
          aria-label="Sabit Termostat ve 5 Günlük Hava Durumu"
          className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-xl"
        >
          {/* Status Badge in top center */}
          <div className="pt-4 px-4 flex items-center justify-between">
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isKombiActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {isKombiActive ? 'Aktif Isıtma 🔥' : 'Beklemede ❄️'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                (%{flameLevelPercent} modülasyon)
              </span>
            </div>

            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Bağlı Cihaz:</span>
              <span className="font-bold text-slate-800 dark:text-white">Kombi #1</span>
            </div>
          </div>

          {/* Fixed Static 3D Thermostat with Authentic Dancing Flame at the bottom inside */}
          <div className="w-full flex items-center justify-center my-1 sm:my-2">
            <div className="w-full max-w-md">
              <ThreeScene
                theme={theme}
                morphMode={morphMode}
                targetTemp={targetTemp}
                currentTemp={currentTemp}
                isKombiActive={isKombiActive}
                performanceMode={performanceMode}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>

          {/* Integrated 5-Day Weather Forecast directly beneath the thermostat */}
          <ForecastSection
            weather={weather}
            locations={locations}
            activeLocation={activeLocation}
            onSelectLocation={handleSelectLocation}
            onAddLocation={handleAddLocation}
          />
        </section>

        {/* ── TABS BAR (Genel, Rapor, Program, Tümü) — Evenly Distributed Grid (NO HORIZONTAL SCROLL) ── */}
        <div className="w-full border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="grid grid-cols-4 w-full bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 gap-1 select-none">
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

        {/* ── DYNAMIC WIDGETS GRID ── */}
        <section aria-label="Kişiselleştirilebilir Widget Izgarası" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeWidgetIds.map((id) => (
            <div key={id} className="w-full">
              {renderWidgetById(id)}
            </div>
          ))}
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-slate-700 dark:text-slate-200">Kombi Akıllı Termostat</span>
          <span>• Sabit Kadran & 5 Günlük Hava Durumu</span>
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
