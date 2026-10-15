import React, { useState } from 'react';
import { TrendingUp, BarChart3, Clock } from 'lucide-react';

interface DataPoint {
  time: string;
  temp: number;
  target: number;
  isActive: boolean;
}

interface AnalyticsChartWidgetProps {
  history: DataPoint[];
  dailyRunMinutes: number;
}

export const AnalyticsChartWidget: React.FC<AnalyticsChartWidgetProps> = ({
  history,
  dailyRunMinutes,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 24;

  const minTemp = 16;
  const maxTemp = 26;

  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingX;
    return paddingX + (index / (total - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (temp: number) => {
    const clamped = Math.max(minTemp, Math.min(maxTemp, temp));
    const ratio = (clamped - minTemp) / (maxTemp - minTemp);
    return svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
  };

  // Generate paths
  const points = history.map((pt, i) => ({
    x: getX(i, history.length),
    y: getY(pt.temp),
    targetY: getY(pt.target),
    pt,
  }));

  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
      : '';

  const targetLinePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.targetY}` : `${acc} L ${p.x} ${p.targetY}`;
  }, '');

  const avgTemp =
    history.length > 0
      ? (history.reduce((sum, h) => sum + h.temp, 0) / history.length).toFixed(1)
      : '21.5';

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            24 Saatlik Sıcaklık & Tüketim Analitiği
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-3 h-1 bg-red-500 rounded-full inline-block"></span> Oda Sıcaklığı
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-1 bg-blue-500/60 rounded-full inline-block border-dashed"></span> Hedef
          </span>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-3 text-center">
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Ortalama Sıcaklık</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{avgTemp}°C</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Toplam Yanma Süresi</span>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">
            {Math.floor(dailyRunMinutes / 60)}s {dailyRunMinutes % 60}d
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Modülasyon Tasarrufu</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">~%24</span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
        >
          {/* Horizontal Grid lines */}
          {[18, 20, 22, 24].map((t) => (
            <g key={t}>
              <line
                x1={paddingX}
                y1={getY(t)}
                x2={svgWidth - paddingX}
                y2={getY(t)}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-200 dark:text-slate-800/80"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={getY(t) + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {t}°
              </text>
            </g>
          ))}

          {/* Target Line */}
          <path
            d={targetLinePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Temperature Area Gradient */}
          <defs>
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#tempAreaGrad)" />

          {/* Temperature Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover interactive dots */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className={`transition-all duration-200 cursor-pointer ${
                  p.pt.isActive
                    ? 'fill-orange-500 stroke-white dark:stroke-slate-900 stroke-2'
                    : 'fill-red-400 stroke-white dark:stroke-slate-900 stroke-2'
                }`}
                onMouseEnter={() => setHoveredPoint(p.pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg backdrop-blur-sm pointer-events-none flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{hoveredPoint.time}</span>
            <span className="font-bold text-red-400">{hoveredPoint.temp.toFixed(1)}°C</span>
            <span className="text-slate-400">(Hedef {hoveredPoint.target.toFixed(1)}°C)</span>
            {hoveredPoint.isActive && (
              <span className="text-amber-400 text-[10px] font-bold">🔥 Yanıyor</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
