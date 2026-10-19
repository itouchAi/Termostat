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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { ThemeMode, PerformanceMode, MorphMode, ScheduleItem, WidgetItem } from './types.ts';
import { translations, type Language } from './utils/i18n.ts';
import { ThreeScene } from './components/ThreeCanvas/ThreeScene.tsx';
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


import {
  calculateRelayStatus,
  calculateFlameModulation,
  resolveEffectiveTheme,
} from './utils/thermostatRules.ts';
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
  { id: 'genel', label: 'Termostat', icon: '🏠', title: 'Termostat & Kombi Ana Kontrol' },
  { id: 'hava', label: 'Hava', icon: '🌤️', title: 'Bölgesel Hava Durumu & 5 Günlük Tahmin' },
  { id: 'rapor', label: 'Rapor', icon: '📊', title: '24s Sıcaklık & Tüketim Analitiği' },
  { id: 'program', label: 'Program', icon: '⏰', title: 'Haftalık Zaman Planı & Tüketim' },
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

  // Dynamic tabs based on active language
  const tabs: SlideDef[] = useMemo(() => [
    { id: 'genel', label: t.tabThermostat, icon: '🏠', title: lang === 'tr' ? 'Termostat & Kombi Ana Kontrol' : 'Thermostat & Boiler Main Control' },
    { id: 'hava', label: t.tabWeather, icon: '🌤️', title: lang === 'tr' ? 'Bölgesel Hava Durumu & 5 Günlük Tahmin' : 'Regional Weather & 5-Day Forecast' },
    { id: 'rapor', label: t.tabReport, icon: '📊', title: lang === 'tr' ? '24s Sıcaklık & Tüketim Analitiği' : '24h Temperature & Usage Analytics' },
    { id: 'program', label: t.tabProgram, icon: '⏰', title: lang === 'tr' ? 'Haftalık Zaman Planı & Tüketim' : 'Weekly Schedule & Consumption' },
  ], [lang, t]);

  // ── Theme State: 'glass' | 'dark' | 'light' | 'system' ──
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_preference') as ThemeMode;
      if (saved === 'glass' || saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'glass';
  });

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

  const [reducedMotion] = useState<boolean>(false);


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

  // Normalized active tab index in range [0 .. TABS.length - 1]
  const activeTabIndex = useMemo(() => {
    const n = TABS.length;
    return ((virtualIndex % n) + n) % n;
  }, [virtualIndex]);

  // Thermostat vitals
  const [currentTemp] = useState<number>(21.8);
  const [humidity] = useState<number>(48);
  const [targetTemp, setTargetTemp] = useState<number>(22.5);
  const [waterPressure] = useState<number>(1.6);
  const [dailyRunMinutes] = useState<number>(145);

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
            setDailyRunMinutes(data.calismaDakika);
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
    const n = tabs.length;
    const currentTab = ((virtualIndex % n) + n) % n;
    let diff = targetTabIdx - currentTab;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    setVirtualIndex((v) => v + diff);
  }, [virtualIndex, tabs.length]);

  const slidePrev = useCallback(() => {
    setVirtualIndex((v) => v - 1);
  }, []);

  const slideNext = useCallback(() => {
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
    if (target.closest('input, textarea, select, button, [role="slider"]')) {
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
    if (target.closest('input, textarea, select, button, [role="slider"]')) {
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
      className={`h-[100dvh] max-h-[100dvh] w-screen relative ${
        themeMode === 'glass'
          ? 'bg-transparent text-slate-100'
          : effectiveTheme === 'dark'
          ? 'dark bg-radial-[at_top] from-slate-900 via-slate-950 to-black text-slate-100'
          : 'bg-radial-[at_top] from-slate-100 via-sky-50/40 to-slate-200/80 text-slate-800'
      } font-sans transition-colors duration-500 flex flex-col selection:bg-blue-500 selection:text-white overflow-hidden`}
    >
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
        className={`relative z-40 h-14 sm:h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between border-b transition-all ${
          themeMode === 'glass'
            ? 'border-white/15 bg-slate-950/30 text-white backdrop-blur-2xl shadow-sm'
            : 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md'
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
                Kombi Termostat 3D
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                3D MORPH DOCK
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
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
          {/* Language Switcher Flag Button (Placed in front of the 4 buttons) */}
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'tr' ? 'en' : 'tr'))}
            className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'glass'
                ? 'bg-white/10 hover:bg-white/20 border-white/25 text-white backdrop-blur-md shadow-white/5'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            aria-label="Dil Değiştir / Switch Language"
            title={lang === 'tr' ? 'Türkçe (English için tıklayın)' : 'English (Click for Turkish)'}
          >
            <span className="text-sm leading-none drop-shadow-xs">{lang === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
            <span className="text-[11px] font-black tracking-tight">{lang === 'tr' ? 'TR' : 'EN'}</span>
          </button>

          {/* 1. Performance Mode Switch (Ultra 60FPS vs Eco Low-Power) */}
          <button
            type="button"
            onClick={() => setPerformanceMode((p) => (p === 'ultra' ? 'eco' : 'ultra'))}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              performanceMode === 'ultra'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400 shadow-sm'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
            }`}
            title={performanceMode === 'ultra' ? t.perfUltraTitle : t.perfEcoTitle}
            aria-label="Performans modunu değiştir"
          >
            {performanceMode === 'ultra' ? (
              <>
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="hidden md:inline text-[11px]">{t.perfUltra}</span>
              </>
            ) : (
              <>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline text-[11px]">{t.perfEco}</span>
              </>
            )}
          </button>

          {/* 2. Theme & Visual Effects Modal Trigger Button (Opens Pop-up Modal) */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              themeMode === 'glass'
                ? 'bg-blue-600/30 hover:bg-blue-600/45 border-blue-400/50 text-white backdrop-blur-md shadow-blue-500/10'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            aria-label="Tema ve görsel efekt ayarları"
            title={`${t.themeMenuTitle}: ${
              themeMode === 'glass'
                ? t.themeGlass
                : themeMode === 'system'
                ? t.themeAuto
                : themeMode === 'dark'
                ? t.themeDark
                : t.themeLight
            }`}
          >
            {themeMode === 'glass' ? (
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
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            aria-label={t.customizeWidgets}
            title={t.customizeWidgets}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* 4. Cloud Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

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
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden stage-3d select-none pt-1 sm:pt-1.5 pb-[56px] sm:pb-[64px] px-1.5 sm:px-3 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* Subtle Ambient Glow Behind Floating Windows */}
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

        {/* ── 3D FLOATING CARDS (Üst bar ve alt dock'a çok ince boşluk kalacak şekilde genişletilmiş) ── */}
        <div className="relative w-full max-w-5xl h-full max-h-[890px] flex items-center justify-center">
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

            // Pickup 3D rotation:
            const rotateY = Math.max(-38, Math.min(38, -effectiveOffset * 25));
            const rotateZ = Math.max(-4, Math.min(4, effectiveOffset * -1.5));
            const translateZ = -Math.min(320, absOffset * 150);
            const translateX = effectiveOffset * 105; // in %
            const scale = Math.max(0.75, 1 - absOffset * 0.1);
            const opacity = Math.max(0, 1 - absOffset * 0.42);
            const zIndex = Math.round(100 - absOffset * 10);
            const isCenter = absOffset < 0.4;

            // Only render cards reasonably close in infinite space
            if (absOffset > 2.3) return null;

            return (
              <div
                key={tab.id}
                style={{
                  transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.5s cubic-bezier(0.2, 0.9, 0.35, 1), opacity 0.4s ease',
                  transformOrigin: '50% 50%',
                  pointerEvents: isCenter ? 'auto' : 'none',
                }}
                className={`absolute inset-0 w-full h-full rounded-[30px] sm:rounded-[36px] overflow-hidden flex flex-col transition-all duration-500 ${
                  themeMode === 'glass'
                    ? 'bg-slate-950/20 border border-white/30 shadow-[0_25px_60px_rgba(0,0,0,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-1.5px_2px_rgba(255,255,255,0.15)] backdrop-blur-md backdrop-saturate-150 text-white'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-900/90 border border-slate-700/70 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06),0_12px_36px_-10px_rgba(249,115,22,0.18)] backdrop-blur-2xl'
                    : 'bg-white/90 border border-white/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.9),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl'
                }`}
              >
                {/* Frosted Glass Top Sheen & Curved Bevel Glare */}
                {themeMode === 'glass' && (
                  <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/[0.14] via-white/[0.03] to-transparent pointer-events-none rounded-t-[30px] sm:rounded-t-[36px]" />
                )}

                {/* Floating Window Top Header Bar */}
                <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between shrink-0 relative z-10 ${
                  themeMode === 'glass'
                    ? 'border-white/15 bg-white/[0.08] backdrop-blur-md'
                    : 'border-slate-200/70 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/40'
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
                      {/* Top Badges (Compact Frosted Glass) */}
                      <div className="w-full flex items-center justify-between mb-1 shrink-0">
                        <div className={`px-2.5 py-1 rounded-full border shadow-xs flex items-center gap-1.5 sm:gap-2 backdrop-blur-md ${
                          themeMode === 'glass'
                            ? 'bg-white/[0.12] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)] text-white'
                            : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                        }`}>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isKombiActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          <span className={`text-xs font-bold ${themeMode === 'glass' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                            {isKombiActive ? t.activeHeating : t.standby}
                          </span>
                          <span className={`text-[10px] font-mono ${themeMode === 'glass' ? 'text-slate-300' : 'text-slate-500'}`}>
                            (%{flameLevelPercent} {t.modulation})
                          </span>
                        </div>

                        <div className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md ${
                          themeMode === 'glass'
                            ? 'bg-white/[0.12] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)] text-white'
                            : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={themeMode === 'glass' ? 'text-slate-300' : 'text-slate-400'}>{t.liveRoom}</span>
                          <span className={`font-mono font-bold ${themeMode === 'glass' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{currentTemp}°C</span>
                          <span className={themeMode === 'glass' ? 'text-slate-300' : 'text-slate-400'}>• %{humidity}</span>
                        </div>
                      </div>

                      {/* Center: Scaled 3D Thermostat */}
                      <div className="flex-1 w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[480px] h-[220px] xs:h-[250px] sm:h-[300px] md:h-[350px] mx-auto flex items-center justify-center relative my-auto">
                        <ThreeScene
                          theme={effectiveTheme}
                          morphMode={morphMode}
                          targetTemp={targetTemp}
                          currentTemp={currentTemp}
                          isKombiActive={isKombiActive}
                          performanceMode={performanceMode === 'eco'}
                          reducedMotion={reducedMotion}
                          onSetTarget={handleSetTarget}
                        />
                      </div>

                      {/* Bottom: Target Stepper + Horizontal Preset Buttons */}
                      <div className="w-full shrink-0 flex flex-col gap-1.5 sm:gap-2 mt-auto">
                        {/* Target Stepper Strip (Compact Horizontal Frosted Glass) */}
                        <div className={`w-full flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border backdrop-blur-md shadow-2xs ${
                          themeMode === 'glass'
                            ? 'bg-white/[0.10] border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.3)] text-white'
                            : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                        }`}>
                          <button
                            type="button"
                            onClick={() => handleSetTarget(Math.max(10, Math.round((targetTemp - 0.5) * 2) / 2))}
                            className={`w-8 h-8 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 text-base cursor-pointer shadow-2xs ${
                              themeMode === 'glass'
                                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                                : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white'
                            }`}
                            title="Hedef sıcaklığı 0.5°C azalt"
                          >
                            -
                          </button>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold uppercase tracking-wider hidden xs:inline ${
                              themeMode === 'glass' ? 'text-slate-300' : 'text-slate-400'
                            }`}>
                              {t.targetTemp}
                            </span>
                            <span className="text-lg sm:text-xl font-black font-mono text-orange-500 drop-shadow-sm">
                              {targetTemp.toFixed(1)}°C
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetTarget(Math.min(32, Math.round((targetTemp + 0.5) * 2) / 2))}
                            className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 font-black text-white flex items-center justify-center transition-all active:scale-95 text-base shadow-md shadow-orange-500/30 cursor-pointer border border-orange-400/50"
                            title="Hedef sıcaklığı 0.5°C artır"
                          >
                            +
                          </button>
                        </div>

                        {/* 5 Preset Mode Buttons */}
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
                                className={`flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-center transition-all duration-200 cursor-pointer w-full min-w-0 border ${
                                  isActive
                                    ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold shadow-lg shadow-orange-500/35 border-orange-400/80 scale-[1.03]'
                                    : themeMode === 'glass'
                                    ? 'bg-white/[0.09] hover:bg-white/[0.18] text-white border-white/20 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)]'
                                    : 'bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-orange-400'
                                }`}
                              >
                                <span className="text-sm sm:text-base leading-none mb-0.5 drop-shadow-xs">{preset.icon}</span>
                                <span className="text-[11px] sm:text-xs font-bold leading-tight truncate w-full">
                                  {preset.label}
                                </span>
                                <span
                                  className={`text-[10px] sm:text-xs font-mono font-extrabold ${
                                    isActive ? 'text-white' : themeMode === 'glass' ? 'text-slate-300' : 'text-slate-400 dark:text-slate-400'
                                  }`}
                                >
                                  {preset.temp}°
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 text-center leading-tight">
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
                        themeMode={themeMode}
                        lang={lang}
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
                      />
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── FIXED BOTTOM AESTHETIC FLOATING TAB DOCK (Mouse Wheel & Touch Swipe Yetkisi ile Donatılmış) ── */}
      <nav
        aria-label="Sabit Alt Gezinme Barı"
        onWheel={handleDockWheel}
        onTouchStart={handleDockTouchStart}
        onTouchMove={handleDockTouchMove}
        onTouchEnd={handleDockTouchEnd}
        onTouchCancel={handleDockTouchEnd}
        className="fixed bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[96vw] select-none touch-pan-x"
      >
        <div className={`flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2.5 p-1 sm:p-2 rounded-2xl sm:rounded-full backdrop-blur-2xl transition-all ${
          themeMode === 'glass'
            ? 'bg-slate-950/40 border border-white/20 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]'
            : 'bg-white/85 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-700/80 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.25)]'
        }`}>
          {tabs.map((tab, idx) => {
            const isActive = activeTabIndex === idx;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateToTab(idx)}
                className={`relative px-2 xs:px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-[10px] xs:text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-w-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-orange-500 text-white shadow-md shadow-blue-500/30 dark:shadow-orange-500/30 scale-105'
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
      </nav>

      {/* ── MODALS ── */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={themeMode}
        onSelectTheme={(newTheme) => setThemeMode(newTheme)}
        performanceMode={performanceMode}
        onSelectPerformanceMode={(perf) => setPerformanceMode(perf)}
        activeWeatherCondition={effectiveWeatherCondition}
        onSelectWeatherConditionOverride={setWeatherConditionOverride}
        weatherConditionOverride={weatherConditionOverride}
        cityName={activeLocation.cityName}
        lang={lang}
      />

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
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        lang={lang}
        isWeatherNotificationsEnabled={isWeatherNotificationsEnabled}
        onToggleWeatherNotifications={setIsWeatherNotificationsEnabled}
        onTriggerTestNotification={handleTriggerWeatherNotification}
        onResetHistoricalData={() => {
          // Immediately notify all listeners
          window.dispatchEvent(new Event('thermostat_history_reset'));
        }}
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
      />
    </div>
  );
}
