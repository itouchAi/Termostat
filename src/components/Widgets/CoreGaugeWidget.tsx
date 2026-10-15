import React from 'react';
import { calculateComfortIndex } from '../../utils/thermostatRules.ts';

interface CoreGaugeWidgetProps {
  currentTemp: number;
  humidity: number;
  targetTemp: number;
  isKombiActive: boolean;
}

export const CoreGaugeWidget: React.FC<CoreGaugeWidgetProps> = ({
  currentTemp,
  humidity,
  targetTemp,
  isKombiActive,
}) => {
  const comfort = calculateComfortIndex(currentTemp, humidity);
  const tempDiff = currentTemp - targetTemp;

  // SVG Gauge calculations (semi-circle arc)
  const calcArc = (val: number, min: number, max: number) => {
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
    const totalLength = 188.5; // arc length for r=60, 180 deg
    return totalLength * (1 - ratio);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ortam Sensörleri
          </h3>
        </div>
        <div
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
          style={{
            borderColor: `${comfort.color}40`,
            backgroundColor: `${comfort.color}15`,
            color: comfort.color,
          }}
        >
          {comfort.label} ({comfort.score}/100)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Temperature Gauge */}
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Oda Sıcaklığı
          </span>
          <div className="relative w-32 h-20 flex items-center justify-center">
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
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {currentTemp.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 ml-0.5">°C</span>
            </div>
          </div>
          <div className="flex justify-between w-full text-[10px] text-slate-400 mt-2 px-1">
            <span>10°</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {tempDiff > 0 ? `+${tempDiff.toFixed(1)}°` : `${tempDiff.toFixed(1)}°`} hedef
            </span>
            <span>35°</span>
          </div>
        </div>

        {/* Humidity Gauge */}
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Bağıl Nem
          </span>
          <div className="relative w-32 h-20 flex items-center justify-center">
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
                stroke="#0284c7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={calcArc(humidity, 0, 100)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute bottom-0 text-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {humidity.toFixed(0)}
              </span>
              <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
            </div>
          </div>
          <div className="flex justify-between w-full text-[10px] text-slate-400 mt-2 px-1">
            <span>%0</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {humidity >= 40 && humidity <= 60 ? 'Optimal' : 'Nem Düzeyi'}
            </span>
            <span>%100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
