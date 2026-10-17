import React, { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { calculateComfortIndex } from '../../utils/thermostatRules.ts';

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

const HISTORICAL_DATABASE: Record<string, HistoricalDayData> = {
  '2026-10-16': {
    dateKey: '2026-10-16',
    dateTitle: '16 Ekim 2026 (Bugün)',
    totalActiveMinutes: 325,
    totalGasM3: 4.85,
    avgTemp: 21.6,
    hours: [
      { hourLabel: '00:00', temp: 19.1, target: 18.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '02:00', temp: 18.4, target: 18.5, isActive: true, flameLevelPercent: 40, powerKw: 9.6, gasM3: 0.32 },
      { hourLabel: '04:00', temp: 18.6, target: 18.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '06:00', temp: 18.8, target: 22.5, isActive: true, flameLevelPercent: 85, powerKw: 20.4, gasM3: 0.68 },
      { hourLabel: '08:00', temp: 22.1, target: 22.5, isActive: true, flameLevelPercent: 55, powerKw: 13.2, gasM3: 0.44 },
      { hourLabel: '10:00', temp: 22.4, target: 22.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '12:00', temp: 22.0, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '14:00', temp: 21.2, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '16:00', temp: 20.5, target: 22.5, isActive: true, flameLevelPercent: 70, powerKw: 16.8, gasM3: 0.56 },
      { hourLabel: '18:00', temp: 22.2, target: 22.5, isActive: true, flameLevelPercent: 60, powerKw: 14.4, gasM3: 0.48 },
      { hourLabel: '20:00', temp: 22.6, target: 22.5, isActive: true, flameLevelPercent: 45, powerKw: 10.8, gasM3: 0.36 },
      { hourLabel: '22:00', temp: 22.1, target: 22.5, isActive: true, flameLevelPercent: 50, powerKw: 12.0, gasM3: 0.40 },
    ],
  },
  '2026-10-15': {
    dateKey: '2026-10-15',
    dateTitle: '15 Ekim 2026 (Dün)',
    totalActiveMinutes: 380,
    totalGasM3: 5.62,
    avgTemp: 21.1,
    hours: [
      { hourLabel: '00:00', temp: 18.8, target: 18.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '02:00', temp: 18.2, target: 18.5, isActive: true, flameLevelPercent: 45, powerKw: 10.8, gasM3: 0.36 },
      { hourLabel: '04:00', temp: 18.0, target: 18.5, isActive: true, flameLevelPercent: 50, powerKw: 12.0, gasM3: 0.40 },
      { hourLabel: '06:00', temp: 18.5, target: 22.5, isActive: true, flameLevelPercent: 90, powerKw: 21.6, gasM3: 0.72 },
      { hourLabel: '08:00', temp: 21.8, target: 22.5, isActive: true, flameLevelPercent: 65, powerKw: 15.6, gasM3: 0.52 },
      { hourLabel: '10:00', temp: 22.3, target: 22.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '12:00', temp: 21.5, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '14:00', temp: 20.8, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '16:00', temp: 20.1, target: 22.5, isActive: true, flameLevelPercent: 75, powerKw: 18.0, gasM3: 0.60 },
      { hourLabel: '18:00', temp: 22.0, target: 22.5, isActive: true, flameLevelPercent: 65, powerKw: 15.6, gasM3: 0.52 },
      { hourLabel: '20:00', temp: 22.4, target: 22.5, isActive: true, flameLevelPercent: 55, powerKw: 13.2, gasM3: 0.44 },
      { hourLabel: '22:00', temp: 21.9, target: 22.5, isActive: true, flameLevelPercent: 60, powerKw: 14.4, gasM3: 0.48 },
    ],
  },
  '2026-10-14': {
    dateKey: '2026-10-14',
    dateTitle: '14 Ekim 2026 (Çarşamba)',
    totalActiveMinutes: 295,
    totalGasM3: 4.35,
    avgTemp: 21.9,
    hours: [
      { hourLabel: '00:00', temp: 19.3, target: 18.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '02:00', temp: 18.7, target: 18.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '04:00', temp: 18.4, target: 18.5, isActive: true, flameLevelPercent: 35, powerKw: 8.4, gasM3: 0.28 },
      { hourLabel: '06:00', temp: 19.0, target: 22.5, isActive: true, flameLevelPercent: 80, powerKw: 19.2, gasM3: 0.64 },
      { hourLabel: '08:00', temp: 22.3, target: 22.5, isActive: true, flameLevelPercent: 50, powerKw: 12.0, gasM3: 0.40 },
      { hourLabel: '10:00', temp: 22.7, target: 22.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '12:00', temp: 22.4, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '14:00', temp: 21.8, target: 20.0, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '16:00', temp: 21.0, target: 22.5, isActive: true, flameLevelPercent: 65, powerKw: 15.6, gasM3: 0.52 },
      { hourLabel: '18:00', temp: 22.4, target: 22.5, isActive: true, flameLevelPercent: 50, powerKw: 12.0, gasM3: 0.40 },
      { hourLabel: '20:00', temp: 22.7, target: 22.5, isActive: false, flameLevelPercent: 0, powerKw: 0, gasM3: 0 },
      { hourLabel: '22:00', temp: 22.2, target: 22.5, isActive: true, flameLevelPercent: 45, powerKw: 10.8, gasM3: 0.36 },
    ],
  },
};

function getDayDataForDate(dateStr: string): HistoricalDayData {
  if (HISTORICAL_DATABASE[dateStr]) return HISTORICAL_DATABASE[dateStr];
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 10;
  const d = parseInt(parts[2], 10) || 16;
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const monthName = monthNames[m - 1] || 'Ekim';
  const dateTitle = `${d} ${monthName} ${y}`;

  const hours: TelemetryHour[] = [];
  let totalGas = 0;
  let totalMin = 0;
  let tempSum = 0;

  for (let i = 0; i < 24; i += 2) {
    const hh = String(i).padStart(2, '0') + ':00';
    const baseTemp = 18.2 + Math.sin((i - 6) / 24 * Math.PI * 2) * 2.8 + ((d % 7) - 3) * 0.3;
    const temp = Math.round(baseTemp * 10) / 10;
    const target = (i >= 6 && i <= 22) ? 22.5 : 18.5;
    const isActive = temp < target;
    const flameLevel = isActive ? Math.min(100, Math.max(30, Math.round((target - temp) * 25 + 35))) : 0;
    const powerKw = isActive ? Math.round((flameLevel * 0.24) * 10) / 10 : 0;
    const gasM3 = isActive ? Math.round((powerKw * 0.033) * 100) / 100 : 0;
    if (isActive) {
      totalGas += gasM3;
      totalMin += Math.round(flameLevel * 0.5);
    }
    tempSum += temp;
    hours.push({
      hourLabel: hh,
      temp,
      target,
      isActive,
      flameLevelPercent: flameLevel,
      powerKw,
      gasM3,
    });
  }

  return {
    dateKey: dateStr,
    dateTitle,
    totalActiveMinutes: Math.max(120, totalMin),
    totalGasM3: Math.round(Math.max(1.5, totalGas) * 100) / 100,
    avgTemp: Math.round((tempSum / hours.length) * 10) / 10,
    hours,
  };
}

interface ReportDeckViewProps {
  isKombiActive: boolean;
  flameLevelPercent: number;
  waterPressure: number;
  pumpRpm?: number;
  currentTemp: number;
  humidity: number;
  targetTemp: number;
}

export const ReportDeckView: React.FC<ReportDeckViewProps> = ({
  isKombiActive,
  flameLevelPercent,
  waterPressure,
  pumpRpm = 1420,
  currentTemp,
  humidity,
  targetTemp,
}) => {
  // 0: Sıcaklık Isı Haritası & Brülör Dağılımı
  // 1: Doğalgaz Tüketim & Fatura Analitiği
  // 2: Kombi Telemetrisi & Canlı Ortam Sensörleri
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2>(0);

  // Timeframe and date state
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-16');

  // Gas unit price state
  const [gasUnitPrice, setGasUnitPrice] = useState<number>(10.45);
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<string>('10.45');

  // Hour detail popup modal state (kapat butonu ile kapanabilir modal)
  const [selectedHourModal, setSelectedHourModal] = useState<TelemetryHour | null>(null);

  // Native date input ref
  const dateInputRef = useRef<HTMLInputElement>(null);

  const currentDayData = useMemo(() => {
    return getDayDataForDate(selectedDate);
  }, [selectedDate]);

  // Aggregate stats based on timeframe
  const aggregatedStats = useMemo(() => {
    if (timeframe === 'weekly') {
      const mult = 7;
      const gas = Math.round(currentDayData.totalGasM3 * mult * 0.95 * 100) / 100;
      const activeMin = currentDayData.totalActiveMinutes * mult;
      const cost = Math.round(gas * gasUnitPrice * 100) / 100;
      const savedGas = Math.round(gas * 0.28 * 100) / 100;
      const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
      return { gas, activeMin, cost, savedGas, savedCost, label: '7 Günlük Toplam' };
    }

    if (timeframe === 'monthly') {
      const mult = 30;
      const gas = Math.round(currentDayData.totalGasM3 * mult * 0.92 * 100) / 100;
      const activeMin = currentDayData.totalActiveMinutes * mult;
      const cost = Math.round(gas * gasUnitPrice * 100) / 100;
      const savedGas = Math.round(gas * 0.29 * 100) / 100;
      const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
      return { gas, activeMin, cost, savedGas, savedCost, label: '30 Günlük Fatura Projeksiyonu' };
    }

    // Daily
    const gas = currentDayData.totalGasM3;
    const activeMin = currentDayData.totalActiveMinutes;
    const cost = Math.round(gas * gasUnitPrice * 100) / 100;
    const savedGas = Math.round(gas * 0.27 * 100) / 100;
    const savedCost = Math.round(savedGas * gasUnitPrice * 100) / 100;
    return { gas, activeMin, cost, savedGas, savedCost, label: 'Seçili Gün Özeti' };
  }, [timeframe, currentDayData, gasUnitPrice]);

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

    // Swipe UP (parmak yukarı kaydı) -> Sonraki pencereye geç
    if (deltaY < -24) {
      setActiveLayer((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));
    }
    // Swipe DOWN (parmak aşağı kaydı) -> Önceki pencereye dön
    else if (deltaY > 24) {
      setActiveLayer((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev));
    }

    touchStartY.current = null;
  };

  // Mouse wheel handling
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

  // Helper for temperature badge color
  const getTempColorClass = (temp: number) => {
    if (temp < 18.0) return 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/40';
    if (temp < 20.0) return 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-400/40';
    if (temp < 22.0) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40';
    if (temp < 23.5) return 'bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-400/50';
    return 'bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-500/50';
  };

  // Comfort and gauge values for layer 2
  const comfort = calculateComfortIndex(currentTemp, humidity);
  const tempDiff = currentTemp - targetTemp;
  const calcArc = (val: number, min: number, max: number) => {
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
    const totalLength = 188.5;
    return totalLength * (1 - ratio);
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none p-1 sm:p-2"
    >
      {/* ── TOP LAYER SWITCHER PILLS (3 Pencere: Sıcaklık Haritası, Doğalgaz Faturası, Kombi & Sensörler) ── */}
      <div className="shrink-0 flex items-center justify-center mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveLayer(0)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 0
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🌡️</span>
            <span>Sıcaklık Haritası</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(1)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 1
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💰</span>
            <span>Doğalgaz Faturası</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(2)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeLayer === 2
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔥</span>
            <span>Kombi & Sensörler</span>
          </button>
        </div>
      </div>

      {/* ── STACKED 3D FLOAT & BLUR CONTAINER (3 Pencere, çerçeveyle eşleşen yükseklik ve sıfır scroll) ── */}
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
          className="absolute inset-0 w-full h-full flex flex-col justify-between bg-white/90 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* 1. Satır: Sıcaklık Haritası Başlığı (Tek Satır) */}
          <div className="w-full flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
              <BarChart2 className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Sıcaklık Haritası & Brülör Ateşleme Dağılımı</span>
            </h3>
          </div>

          {/* 2. Satır: Günlük / Haftalık / Aylık (Tek Satır) */}
          <div className="w-full shrink-0 my-1">
            <div className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setTimeframe('daily')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'daily'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Günlük
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Haftalık
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Aylık
              </button>
            </div>
          </div>

          {/* 3. Bölüm: İncelenen Gün (2 Satırlı Çerçeve: 1. Satır Tarih Seçimi, 2. Satır Aktif Yanma & Beklemede) */}
          <div className="w-full flex flex-col gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-150 dark:border-slate-750 shrink-0 my-1">
            {/* 1. Satır: İncelenen Gün ve Tarih Butonu */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                İncelenen Gün:
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (dateInputRef.current) {
                      if (typeof dateInputRef.current.showPicker === 'function') {
                        dateInputRef.current.showPicker();
                      } else {
                        dateInputRef.current.click();
                      }
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                  title="Takvimi açmak için tıklayın"
                >
                  <span>{currentDayData.dateTitle}</span>
                  <ChevronDown className="w-3 h-3 text-blue-200 shrink-0" />
                </button>

                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                />
              </div>
            </div>

            {/* 2. Satır: Aktif Yanma ve Beklemede Durumu */}
            <div className="flex items-center justify-end gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>Aktif Yanma</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                <span>Beklemede</span>
              </span>
            </div>
          </div>

          {/* 24 Saatlik Sıcaklık Haritası (Tek Satır Başlık, Parantezsiz, Çerçeveye Tam Sığan Grid) */}
          <div className="flex-1 flex flex-col justify-center min-h-0 py-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">24 Saatlik Sıcaklık Haritası</span>
            </div>

            {/* Heatmap Grid Visualizer: 12 hücre kompakt olarak çerçeveye sığar */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 sm:gap-1.5 h-full max-h-[220px]">
              {currentDayData.hours.map((h) => (
                <button
                  key={h.hourLabel}
                  type="button"
                  onClick={() => setSelectedHourModal(h)}
                  className={`p-1 sm:p-1.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer relative hover:scale-105 active:scale-95 ${
                    h.isActive
                      ? 'border-orange-500/70 bg-gradient-to-b from-orange-500/15 to-amber-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-800/80 hover:border-slate-300'
                  }`}
                  title={`${h.hourLabel} detayları için tıklayın`}
                >
                  {/* Hour Label */}
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block">
                    {h.hourLabel}
                  </span>

                  {/* Temperature Badge */}
                  <div
                    className={`my-0.5 px-1 py-0.2 rounded font-mono font-black text-[11px] border ${getTempColorClass(
                      h.temp
                    )}`}
                  >
                    {h.temp}°
                  </div>

                  {/* Kombi Flame / Modulation Status */}
                  <div className="flex items-center justify-center h-4">
                    {h.isActive ? (
                      <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-1 py-0.2 rounded">
                        <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500 animate-pulse" />
                        %{h.flameLevelPercent}
                      </span>
                    ) : (
                      <span className="text-[8.5px] text-slate-400 font-mono">0 kW</span>
                    )}
                  </div>

                  {/* Gas burned */}
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-mono">
                    {h.gasM3 > 0 ? `${h.gasM3}m³` : '-'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PENCERE 1: DOĞALGAZ TÜKETİM & FATURA ANALİTİĞİ (KÜÇÜLTÜLMÜŞ PUNTO & ÇERÇEVE)
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
          className="absolute inset-0 w-full h-full flex flex-col justify-between bg-white/90 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                Doğalgaz Tüketim & Fatura Maliyet Hesaplama
              </h3>
            </div>

            {/* Unit Price Customizer */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Birim Fiyat:</span>
              {isEditingPrice ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-14 px-1 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSavePrice}
                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPriceInput(gasUnitPrice.toString());
                    setIsEditingPrice(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-50 dark:bg-slate-750 border border-orange-300 dark:border-slate-650 font-mono font-bold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-slate-700 text-xs shadow-xs cursor-pointer"
                  title="Birim fiyatı düzenle"
                >
                  <span>{gasUnitPrice.toFixed(2)} TL / m³</span>
                  <Edit2 className="w-2.5 h-2.5 text-orange-500" />
                </button>
              )}
            </div>
          </div>

          {/* 3 Metric Cards (Kompakt ve Çerçeveye Tam Sığacak Boyutlandırma) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 items-center my-auto py-1">
            {/* Box 1: Total Gas m³ */}
            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex flex-col justify-between h-full max-h-[140px]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                1. Toplam Kullanım (m³)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400 flex items-baseline gap-1 my-1">
                {aggregatedStats.gas.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal">m³</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.floor(aggregatedStats.activeMin / 60)} saat {aggregatedStats.activeMin % 60} dk aktif yanma
              </span>
            </div>

            {/* Box 2: Unit Price */}
            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex flex-col justify-between h-full max-h-[140px]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                2. m³ Birim Fiyatı (TL)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-800 dark:text-white flex items-baseline gap-1 my-1">
                {gasUnitPrice.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal">TL/m³</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Bölgesel güncel doğalgaz tarifesi
              </span>
            </div>

            {/* Box 3: Total Estimated Bill */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 flex flex-col justify-between h-full max-h-[140px]">
              <span className="text-[11px] text-orange-100 font-semibold block flex items-center justify-between">
                <span>3. Toplam Fatura Tutarı</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline gap-1 my-1">
                {aggregatedStats.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-bold text-orange-100">TL</span>
              </div>
              <span className="text-[10px] text-orange-100">
                {aggregatedStats.label} (KDV dahil)
              </span>
            </div>
          </div>

          {/* Formula Banner & Modulation Savings */}
          <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                {aggregatedStats.gas.toFixed(2)} m³ × {gasUnitPrice.toFixed(2)} TL ={' '}
                <span className="text-orange-600 dark:text-orange-400">{aggregatedStats.cost.toFixed(2)} TL</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <span>✨ Tasarruf:</span>
              <span>~{aggregatedStats.savedGas.toFixed(2)} m³ ({aggregatedStats.savedCost.toFixed(2)} TL)</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PENCERE 2: KOMBİ TELEMETRİSİ & CANLI ORTAM SENSÖRLERİ (TEK ÇERÇEVEYE SIĞACAK ŞEKİLDE KÜÇÜLTÜLMÜŞ)
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
          className="absolute inset-0 w-full h-full flex flex-col justify-between bg-white/90 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                Kombi Röle & Canlı Ortam Sensörleri
              </h3>
            </div>

            <div
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                isKombiActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isKombiActive ? 'animate-bounce text-amber-500' : 'text-slate-400'}`} />
              <span>{isKombiActive ? 'Aktif Isıtma' : 'Beklemede'}</span>
            </div>
          </div>

          {/* ÜST BÖLÜM: Kombi Brülör Alev Modülasyonu, Su Basıncı, Sirkülasyon & Güvenlik */}
          <div className="shrink-0 space-y-2">
            {/* Brülör Alev Modülasyonu Barı */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  Brülör Alev Modülasyonu
                </span>
                <span className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                  %{flameLevelPercent}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${flameLevelPercent}%`,
                    background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                <span>%0 (Kapalı)</span>
                <span>%50 (Orta Güç)</span>
                <span>%100 (Maks)</span>
              </div>
            </div>

            {/* Su Basıncı, Sirkülasyon Devri ve Güvenlik Rölesi */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  <Gauge className="w-3 h-3 text-blue-500" />
                  Su Basıncı
                </div>
                <div className="text-base font-black text-slate-800 dark:text-white font-mono">
                  {waterPressure.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">bar</span>
                </div>
                <span className="text-[9px] font-semibold text-emerald-500">Normal</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  Sirkülasyon
                </div>
                <div className="text-base font-black text-slate-800 dark:text-white font-mono">
                  {isKombiActive ? pumpRpm : 0} <span className="text-[10px] font-normal text-slate-400">RPM</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400">
                  {isKombiActive ? 'Kademe II' : 'Durgun'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Güvenlik
                </div>
                <div className="text-base font-black text-slate-800 dark:text-white">
                  OK
                </div>
                <span className="text-[9px] font-semibold text-emerald-500">Kusursuz</span>
              </div>
            </div>
          </div>

          {/* ALT BÖLÜM: Ortam Sensörleri (Oda Sıcaklığı & Nem SVG Göstergeleri - Tek Çerçeveye Sığacak Boyutta) */}
          <div className="flex-1 flex flex-col justify-center min-h-0 py-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>Canlı Ortam Sensörleri</span>
              <div
                className="text-[10px] font-semibold px-2 py-0.2 rounded-full border"
                style={{
                  borderColor: `${comfort.color}40`,
                  backgroundColor: `${comfort.color}15`,
                  color: comfort.color,
                }}
              >
                {comfort.label} ({comfort.score}/100)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 h-full max-h-[140px]">
              {/* Temperature Gauge */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  Oda Sıcaklığı
                </span>
                <div className="relative w-24 h-14 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 140 80">
                    <path
                      d="M 10 70 A 60 60 0 0 1 130 70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <path
                      d="M 10 70 A 60 60 0 0 1 130 70"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="188.5"
                      strokeDashoffset={calcArc(currentTemp, 10, 35)}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute bottom-0 text-center">
                    <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                      {currentTemp.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">°C</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {tempDiff > 0 ? `+${tempDiff.toFixed(1)}°` : `${tempDiff.toFixed(1)}°`} hedef
                </div>
              </div>

              {/* Humidity Gauge */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                  Bağıl Nem
                </span>
                <div className="relative w-24 h-14 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 140 80">
                    <path
                      d="M 10 70 A 60 60 0 0 1 130 70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <path
                      d="M 10 70 A 60 60 0 0 1 130 70"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="188.5"
                      strokeDashoffset={calcArc(humidity, 0, 100)}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute bottom-0 text-center">
                    <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                      %{humidity}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Konfor Aralığı: %40-60
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── SAAT DETAYLARI POP-UP MODAL (createPortal ile taşmasız ve yanında çarpı işareti ile) ── */}
      {selectedHourModal && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedHourModal(null);
          }}
        >
          <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header + Çarpı [X] Kapatma Butonu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Saat {selectedHourModal.hourLabel} Telemetri Detayları
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHourModal(null)}
                aria-label="Kapat"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Ölçülen Oda Sıcaklığı:</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {selectedHourModal.temp}°C
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Hedeflenen Sıcaklık:</span>
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {selectedHourModal.target}°C
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Kombi Brülör Durumu:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  selectedHourModal.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'
                }`}>
                  {selectedHourModal.isActive ? (
                    <>
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                      Aktif (%{selectedHourModal.flameLevelPercent} / {selectedHourModal.powerKw} kW)
                    </>
                  ) : (
                    '❄️ Beklemede (0 kW)'
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 dark:bg-orange-950/30 border border-orange-500/30">
                <span className="text-orange-800 dark:text-orange-300 font-medium">Bu Saatteki Gaz Tüketimi:</span>
                <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                  {selectedHourModal.gasM3} m³
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">Tahmini Maliyet:</span>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  ~{(selectedHourModal.gasM3 * gasUnitPrice).toFixed(2)} TL
                </span>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedHourModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
