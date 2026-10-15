import React from 'react';
import { Layers, Eye, Gauge, Zap, Sparkles, Sliders, Box, Info } from 'lucide-react';
import type { MorphMode } from '../../types.ts';

interface ThreeControlsWidgetProps {
  explodedOffset: number;
  onSetExplodedOffset: (val: number) => void;
  morphMode: MorphMode;
  onSetMorphMode: (mode: MorphMode) => void;
  activeCameraPreset: 'hero' | 'exploded' | 'face' | 'side';
  onSetCameraPreset: (preset: 'hero' | 'exploded' | 'face' | 'side') => void;
  performanceMode: boolean;
  onTogglePerformanceMode: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  selectedComponent: { name: string; description: string } | null;
  onClearSelectedComponent: () => void;
}

export const ThreeControlsWidget: React.FC<ThreeControlsWidgetProps> = ({
  explodedOffset,
  onSetExplodedOffset,
  morphMode,
  onSetMorphMode,
  activeCameraPreset,
  onSetCameraPreset,
  performanceMode,
  onTogglePerformanceMode,
  reducedMotion,
  onToggleReducedMotion,
  selectedComponent,
  onClearSelectedComponent,
}) => {
  const morphModes: Array<{ id: MorphMode; label: string; desc: string }> = [
    { id: 'heat', label: '🔥 Alev Isıtma', desc: 'Isı dalgaları & alev nabzı' },
    { id: 'eco', label: '🌿 Eko Halka', desc: 'Yeşil ahenkli enerji alanı' },
    { id: 'boost', label: '⚡ Plazma Boost', desc: 'Maksimum osilasyon & parıltı' },
    { id: 'night', label: '🌙 Gece Kristal', desc: 'Sakin indigo yavaş solunum' },
    { id: 'standby', label: '❄️ Standby', desc: 'Buz mavisi kristal dinginliği' },
  ];

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Unreal 3D Çekirdek & Morphing Stüdyosu
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Performance Mode Switch */}
          <button
            type="button"
            onClick={onTogglePerformanceMode}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              performanceMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Düşük donanımlı cihazlar için gölge ve partikülleri kapatıp yüksek kare hızı sağlar"
          >
            <Zap className="w-3.5 h-3.5" />
            {performanceMode ? '⚡ Performans Modu (Açık)' : '🚀 Ultra PBR Modu'}
          </button>
        </div>
      </div>

      {/* Selected Component Inspection Banner if any */}
      {selectedComponent && (
        <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-900 dark:text-cyan-200">
                {selectedComponent.name}
              </span>
              <p className="text-cyan-700 dark:text-cyan-300 text-[11px] mt-0.5">
                {selectedComponent.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSelectedComponent}
            className="text-cyan-500 hover:text-cyan-700 font-bold text-xs"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Exploded View Slider */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-500" />
            Patlatılmış Görünüm (Exploded Assembly View)
          </span>
          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
            %{Math.round(explodedOffset * 100)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explodedOffset}
          onChange={(e) => onSetExplodedOffset(parseFloat(e.target.value))}
          aria-label="Patlatılmış montaj görünüm sürgüsü"
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-cyan-600 focus:outline-none"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>Montajlı (Kompakt)</span>
          <span>Yarı Açık</span>
          <span>Tam Patlatılmış İnceleme</span>
        </div>
      </div>

      {/* Morph Mode Selector */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          Kuantum Çekirdek 3D Morph Modu:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {morphModes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSetMorphMode(m.id)}
              className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                morphMode === m.id
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Presets & Animation Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Kamera Açısı:</span>
          {(['hero', 'face', 'exploded', 'side'] as const).map((cam) => (
            <button
              key={cam}
              type="button"
              onClick={() => onSetCameraPreset(cam)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeCameraPreset === cam
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cam === 'hero' ? 'İzometrik' : cam === 'face' ? 'Ön Kadran' : cam === 'exploded' ? 'Patlatılmış' : 'Yan Profil'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleReducedMotion}
          className={`text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
            reducedMotion
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          {reducedMotion ? 'Animasyonlar Kapalı' : 'Animasyonlar Akıcı'}
        </button>
      </div>
    </div>
  );
};
