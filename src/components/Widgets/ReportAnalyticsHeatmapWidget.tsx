import React, { useState, useMemo } from 'react';
import {
  Flame,
  Calendar,
  Coins,
  Clock,
  TrendingUp,
  BarChart2,
  Sparkles,
  Zap,
  Info,
  Edit2,
  Check,
} from 'lucide-react';

export type TimeframeMode = 'daily' | 'weekly' | 'monthly';

interface TelemetryHour {
  hourLabel: string; // e.g. '06:00'
  temp: number; // e.g. 21.8
  target: number; // e.g. 22.5
  isActive: boolean; // Boiler flame active?
  flameLevelPercent: number; // 0 to 100%
  powerKw: number; // e.g. 16.5 kW
  gasM3: number; // e.g. 0.42 m3
}

interface HistoricalDayData {
  dateKey: string; // '2026-10-16'
  dateTitle: string; // '16 Ekim 2026 (Bugün)'
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

export const ReportAnalyticsHeatmapWidget: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-16');
  const [gasUnitPrice, setGasUnitPrice] = useState<number>(10.45); // ₺ / m³
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<string>('10.45');
  const [hoveredHour, setHoveredHour] = useState<TelemetryHour | null>(null);

  const currentDayData = useMemo(() => {
    return HISTORICAL_DATABASE[selectedDate] || HISTORICAL_DATABASE['2026-10-16'];
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

  // Helper function for cell background based on temperature
  const getTempColorClass = (temp: number) => {
    if (temp < 18.0) return 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/40';
    if (temp < 20.0) return 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-400/40';
    if (temp < 22.0) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40';
    if (temp < 23.5) return 'bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-400/50';
    return 'bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-500/50';
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 space-y-4">
      {/* ── TOP CONTROLS: TIMEFRAME SELECTOR & DATE MEMORY PICKER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              Sıcaklık Haritası, Kombi Çalışma & Doğalgaz Fatura Analitiği
            </h3>
            <span className="text-[10px] text-slate-400">
              Bellek tabanlı saatlik telemetri, aktif yanma periyotları ve m³ maliyet hesabı
            </span>
          </div>
        </div>

        {/* Timeframe Switcher Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Günlük (24S)
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Haftalık (7G)
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Aylık (30G)
          </button>
        </div>
      </div>

      {/* ── DATE SELECTION FROM DEVICE MEMORY ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            İncelenen Gün:
          </span>
          {Object.entries(HISTORICAL_DATABASE).map(([key, data]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDate === key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {data.dateTitle}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Aktif Yanma Saatleri
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span> Beklemede
          </span>
        </div>
      </div>

      {/* ── SICAKLIK & AKTİF KOMBİ ISITMA ISI HARİTASI (HEATMAP & MATRIX) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>24 Saatlik Sıcaklık Haritası & Brülör Ateşleme Dağılımı</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            Hücreye gelin: Detaylı saat, güç, hedef ve gaz hesabı
          </span>
        </div>

        {/* Heatmap Grid Visualizer */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2">
          {currentDayData.hours.map((h) => (
            <div
              key={h.hourLabel}
              onMouseEnter={() => setHoveredHour(h)}
              onMouseLeave={() => setHoveredHour(null)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer relative group ${
                h.isActive
                  ? 'border-orange-500/70 bg-gradient-to-b from-orange-500/15 to-amber-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-800/80 hover:border-slate-300'
              }`}
            >
              {/* Hour Label */}
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block">
                {h.hourLabel}
              </span>

              {/* Temperature Badge with Heatmap Color */}
              <div
                className={`my-1 px-1.5 py-0.5 rounded-md font-mono font-black text-xs border ${getTempColorClass(
                  h.temp
                )}`}
              >
                {h.temp}°C
              </div>

              {/* Kombi Flame / Modulation Status */}
              <div className="flex items-center justify-center h-5">
                {h.isActive ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-1 py-0.2 rounded-sm">
                    <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500 animate-pulse" />
                    %{h.flameLevelPercent}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-mono">0 kW</span>
                )}
              </div>

              {/* Gas burned during this hour */}
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                {h.gasM3 > 0 ? `${h.gasM3} m³` : '-'}
              </span>
            </div>
          ))}
        </div>

        {/* Hovered Hour Detail Card (Interactive Telemetry Peek) */}
        {hoveredHour && (
          <div className="p-2.5 rounded-xl bg-orange-500/10 dark:bg-slate-800 border border-orange-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-slate-800 dark:text-white">
                Saat {hoveredHour.hourLabel} Detayları:
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Oda: <b>{hoveredHour.temp}°C</b> (Hedef: {hoveredHour.target}°C)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <span className="text-orange-600 dark:text-orange-400">
                Durum: {hoveredHour.isActive ? `🔥 Aktif (%${hoveredHour.flameLevelPercent} / ${hoveredHour.powerKw} kW)` : '❄️ Beklemede'}
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Tüketim: {hoveredHour.gasM3} m³ (~{(hoveredHour.gasM3 * gasUnitPrice).toFixed(2)} ₺)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── TOPLAM DOĞALGAZ (m³) x m³ BİRİM FİYAT = TOPLAM FATURA HESABI ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 dark:from-slate-800/90 dark:to-slate-850 border-2 border-orange-500/40 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
              Doğalgaz Tüketim & Fatura Maliyet Hesaplama
            </h4>
          </div>

          {/* Unit Price Customizer */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Birim Fiyat:</span>
            {isEditingPrice ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-16 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleSavePrice}
                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 dark:bg-slate-750 border border-orange-300 dark:border-slate-650 font-mono font-bold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-slate-700 text-xs shadow-xs cursor-pointer"
                title="Birim fiyatı düzenle"
              >
                <span>{gasUnitPrice.toFixed(2)} TL / m³</span>
                <Edit2 className="w-3 h-3 text-orange-500" />
              </button>
            )}
          </div>
        </div>

        {/* The Calculation Formula: [Toplam Kullanım m³] x [m³ Fiyatı] = [Toplam Tutar TL] */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Box 1: Total Gas m³ */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
              1. Toplam Kullanım (m³)
            </span>
            <div className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400 flex items-baseline gap-1">
              {aggregatedStats.gas.toFixed(2)}
              <span className="text-xs text-slate-400 font-normal">m³ gaz</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {Math.floor(aggregatedStats.activeMin / 60)} saat {aggregatedStats.activeMin % 60} dk brülör yanması
            </span>
          </div>

          {/* Box 2: Unit Price */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">
              2. m³ Birim Fiyatı (TL)
            </span>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-white flex items-baseline gap-1">
              {gasUnitPrice.toFixed(2)}
              <span className="text-xs text-slate-400 font-normal">TL / m³</span>
            </div>
            <span className="text-[10px] text-slate-400">Güncel bölgesel doğalgaz tarifesi</span>
          </div>

          {/* Box 3: Total Estimated Bill */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
            <span className="text-[11px] text-orange-100 font-semibold block mb-0.5 flex items-center justify-between">
              <span>3. Toplam Fatura Tutarı (Tahmin)</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            </span>
            <div className="text-3xl font-black font-mono tracking-tight flex items-baseline gap-1">
              {aggregatedStats.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm font-bold text-orange-100">TL</span>
            </div>
            <span className="text-[10px] text-orange-100">
              {aggregatedStats.label} (KDV & Dağıtım dahil)
            </span>
          </div>
        </div>

        {/* Calculation Summary Formula Banner */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
              Formül: {aggregatedStats.gas.toFixed(2)} m³ × {gasUnitPrice.toFixed(2)} TL ={' '}
              <span className="text-orange-600 dark:text-orange-400">{aggregatedStats.cost.toFixed(2)} TL</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
            <span>✨ Modülasyon Tasarrufu:</span>
            <span>~{aggregatedStats.savedGas.toFixed(2)} m³ ({aggregatedStats.savedCost.toFixed(2)} TL)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
