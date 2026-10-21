import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Maximize2,
  Minimize2,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface SmartDisplayControlsPillProps {
  brightnessPercent: number;
  onBrightnessChange: (brightness: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export const SmartDisplayControlsPill: React.FC<SmartDisplayControlsPillProps> = ({
  brightnessPercent,
  onBrightnessChange,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCollapseTimerRef = useRef<any>(null);

  // Auto-collapse expanded controls after 8 seconds of no interaction
  const scheduleAutoCollapse = () => {
    if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    autoCollapseTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 8000);
  };

  useEffect(() => {
    if (isExpanded) {
      scheduleAutoCollapse();
    }
    return () => {
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    };
  }, [isExpanded]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        scheduleAutoCollapse();
      }}
      className="pointer-events-auto select-none transition-all duration-300 ease-out"
    >
      {!isExpanded ? (
        /* ── MINIMIZED CONTROLS PILL (Güneş simgesi, Tam ekran simgesi, Kırmızı çarpı butonu) ── */
        <div
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-2xl border border-white/20 hover:border-amber-400/40 shadow-2xl transition-all cursor-pointer active:scale-95 text-white"
          title="Ekran parlaklığı ve kontrolleri genişletmek için tıklayın"
        >
          {/* 1. Güneş simgesi (Parlaklık ayarını genişletir) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="w-7 h-7 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/30 flex items-center justify-center text-amber-300 transition-all cursor-pointer"
            title="Ekran ışığını ayarla (Genişlet)"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          {/* 2. Tam ekran simgesi (Kiosk toggle) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap (Kiosk)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 3. Kırmızı arka planlı beyaz çarpı kapatma butonu */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 flex items-center justify-center text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            title="Ambiyans modunu kapat ve çık"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Expand Chevron */}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </div>
      ) : (
        /* ── EXPANDED CONTROLS BAR (Tıklandığında tüm kontroller ve slider açılır) ── */
        <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-2xl px-3.5 py-1.5 rounded-2xl border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] text-white animate-in zoom-in-95 duration-200">
          {/* Interactive Brightness Range Slider */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-white/10 rounded-xl border border-white/15"
            title={`Ekran Aydınlığı: %${brightnessPercent}`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={brightnessPercent}
              onChange={(e) => {
                e.stopPropagation();
                scheduleAutoCollapse();
                onBrightnessChange(Number(e.target.value));
              }}
              className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1 rounded-lg"
            />
            <span className="font-mono text-[10px] w-7 text-right text-amber-300 font-bold">
              %{brightnessPercent}
            </span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scheduleAutoCollapse();
              onToggleFullscreen();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap (Kiosk)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Red Exit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/30"
            title="Ambiyans modunu kapat ve termostata dön"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Çıkış</span>
          </button>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Küçült"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
