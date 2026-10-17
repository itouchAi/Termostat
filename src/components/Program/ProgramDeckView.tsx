import React, { useState, useRef } from 'react';
import {
  Clock,
  Sparkles,
  Flame,
  Coins,
  ArrowDownRight,
  Save,
  Check,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { ScheduleItem } from '../../types.ts';
import { estimateGasConsumption, calculateEstimatedCost } from '../../utils/thermostatRules.ts';

interface ProgramDeckViewProps {
  schedules: ScheduleItem[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  isEncrypted: boolean;
  dailyRunMinutes: number;
  flameLevelPercent: number;
}

export const ProgramDeckView: React.FC<ProgramDeckViewProps> = ({
  schedules,
  onSaveSchedules,
  isEncrypted,
  dailyRunMinutes,
  flameLevelPercent,
}) => {
  // 0: Akıllı Zamanlama & Haftalık Program (Front layer)
  // 1: Günlük Tüketim & Akıllı Modülasyon Tasarrufu (Back/Stacked layer)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Local schedules state
  const [localList, setLocalList] = useState<ScheduleItem[]>(schedules);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Consumption calculations
  const m3Gas = estimateGasConsumption(dailyRunMinutes, Math.max(30, flameLevelPercent));
  const estimatedCostTL = calculateEstimatedCost(m3Gas, 8.5);
  const unmodulatedCost = calculateEstimatedCost(m3Gas * 1.28, 8.5);
  const savedTL = Math.max(0, Math.round((unmodulatedCost - estimatedCostTL) * 10) / 10);
  const hours = Math.floor(dailyRunMinutes / 60);
  const minutes = dailyRunMinutes % 60;

  // Touch swipe gesture handling (Yukarı kaydır -> Tüketim, Aşağı kaydır -> Zamanlama)
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    // Swipe UP (parmak yukarı kaydı) -> 2. pencereye geç (Tüketim)
    if (deltaY < -28 && activeLayer === 0) {
      setActiveLayer(1);
    }
    // Swipe DOWN (parmak aşağı kaydı) -> 1. pencereye dön (Zamanlama)
    else if (deltaY > 28 && activeLayer === 1) {
      setActiveLayer(0);
    }

    touchStartY.current = null;
  };

  // Mouse wheel handling
  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 400) return;

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

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none"
    >
      {/* ── TOP LAYER SWITCHER PILLS ── */}
      <div className="shrink-0 flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveLayer(0)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayer === 0
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⏰</span>
            <span>Akıllı Zamanlama</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer(1)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayer === 1
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💰</span>
            <span>Günlük Tüketim & Tasarruf</span>
          </button>
        </div>

        {/* Swipe Hint */}
        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1">
          {activeLayer === 0 ? (
            <button
              type="button"
              onClick={() => setActiveLayer(1)}
              className="flex items-center gap-0.5 hover:text-orange-500 transition-colors cursor-pointer"
            >
              <span>Yukarı Kaydır</span>
              <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveLayer(0)}
              className="flex items-center gap-0.5 hover:text-blue-500 transition-colors cursor-pointer"
            >
              <span>Aşağı Kaydır</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          )}
        </div>
      </div>

      {/* ── STACKED 3D FLOAT & BLUR CONTAINER (Çerçeve içinde scrollbar yok) ── */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* ── PENCERE 1: AKILLI ZAMANLAMA & HAFTALIK PROGRAM (Öndeki Pencere) ── */}
        <div
          style={{
            transform:
              activeLayer === 0
                ? 'translateY(0px) scale(1)'
                : 'translateY(-55px) scale(0.92)',
            opacity: activeLayer === 0 ? 1 : 0,
            filter: activeLayer === 0 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 0 ? 'auto' : 'none',
            zIndex: activeLayer === 0 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className="absolute inset-0 w-full h-full flex flex-col justify-between bg-white/90 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Akıllı Zamanlama & Haftalık Program
              </h3>
            </div>
            {isEncrypted && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                AES-GCM Şifreli
              </span>
            )}
          </div>

          {/* 4 Compact Schedule Items (Gece, Sabah, Dışarıda, Akşam) */}
          <div className="flex-1 flex flex-col justify-around gap-1 sm:gap-1.5 my-auto overflow-hidden">
            {localList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                  item.enabled
                    ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/50 dark:bg-slate-800/25 border-slate-200/60 dark:border-slate-800 opacity-60'
                }`}
              >
                {/* Switch & Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-label={`${item.name} zamanlamasını ${item.enabled ? 'kapat' : 'aç'}`}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 cursor-pointer ${
                      item.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                        item.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>

                {/* Controls: Time & Temp */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Time Input */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateTime(item.id, e.target.value)}
                      aria-label={`${item.name} saati`}
                      className="bg-transparent text-slate-800 dark:text-white text-xs font-mono font-bold focus:outline-none w-[60px]"
                    />
                  </div>

                  {/* Target Temp Input */}
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    <input
                      type="number"
                      min="10"
                      max="32"
                      step="0.5"
                      value={item.targetTemp}
                      onChange={(e) => updateTemp(item.id, parseFloat(e.target.value) || 20)}
                      aria-label={`${item.name} hedef sıcaklığı`}
                      className="w-10 bg-transparent text-slate-800 dark:text-white text-xs font-mono font-bold text-center focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-slate-400">°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Save Button & Swipe Trigger */}
          <div className="shrink-0 pt-2 flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Program Yerel Olarak Şifrelendi & Kaydedildi!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Programı Şifreli Kaydet</span>
                </>
              )}
            </button>

            {/* Bottom floating prompt */}
            <button
              type="button"
              onClick={() => setActiveLayer(1)}
              className="text-[10px] text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>▲ Günlük Tüketim & Tasarruf Analizi İçin Yukarı Kaydırın ▲</span>
            </button>
          </div>
        </div>

        {/* ── PENCERE 2: GÜNLÜK TÜKETİM & AKILLI MODÜLASYON TASARRUFU (Alttaki/İkinci Pencere) ── */}
        <div
          style={{
            transform:
              activeLayer === 1
                ? 'translateY(0px) scale(1)'
                : 'translateY(55px) scale(0.92)',
            opacity: activeLayer === 1 ? 1 : 0,
            filter: activeLayer === 1 ? 'blur(0px)' : 'blur(14px)',
            pointerEvents: activeLayer === 1 ? 'auto' : 'none',
            zIndex: activeLayer === 1 ? 20 : 10,
            transition:
              'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
          }}
          className="absolute inset-0 w-full h-full flex flex-col justify-between bg-white/90 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Günlük Tüketim & Tasarruf Hesabı
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles className="w-3 h-3" />
              A++ Verimlilik
            </span>
          </div>

          {/* 3 Metric Cards Grid (Süresi, Gaz, Tutar) */}
          <div className="grid grid-cols-3 gap-2 my-auto shrink-0">
            {/* Runtime */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>Çalışma</span>
              </div>
              <div className="text-sm sm:text-base font-black text-slate-800 dark:text-white font-mono">
                {hours > 0 ? `${hours}s ${minutes}d` : `${minutes} dk`}
              </div>
              <div className="text-[9px] text-slate-400 truncate">Bugün yanma</div>
            </div>

            {/* Gas M3 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>Tahmini Gaz</span>
              </div>
              <div className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 font-mono">
                ~{m3Gas.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">m³</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate">24 kW brülör</div>
            </div>

            {/* Cost TL */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                <Coins className="w-3 h-3 text-emerald-500" />
                <span>Tahmini Tutar</span>
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ~{estimatedCostTL.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">TL</span>
              </div>
              <div className="text-[9px] text-emerald-500 font-semibold truncate flex items-center justify-center gap-0.5">
                <ArrowDownRight className="w-2.5 h-2.5" />
                ~{savedTL} TL tasarruf
              </div>
            </div>
          </div>

          {/* Akıllı Modülasyon Tasarrufu Callout */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 shrink-0">
            <Zap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold block text-[11px] mb-0.5 text-emerald-700 dark:text-emerald-300">
                Akıllı Alev Modülasyonu Tasarrufu:
              </span>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Kombi oda sıcaklığına yaklaştıkça modülasyonu kısarak gaz harcamasını %20 - %28 oranında azaltır. Şu anki alev gücü: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">%{flameLevelPercent}</span>.
              </p>
            </div>
          </div>

          {/* Footer Back Prompt */}
          <div className="shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              type="button"
              onClick={() => setActiveLayer(0)}
              className="text-[10px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>▼ Akıllı Zamanlama Programına Geri Dön (Aşağı Kaydırın) ▼</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
