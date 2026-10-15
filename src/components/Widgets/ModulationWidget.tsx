import React from 'react';
import { Flame, Gauge, Activity, ShieldCheck } from 'lucide-react';

interface ModulationWidgetProps {
  isKombiActive: boolean;
  flameLevelPercent: number;
  waterPressureBar: number;
  pumpRpm: number;
  onToggleManualRelay?: () => void;
}

export const ModulationWidget: React.FC<ModulationWidgetProps> = ({
  isKombiActive,
  flameLevelPercent,
  waterPressureBar,
  pumpRpm,
}) => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kombi Röle & Modülasyon Telemetrisi
          </h3>
        </div>
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            isKombiActive
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isKombiActive ? 'animate-bounce text-amber-500' : 'text-slate-400'}`} />
          {isKombiActive ? 'Aktif — Isıtıyor' : 'Beklemede (Standby)'}
        </div>
      </div>

      {/* Flame Modulation Progress Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            Brülör Alev Modülasyonu
          </span>
          <span className="font-mono font-bold text-sm text-orange-600 dark:text-orange-400">
            %{flameLevelPercent}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${flameLevelPercent}%`,
              background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>%0 (Kapalı)</span>
          <span>%50 (Orta Güç)</span>
          <span>%100 (Maks)</span>
        </div>
      </div>

      {/* Grid of Sub-parameters: Pressure, Pump RPM, Circuit */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Gauge className="w-3.5 h-3.5 text-blue-500" />
            Su Basıncı
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
            {waterPressureBar.toFixed(1)} <span className="text-xs font-normal text-slate-400">bar</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-500">Normal</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Sirkülasyon
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
            {isKombiActive ? pumpRpm : 0} <span className="text-xs font-normal text-slate-400">RPM</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            {isKombiActive ? 'Kademe II' : 'Durgun'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Güvenlik
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-white">
            OK
          </div>
          <span className="text-[10px] font-semibold text-emerald-500">Kusursuz</span>
        </div>
      </div>
    </div>
  );
};
