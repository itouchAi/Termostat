import React from 'react';
import { Flame, Coins, Clock, ArrowDownRight, Sparkles } from 'lucide-react';
import { estimateGasConsumption, calculateEstimatedCost } from '../../utils/thermostatRules.ts';

interface ConsumptionWidgetProps {
  dailyRunMinutes: number;
  flameLevelPercent: number;
}

export const ConsumptionWidget: React.FC<ConsumptionWidgetProps> = ({
  dailyRunMinutes,
  flameLevelPercent,
}) => {
  const m3Gas = estimateGasConsumption(dailyRunMinutes, Math.max(30, flameLevelPercent));
  const estimatedCostTL = calculateEstimatedCost(m3Gas, 8.5);
  // Compare to conventional on/off non-modulating thermostat that burns ~30% more
  const unmodulatedCost = calculateEstimatedCost(m3Gas * 1.28, 8.5);
  const savedTL = Math.max(0, Math.round((unmodulatedCost - estimatedCostTL) * 10) / 10);

  const hours = Math.floor(dailyRunMinutes / 60);
  const minutes = dailyRunMinutes % 60;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Günlük Tüketim & Tasarruf Hesabı
          </h3>
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          A++ Verimlilik
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Runtime */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Çalışma Süresi
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">
            {hours > 0 ? `${hours}s ${minutes}d` : `${minutes} dk`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bugün toplam yanma</div>
        </div>

        {/* Gas M3 */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Tahmini Gaz
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">
            ~{m3Gas.toFixed(2)} <span className="text-xs text-slate-400 font-normal">m³</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">24 kW brülör hesabı</div>
        </div>

        {/* Cost TL */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
            Tahmini Tutar
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ~{estimatedCostTL.toFixed(1)} <span className="text-xs text-slate-400 font-normal">TL</span>
          </div>
          <div className="text-[11px] text-emerald-500 flex items-center gap-0.5 mt-1 font-semibold">
            <ArrowDownRight className="w-3 h-3" />
            {savedTL > 0 ? `~${savedTL} TL tasarruf` : 'Optimum harcama'}
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Akıllı Modülasyon Tasarrufu:</span> Kombi oda sıcaklığına yaklaştıkça alev boyunu otomatik kısarak gaz harcamasını %20 ila %28 oranında azaltır ve radyatörlerde su vuruntusunu önler.
        </div>
      </div>
    </div>
  );
};
