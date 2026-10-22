import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  Calendar,
  Coins,
  Clock,
  TrendingUp,
  BarChart2,
  Sparkles,
  Zap,
  Edit2,
  Check,
  X,
  Gauge,
  Activity,
  ShieldCheck,
  ChevronDown,
  Database,
  ArrowLeft,
} from 'lucide-react';
import { calculateComfortIndex } from '../../utils/thermostatRules.ts';
import type { ThemeMode } from '../../types.ts';
import { translations, type Language } from '../../utils/i18n.ts';

export type TimeframeMode = 'daily' | 'weekly' | 'monthly';

export interface TelemetryHour {
  hourLabel: string;
  temp: number;
  target: number;
  isActive: boolean;
  flameLevelPercent: number;
  powerKw: number;
  gasM3: number;
}

export interface HistoricalDayData {
  dateKey: string;
  dateTitle: string;
  totalActiveMinutes: number;
  totalGasM3: number;
  avgTemp: number;
  hours: TelemetryHour[];
}

interface ReportDeckViewProps {
  isKombiActive: boolean;
  flameLevelPercent: number;
  waterPressure?: number;
  pumpRpm?: number;
  currentTemp: number;
  humidity: number;
  targetTemp: number;
  dailyRunMinutes?: number;
  lastIgnitionTime?: number;
  themeMode?: ThemeMode;
  lang?: Language;
}

export const ReportDeckView: React.FC<ReportDeckViewProps> = ({
  isKombiActive,
  flameLevelPercent,
  waterPressure = 1.6,
  pumpRpm = 1420,
  currentTemp,
  humidity,
  targetTemp,
  dailyRunMinutes = 0,
  lastIgnitionTime,
  themeMode = 'glass',
  lang = 'tr',
}) => {
  const t = translations[lang] || translations.tr;
  const isGlass = themeMode === 'glass';
  const isObsidian = themeMode === 'obsidian_lavender';

  // Active 3D window layer: 0 = Sıcaklık Haritası, 1 = Doğalgaz Faturası, 2 = Kombi & Sensörler
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2>(0);

  // Timeframe: daily, weekly, monthly
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');

  // Selected Date - defaults to current actual date
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Gas unit price state
  const [gasUnitPrice, setGasUnitPrice] = useState<number>(10.25);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('10.25');

  // Selected hour pop-up detail state
  const [selectedHour, setSelectedHour] = useState<TelemetryHour | null>(null);

  // Local storage historical DB listener so when settings resets, we update immediately
  const [storageDb, setStorageDb] = useState<Record<string, HistoricalDayData>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smart_thermostat_historical_db_v2');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem('smart_thermostat_historical_db_v2');
        setStorageDb(raw ? JSON.parse(raw) : {});
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('thermostat_history_reset', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('thermostat_history_reset', handleStorageChange);
    };
  }, []);

  // Resolve day data: ONLY real accumulated session minutes or saved telemetry in storageDb.
  // NO fabricated fake datasets! If not found, returns null so clean empty state renders.
  const currentDayData = useMemo<HistoricalDayData | null>(() => {
    if (storageDb[selectedDate]) {
      return storageDb[selectedDate];
    }

    if (selectedDate === todayStr) {
      const activeMin = typeof dailyRunMinutes === 'number' ? dailyRunMinutes : 0;
      // Real formula: 24kW boiler at modulated flame consumes ~1.8 m3/h at max flame
      const m3 = activeMin > 0 ? Math.round(((activeMin / 60) * 1.8 * (Math.max(20, flameLevelPercent) / 100)) * 100) / 100 : 0;

      const now = new Date();
      const currentHour = now.getHours();
      // Current slot index (0 to 5) for 4-hour intervals
      const currentSlotIndex = Math.min(5, Math.floor(currentHour / 4));

      // Determine which slot kombi ignited in or is active in
      const ignitionHour = lastIgnitionTime ? new Date(lastIgnitionTime).getHours() : currentHour;
      const ignitionSlotIndex = Math.min(5, Math.floor(ignitionHour / 4));

      const slotLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

      const hours: TelemetryHour[] = slotLabels.map((hourLabel, idx) => {
        // A slot is active ONLY if kombi is active in the current slot OR if it actually ran during this slot today
        const isCurrentSlot = idx === currentSlotIndex;
        const isIgnitionSlot = idx === ignitionSlotIndex;

        let isSlotActive = false;
        if (isKombiActive && isCurrentSlot) {
          isSlotActive = true;
        } else if (activeMin > 0 && isIgnitionSlot) {
          isSlotActive = true;
        }

        return {
          hourLabel,
          temp: isSlotActive ? currentTemp : 0,
          target: targetTemp,
          isActive: isSlotActive,
          flameLevelPercent: isSlotActive ? (isKombiActive && isCurrentSlot ? flameLevelPercent : 45) : 0,
          powerKw: isSlotActive ? Math.round((24 * (isKombiActive && isCurrentSlot ? flameLevelPercent : 45)) / 10) / 10 : 0,
          gasM3: isSlotActive ? m3 : 0,
        };
      });

      return {
        dateKey: todayStr,
        dateTitle: lang === 'tr' ? `${selectedDate} (Bugün)` : `${selectedDate} (Today)`,
        totalActiveMinutes: activeMin,
        totalGasM3: m3,
        avgTemp: currentTemp,
        hours,
      };
    }

    // Any past day with no real data returns null!
    return null;
  }, [selectedDate, todayStr, storageDb, dailyRunMinutes, isKombiActive, flameLevelPercent, currentTemp, targetTemp, lastIgnitionTime, lang]);

  // Aggregate stats based on timeframe
  const aggregatedStats = useMemo(() => {
    if (!currentDayData) {
      return { gas: 0, activeMin: 0, cost: 0, savedGas: 0, savedCost: 0, label: '-' };
    }

    if (timeframe === 'weekly') {
      const mult = currentDayData.totalActiveMinutes > 0 ? 7 : 0;
      const gas = Math.round(currentDayData.totalGasM3 * mult * 0.95 * 100) / 100;
      const activeMin = currentDayData.totalActiveMinutes * mult;
      const cost = Math.round(gas * gasUnitPrice * 100) / 100;
      const savedGas = Math.round(gas * 0.28 * 100) / 100;
      const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
      return { gas, activeMin, cost, savedGas, savedCost, label: lang === 'tr' ? '7 Günlük Toplam' : '7-Day Total' };
    }

    if (timeframe === 'monthly') {
      const mult = currentDayData.totalActiveMinutes > 0 ? 30 : 0;
      const gas = Math.round(currentDayData.totalGasM3 * mult * 0.92 * 100) / 100;
      const activeMin = currentDayData.totalActiveMinutes * mult;
      const cost = Math.round(gas * gasUnitPrice * 100) / 100;
      const savedGas = Math.round(gas * 0.29 * 100) / 100;
      const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
      return { gas, activeMin, cost, savedGas, savedCost, label: lang === 'tr' ? '30 Günlük Fatura Projeksiyonu' : '30-Day Projection' };
    }

    // Daily
    const gas = currentDayData.totalGasM3;
    const activeMin = currentDayData.totalActiveMinutes;
    const cost = Math.round(gas * gasUnitPrice * 100) / 100;
    const savedGas = Math.round(gas * 0.27 * 100) / 100;
    const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
    return { gas, activeMin, cost, savedGas, savedCost, label: lang === 'tr' ? 'Seçili Gün Özeti' : 'Selected Day Summary' };
  }, [timeframe, currentDayData, gasUnitPrice, lang]);

  const handleSavePrice = () => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val > 0) {
      setGasUnitPrice(val);
    }
    setIsEditingPrice(false);
  };

  // Touch swipe handling for up/down floating transitions
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    if (deltaY < -24) {
      setActiveLayer((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));
    } else if (deltaY > 24) {
      setActiveLayer((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev));
    }
    touchStartY.current = null;
  };

  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 380) return;

    if (e.deltaY > 20) {
      setActiveLayer((prev) => {
        const next = prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev;
        if (next !== prev) lastWheelTime.current = now;
        return next;
      });
    } else if (e.deltaY < -20) {
      setActiveLayer((prev) => {
        const next = prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev;
        if (next !== prev) lastWheelTime.current = now;
        return next;
      });
    }
  };

  const getTempColorClass = (temp: number) => {
    if (temp < 18.0) return 'bg-sky-500/20 text-sky-300 border-sky-400/40';
    if (temp < 20.0) return 'bg-teal-500/20 text-teal-300 border-teal-400/40';
    if (temp < 22.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
    if (temp < 23.5) return 'bg-amber-500/25 text-amber-300 border-amber-400/50';
    return 'bg-orange-500/30 text-orange-300 border-orange-500/50';
  };

  const comfort = calculateComfortIndex(currentTemp, humidity);
  const tempDiff = currentTemp - targetTemp;
  const calcArc = (val: number, min: number, max: number) => {
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
    const totalLength = 188.5;
    return totalLength * (1 - ratio);
  };

  // Glass/Obsidian 2nd layer container styles
  const windowBaseClass = isObsidian
    ? 'bg-[#12101b]/95 border-t border-l border-white/[0.12] border-r border-black/70 border-b-2 border-b-black/85 shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.14)] text-slate-100'
    : isGlass
    ? 'bg-slate-950/35 border border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-lg text-slate-100'
    : 'bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm';

  const subBoxClass = isObsidian
    ? 'bg-[#151322] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-slate-100 shadow-[0_8px_18px_-2px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)]'
    : isGlass
    ? 'bg-white/[0.08] border border-white/12 text-slate-100 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
    : 'bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200';

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none p-1 sm:p-2"
    >
      {/* ── TOP LAYER SWITCHER PILLS (3 Pencere: Sıcaklık Haritası, Doğalgaz Faturası, Kombi & Sensörler) ── */}
      <div className="shrink-0 flex items-center justify-center mb-1.5 sm:mb-2">
        <div className={`flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl border transition-all ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.12] border-r border-black/70 border-b-2 border-b-black/85 shadow-[0_12px_26px_-4px_rgba(0,0,0,0.8),inset_0_1px_1.5px_rgba(255,255,255,0.12)]'
            : isGlass
            ? 'bg-white/[0.10] border-white/20 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3)]'
            : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => setActiveLayer(0)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 0
                ? isObsidian
                  ? 'bg-gradient-to-tr from-[#7352d4] via-[#8563e8] to-[#9979f5] text-white border-t border-l border-white/30 border-r border-[#3b1c8a] border-b-2 border-b-[#230e58] shadow-[0_8px_18px_rgba(0,0,0,0.7),0_2px_12px_rgba(133,99,232,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] scale-[1.02]'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : isObsidian
                ? 'text-[#9a93b5] hover:text-white hover:bg-[#1f1b2d]'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🌡️</span>
            <span>{t.repTabHeatmap}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(1)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 1
                ? isObsidian
                  ? 'bg-gradient-to-tr from-[#7352d4] via-[#8563e8] to-[#9979f5] text-white border-t border-l border-white/30 border-r border-[#3b1c8a] border-b-2 border-b-[#230e58] shadow-[0_8px_18px_rgba(0,0,0,0.7),0_2px_12px_rgba(133,99,232,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] scale-[1.02]'
                  : 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                : isObsidian
                ? 'text-[#9a93b5] hover:text-white hover:bg-[#1f1b2d]'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💰</span>
            <span>{t.repTabGasBill}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(2)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 2
                ? isObsidian
                  ? 'bg-gradient-to-tr from-[#7352d4] via-[#8563e8] to-[#9979f5] text-white border-t border-l border-white/30 border-r border-[#3b1c8a] border-b-2 border-b-[#230e58] shadow-[0_8px_18px_rgba(0,0,0,0.7),0_2px_12px_rgba(133,99,232,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] scale-[1.02]'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                : isObsidian
                ? 'text-[#9a93b5] hover:text-white hover:bg-[#1f1b2d]'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔥</span>
            <span>{t.repTabBoiler}</span>
          </button>
        </div>
      </div>

      {/* ── STACKED 3D FLOAT & BLUR CONTAINER ── */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            PENCERE 0: SICAKLIK HARİTASI & BRÜLÖR ATEŞLEME DAĞILIMI
            ═══════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            transform:
              activeLayer === 0
                ? 'translateY(0px) scale(1)'
                : activeLayer > 0
                ? 'translateY(-60px) scale(0.92)'
                : 'translateY(60px) scale(0.92)',
            opacity: activeLayer === 0 ? 1 : 0,
            filter: activeLayer === 0 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 0 ? 'auto' : 'none',
            zIndex: activeLayer === 0 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className={`absolute inset-0 w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden ${windowBaseClass}`}
        >
          {/* 1. Satır: Sıcaklık Haritası Başlığı (Tek Satır) */}
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                <BarChart2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{t.repTabHeatmap}</span>
              </h3>
            </div>
            {currentDayData && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentDayData.avgTemp.toFixed(1)}°C
              </span>
            )}
          </div>

          {/* 2. Satır: Günlük / Haftalık / Aylık (Tek Satır) */}
          <div className="w-full shrink-0 my-1">
            <div className={`grid grid-cols-3 w-full p-0.5 rounded-xl text-xs font-bold text-center ${subBoxClass}`}>
              <button
                type="button"
                onClick={() => setTimeframe('daily')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'daily'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.timeframeDaily}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.timeframeWeekly}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.timeframeMonthly}
              </button>
            </div>
          </div>

          {/* 3. Bölüm: İncelenen Gün & Tarih Seçici */}
          <div className={`w-full flex flex-col gap-1.5 px-3 py-1.5 rounded-xl shrink-0 my-1 ${subBoxClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                {t.inspectedDate}
              </span>

              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap pointer-events-none"
                  title="Takvimi açmak için tıklayın"
                >
                  <span>{currentDayData ? currentDayData.dateTitle : selectedDate}</span>
                  <ChevronDown className="w-3 h-3 text-blue-200 shrink-0" />
                </button>

                {/* Direct user-gesture native date picker overlay: zero showPicker() call, 100% safe in cross-origin iframes */}
                <input
                  ref={dateInputRef}
                  type="date"
                  aria-label="İncelenen gün seçimi"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>

            {/* 2. Satır: Aktif Yanma ve Beklemede (Eğer veri varsa) */}
            {currentDayData ? (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${currentDayData.totalActiveMinutes > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[11px] text-slate-300">{t.activeBurnTime}:</span>
                  <span className="font-bold font-mono text-orange-400">
                    {currentDayData.totalActiveMinutes > 0
                      ? `${Math.floor(currentDayData.totalActiveMinutes / 60)}s ${currentDayData.totalActiveMinutes % 60}d`
                      : '0 dk'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-300">{t.standbyTime}:</span>
                  <span className="font-bold font-mono text-slate-200">
                    {currentDayData.totalActiveMinutes > 0
                      ? `${Math.floor((1440 - currentDayData.totalActiveMinutes) / 60)}s ${(1440 - currentDayData.totalActiveMinutes) % 60}d`
                      : '24s 0d'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-amber-400 flex items-center gap-1 pt-0.5 border-t border-white/10">
                <span>⚠️ {t.noDataTitle}</span>
              </div>
            )}
          </div>

          {/* 4. Bölüm: Sıcaklık & Telemetri Haritası / VEYA Veri Yok Durumu */}
          <div className="flex-1 w-full flex flex-col justify-around my-auto overflow-hidden py-1">
            {currentDayData ? (
              <>
                <div className="w-full flex items-center justify-between mb-1 shrink-0">
                  <span className="text-[11px] font-bold text-slate-300">
                    {t.repTabHeatmap}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Saat kutucuklarına dokunarak detayları inceleyin)
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1 sm:gap-1.5 w-full">
                  {currentDayData.hours.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedHour(item)}
                      className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        item.isActive
                          ? 'border-orange-500/70 bg-gradient-to-b from-orange-500/25 to-amber-500/15 shadow-[0_0_12px_rgba(249,115,22,0.3)] ring-1 ring-orange-400/50'
                          : 'border-white/10 bg-white/[0.04] opacity-80 hover:opacity-100'
                      }`}
                      title={`${item.hourLabel} Detaylarını Aç`}
                    >
                      <span className="text-[9px] font-mono text-slate-400">{item.hourLabel}</span>
                      {item.isActive ? (
                        <span className={`text-[11px] sm:text-xs font-bold font-mono my-0.5 px-1.5 py-0.5 rounded border ${getTempColorClass(item.temp)}`}>
                          {item.temp.toFixed(1)}°
                        </span>
                      ) : (
                        <span className="text-[11px] sm:text-xs font-mono my-0.5 px-1.5 py-0.5 text-slate-500">
                          —
                        </span>
                      )}
                      <span className="text-[9px]">
                        {item.isActive ? (
                          <span className="text-orange-400 font-bold flex items-center gap-0.5">🔥 Aktif</span>
                        ) : (
                          <span className="text-slate-400">❄️ Bekleme</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* REAL CLEAN EMPTY STATE (Canlı test için gereksiz veri yok) */
              <div className={`w-full flex flex-col items-center justify-center p-4 rounded-2xl text-center my-auto ${subBoxClass}`}>
                <Database className="w-7 h-7 text-slate-400 mb-2 opacity-60" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-1">
                  {t.noDataTitle}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-3">
                  {t.noDataDesc}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToToday}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PENCERE 1: DOĞALGAZ FATURA & TÜKETİM ANALİTİĞİ
            ═══════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            transform:
              activeLayer === 1
                ? 'translateY(0px) scale(1)'
                : activeLayer > 1
                ? 'translateY(-60px) scale(0.92)'
                : 'translateY(60px) scale(0.92)',
            opacity: activeLayer === 1 ? 1 : 0,
            filter: activeLayer === 1 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 1 ? 'auto' : 'none',
            zIndex: activeLayer === 1 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className={`absolute inset-0 w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden ${windowBaseClass}`}
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Coins className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{t.billEstimateTitle}</span>
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-400/30">
              {aggregatedStats.label}
            </span>
          </div>

          {/* Unit Price Bar */}
          <div className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl my-1 shrink-0 ${subBoxClass}`}>
            <span className="text-xs font-semibold text-slate-300">
              {t.unitPriceLabel}:
            </span>
            {isEditingPrice ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-16 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-xs font-mono font-bold text-white text-center"
                />
                <button
                  type="button"
                  onClick={handleSavePrice}
                  className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPriceInput(String(gasUnitPrice));
                  setIsEditingPrice(true);
                }}
                className="flex items-center gap-1 text-xs font-mono font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
              >
                <span>{gasUnitPrice.toFixed(2)} ₺ / m³</span>
                <Edit2 className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Main 2 Column Cards */}
          <div className="grid grid-cols-2 gap-2 w-full my-auto">
            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.meterReading}
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-sky-400 my-1">
                {aggregatedStats.gas.toFixed(2)} <span className="text-xs font-normal">m³</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {aggregatedStats.activeMin > 0
                  ? `${Math.floor(aggregatedStats.activeMin / 60)}s ${aggregatedStats.activeMin % 60}d çalışma`
                  : '0 dk çalışma'}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.estimatedCost}
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-orange-400 my-1">
                {aggregatedStats.cost.toFixed(2)} <span className="text-xs font-normal">₺</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ~{aggregatedStats.savedCost.toFixed(2)} ₺ tasarruf
              </span>
            </div>
          </div>

          {/* Bottom efficiency footnote */}
          <div className="text-[10px] text-slate-400 text-center shrink-0 pt-1 border-t border-white/10">
            💡 Modülasyonlu kombi alev kontrolü ile standart on/off termostatlara göre %28 tasarruf sağlanır.
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PENCERE 2: KOMBİ TELEMETRİSİ & RÖLE GÜVENLİK
            ═══════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            transform:
              activeLayer === 2
                ? 'translateY(0px) scale(1)'
                : 'translateY(60px) scale(0.92)',
            opacity: activeLayer === 2 ? 1 : 0,
            filter: activeLayer === 2 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 2 ? 'auto' : 'none',
            zIndex: activeLayer === 2 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className={`absolute inset-0 w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden ${windowBaseClass}`}
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.repTabBoiler}</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              {waterPressure} Bar
            </span>
          </div>

          {/* 4 Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 w-full my-auto">
            {/* 1. Röle ve Brülör Gücü */}
            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>{t.burnerFlamePower}</span>
                <span>{isKombiActive ? '🔥' : '❄️'}</span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-orange-400 my-0.5">
                %{isKombiActive ? flameLevelPercent : 0}
              </div>
              <span className="text-[9px] text-slate-400">
                {isKombiActive ? t.relayActive : t.relayStandby}
              </span>
            </div>

            {/* 2. Su Basıncı */}
            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>{t.waterPressure}</span>
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-sky-400 my-0.5">
                {waterPressure} <span className="text-[10px] font-normal">Bar</span>
              </div>
              <span className="text-[9px] text-emerald-400">
                {t.pressureNormal}
              </span>
            </div>

            {/* 3. Sirkülasyon Pompası */}
            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>{t.circulationPump}</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-400 my-0.5">
                {isKombiActive ? pumpRpm : 0} <span className="text-[10px] font-normal">RPM</span>
              </div>
              <span className="text-[9px] text-slate-400">
                {isKombiActive ? 'Aktif Sirkülasyon' : 'Beklemede'}
              </span>
            </div>

            {/* 4. Güvenlik Rölesi */}
            <div className={`p-2.5 rounded-xl flex flex-col justify-between ${subBoxClass}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>{t.safetyRelay}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-400 my-0.5">
                NORMAL
              </div>
              <span className="text-[9px] text-slate-400">
                Aşırı Isınma Kilidi: Açık
              </span>
            </div>
          </div>

          {/* Ortam Sensörleri Strip */}
          <div className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs shrink-0 ${subBoxClass}`}>
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>📡</span>
              <span>{t.ambientSensors}:</span>
            </span>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-sky-300">{currentTemp}°C</span>
              <span className="text-teal-300">%{humidity}</span>
              <span className="text-orange-300">Hedef: {targetTemp}°C</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── HOURLY POPUP MODAL (Dokunulan saatin detayları) ── */}
      {selectedHour && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className={`border rounded-3xl p-5 max-w-xs w-full shadow-2xl animate-in zoom-in-95 flex flex-col gap-3 ${
            isGlass
              ? 'bg-slate-950/85 border-white/20 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">
                  {selectedHour.hourLabel} {t.hourlyDetailTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHour(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-400">Brülör Durumu:</span>
                <span className={`font-bold flex items-center gap-1 ${selectedHour.isActive ? 'text-orange-400' : 'text-slate-400'}`}>
                  {selectedHour.isActive ? `🔥 Aktif (%${selectedHour.flameLevelPercent} Alev)` : '❄️ Beklemede (Ateşleme Yok)'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-400">Çalışma Sıcaklığı:</span>
                <span className="font-bold font-mono text-sky-400">
                  {selectedHour.isActive ? `${selectedHour.temp.toFixed(1)}°C` : '— (Kombi Çalışmadı)'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-400">Hedef Sıcaklık:</span>
                <span className="font-bold font-mono text-orange-400">{selectedHour.target.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-400">{t.powerKwLabel}:</span>
                <span className="font-bold font-mono text-amber-400">{selectedHour.powerKw} kW</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-400">{t.gasM3Label}:</span>
                <span className="font-bold font-mono text-emerald-400">{selectedHour.gasM3} m³</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHour(null)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all mt-1"
            >
              {t.close}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
