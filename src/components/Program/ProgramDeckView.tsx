import React, { useState, useRef } from 'react';
import {
  Clock,
  Sparkles,
  Flame,
  Coins,
  ArrowDownRight,
  Save,
  Check,
  ShieldCheck,
  Zap,
  Gauge,
  Activity,
} from 'lucide-react';
import type { ScheduleItem, ThemeMode } from '../../types.ts';
import { estimateGasConsumption, calculateEstimatedCost } from '../../utils/thermostatRules.ts';
import { translations, type Language } from '../../utils/i18n.ts';

interface ProgramDeckViewProps {
  schedules: ScheduleItem[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  isEncrypted: boolean;
  dailyRunMinutes: number;
  flameLevelPercent: number;
  themeMode?: ThemeMode;
  lang?: Language;
}

export const ProgramDeckView: React.FC<ProgramDeckViewProps> = ({
  schedules,
  onSaveSchedules,
  isEncrypted,
  dailyRunMinutes,
  flameLevelPercent,
  themeMode = 'glass',
  lang = 'tr',
}) => {
  const t = translations[lang] || translations.tr;
  const isGlass = themeMode === 'glass';

  // 0: Akıllı Zamanlama & Haftalık Program (Front layer)
  // 1: Günlük Tüketim & Akıllı Modülasyon Tasarrufu (Back/Stacked layer)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Local schedules state
  const [localList, setLocalList] = useState<ScheduleItem[]>(schedules);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Consumption calculations
  const m3Gas = estimateGasConsumption(dailyRunMinutes, Math.max(30, flameLevelPercent));
  const estimatedCostTL = calculateEstimatedCost(m3Gas, 10.25);
  const unmodulatedCost = calculateEstimatedCost(m3Gas * 1.28, 10.25);
  const savedTL = Math.max(0, Math.round((unmodulatedCost - estimatedCostTL) * 10) / 10);
  const hours = Math.floor(dailyRunMinutes / 60);
  const minutes = dailyRunMinutes % 60;

  // Touch swipe gesture handling
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    if (deltaY < -24 && activeLayer === 0) {
      setActiveLayer(1);
    } else if (deltaY > 24 && activeLayer === 1) {
      setActiveLayer(0);
    }
    touchStartY.current = null;
  };

  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 380) return;

    if (e.deltaY > 20 && activeLayer === 0) {
      setActiveLayer(1);
      lastWheelTime.current = now;
    } else if (e.deltaY < -20 && activeLayer === 1) {
      setActiveLayer(0);
      lastWheelTime.current = now;
    }
  };

  const toggleItem = (id: string) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateTime = (id: string, time: string) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, time } : item))
    );
  };

  const updateTemp = (id: string, temp: number) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetTemp: temp } : item))
    );
  };

  const handleSave = () => {
    onSaveSchedules(localList);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  // Glass 2nd layer styles
  const windowBaseClass = isGlass
    ? 'bg-slate-950/35 border border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-lg text-slate-100'
    : 'bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm';

  const subBoxClass = isGlass
    ? 'bg-white/[0.08] border border-white/12 text-slate-100 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
    : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200';

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none p-1 sm:p-2"
    >
      {/* ── TOP LAYER SWITCHER PILLS ── */}
      <div className="shrink-0 flex items-center justify-center mb-2.5">
        <div className={`flex items-center gap-1.5 p-1 rounded-2xl border transition-all ${
          isGlass
            ? 'bg-white/[0.10] border-white/20 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3)]'
            : 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => setActiveLayer(0)}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLayer === 0
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⏰</span>
            <span>{t.progTabSchedule}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(1)}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLayer === 1
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💰</span>
            <span>{t.progTabConsumption}</span>
          </button>
        </div>
      </div>

      {/* ── STACKED 3D FLOAT & BLUR CONTAINER ── */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* ── PENCERE 1: AKILLI ZAMANLAMA & HAFTALIK PROGRAM (Öndeki Pencere) ── */}
        <div
          style={{
            transform:
              activeLayer === 0
                ? 'translateY(0px) scale(1)'
                : 'translateY(-65px) scale(0.92)',
            opacity: activeLayer === 0 ? 1 : 0,
            filter: activeLayer === 0 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 0 ? 'auto' : 'none',
            zIndex: activeLayer === 0 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className={`absolute inset-0 w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 overflow-hidden ${windowBaseClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
                {t.progTabSchedule}
              </h3>
            </div>
            {isEncrypted && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.encryptedGcm}
              </span>
            )}
          </div>

          {/* 4 Proportionally Scaled Schedule Items */}
          <div className="flex-1 flex flex-col justify-around gap-2 my-auto overflow-hidden py-1">
            {localList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border transition-all ${
                  item.enabled ? subBoxClass : 'bg-white/[0.03] border-white/5 opacity-50'
                }`}
              >
                {/* Switch & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-label={`${item.name} status`}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 cursor-pointer ${
                      item.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        item.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {item.name}
                  </span>
                </div>

                {/* Controls: Time & Temp */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Time Input */}
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-xl border border-white/15 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateTime(item.id, e.target.value)}
                      aria-label={`${item.name} time`}
                      className="bg-transparent text-white text-xs sm:text-sm font-mono font-bold focus:outline-none w-[65px]"
                    />
                  </div>

                  {/* Target Temp Input */}
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xl border border-white/15 shadow-2xs">
                    <input
                      type="number"
                      min="10"
                      max="32"
                      step="0.5"
                      value={item.targetTemp}
                      onChange={(e) => updateTemp(item.id, parseFloat(e.target.value) || 20)}
                      aria-label={`${item.name} target`}
                      className="w-11 bg-transparent text-white text-xs sm:text-sm font-mono font-bold text-center focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Save Button */}
          <div className="shrink-0 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.scheduleSaved}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.saveSchedule}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── PENCERE 2: GÜNLÜK TÜKETİM & AKILLI MODÜLASYON TASARRUFU (Alttaki Pencere) ── */}
        <div
          style={{
            transform:
              activeLayer === 1
                ? 'translateY(0px) scale(1)'
                : 'translateY(65px) scale(0.92)',
            opacity: activeLayer === 1 ? 1 : 0,
            filter: activeLayer === 1 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 1 ? 'auto' : 'none',
            zIndex: activeLayer === 1 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className={`absolute inset-0 w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 overflow-hidden ${windowBaseClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
                {t.progTabConsumption}
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              A++ Verimlilik
            </span>
          </div>

          {/* 3 Large Proportionally Scaled Metric Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 my-auto shrink-0">
            {/* Runtime */}
            <div className={`p-3 rounded-2xl text-center ${subBoxClass}`}>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.dailyRuntime}</span>
              </div>
              <div className="text-base sm:text-xl font-black text-white font-mono">
                {hours > 0 ? `${hours}s ${minutes}d` : `${minutes} dk`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Bugün yanma</div>
            </div>

            {/* Gas M3 */}
            <div className={`p-3 rounded-2xl text-center ${subBoxClass}`}>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{t.totalGasUsed}</span>
              </div>
              <div className="text-base sm:text-xl font-black text-orange-400 font-mono">
                ~{m3Gas.toFixed(2)} <span className="text-xs font-normal text-slate-300">m³</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">24 kW brülör</div>
            </div>

            {/* Cost TL */}
            <div className={`p-3 rounded-2xl text-center ${subBoxClass}`}>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.estimatedCost}</span>
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-400 font-mono">
                ~{estimatedCostTL.toFixed(1)} <span className="text-xs font-normal text-slate-300">TL</span>
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold truncate flex items-center justify-center gap-0.5 mt-1">
                <ArrowDownRight className="w-3 h-3" />
                ~{savedTL} TL tasarruf
              </div>
            </div>
          </div>

          {/* Akıllı Modülasyon Tasarrufu & Canlı Güç Barı */}
          <div className="bg-emerald-500/15 border border-emerald-400/30 p-3 sm:p-4 rounded-2xl text-xs text-emerald-200 flex flex-col gap-2 shrink-0 backdrop-blur-sm shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-xs sm:text-sm text-emerald-200">
                  {t.modulationEfficiency}:
                </span>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mt-0.5">
                  Kombi oda sıcaklığına yaklaştıkça modülasyonu otomatik kısarak doğalgaz sarfiyatını %20 ila %28 oranında azaltır.
                </p>
              </div>
            </div>

            {/* Live modulation progress bar */}
            <div className="mt-1 pt-2 border-t border-emerald-400/20 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300">Alev Gücü:</span>
              <div className="flex-1 mx-3 bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div
                  style={{ width: `${Math.max(15, flameLevelPercent)}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-500"
                />
              </div>
              <span className="font-bold text-emerald-300">%{flameLevelPercent}</span>
            </div>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="grid grid-cols-2 gap-2 shrink-0 text-[11px]">
            <div className={`p-2 rounded-xl flex items-center justify-between ${subBoxClass}`}>
              <span className="text-slate-300 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                {t.waterPressure}:
              </span>
              <span className="font-bold font-mono text-white">1.6 Bar</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center justify-between ${subBoxClass}`}>
              <span className="text-slate-300 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                {t.circulationPump}:
              </span>
              <span className="font-bold font-mono text-white">1420 RPM</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
