import React from 'react';
import { Minus, Plus, Flame, Leaf, Moon, Briefcase, Zap } from 'lucide-react';

interface TargetControlWidgetProps {
  targetTemp: number;
  onSetTarget: (newTarget: number) => void;
  isKombiActive: boolean;
}

export const TargetControlWidget: React.FC<TargetControlWidgetProps> = ({
  targetTemp,
  onSetTarget,
  isKombiActive,
}) => {
  const presets = [
    { label: 'Gece', temp: 18.5, icon: Moon, desc: 'Tasarruf & rahat uyku' },
    { label: 'Eko', temp: 20.0, icon: Leaf, desc: 'Dengeli ekonomi' },
    { label: 'Konfor', temp: 22.5, icon: Flame, desc: 'İdeal oturma konforu' },
    { label: 'Dışarıda', temp: 16.0, icon: Briefcase, desc: 'Donma koruması' },
    { label: 'Boost', temp: 25.0, icon: Zap, desc: 'Hızlı ısıtma modu' },
  ];

  const handleStep = (step: number) => {
    const updated = Math.round((targetTemp + step) * 2) / 2;
    if (updated >= 10 && updated <= 32) {
      onSetTarget(updated);
    }
  };

  const sliderPercent = ((targetTemp - 10) / (32 - 10)) * 100;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hedef Sıcaklık Kontrolü
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Adım: 0.5°C
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-5">
        {/* Large Degree Readout */}
        <div className="text-center sm:text-left flex items-baseline gap-1">
          <span className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {targetTemp.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-slate-400">°C</span>
        </div>

        {/* Plus / Minus Buttons and Slider */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              type="range"
              min="10"
              max="32"
              step="0.5"
              value={targetTemp}
              onChange={(e) => onSetTarget(parseFloat(e.target.value))}
              aria-label="Hedef Sıcaklık Ayar Sürgüsü"
              className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-blue-600 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${sliderPercent}%, #cbd5e1 ${sliderPercent}%)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>10.0°C (Min)</span>
            <span>22.0°C (Önerilen)</span>
            <span>32.0°C (Maks)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm"
            aria-label="Hedef sıcaklığı 0.5 derece azalt"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleStep(0.5)}
            className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-blue-500/20"
            aria-label="Hedef sıcaklığı 0.5 derece artır"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preset Quick Mode Pills */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-2">Hızlı Akıllı Modlar:</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = Math.abs(targetTemp - p.temp) < 0.1;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onSetTarget(p.temp)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                title={p.desc}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{p.label}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {p.temp.toFixed(1)}°C
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
