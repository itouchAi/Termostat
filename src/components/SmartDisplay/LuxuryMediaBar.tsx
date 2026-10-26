import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Tv,
  Music,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
} from 'lucide-react';

interface LuxuryMediaBarProps {
  mediaType: 'audio' | 'video' | 'image';
  title?: string;
  counterText?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  isLoop?: boolean;
  onToggleLoop?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export const LuxuryMediaBar: React.FC<LuxuryMediaBarProps> = ({
  mediaType,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  isMuted = false,
  onToggleMute,
  volume = 0.8,
  onVolumeChange,
  isLoop = true,
  onToggleLoop,
  isExpanded: isExpandedProp,
  onToggleExpand,
}) => {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : uncontrolledExpanded;
  const setIsExpanded = (val: boolean) => {
    if (onToggleExpand) onToggleExpand(val);
    setUncontrolledExpanded(val);
  };
  const [isVolumeSliderOpen, setIsVolumeSliderOpen] = useState(false);
  const autoCollapseTimerRef = useRef<any>(null);
  const volumeSliderRef = useRef<HTMLDivElement | null>(null);

  // Auto-collapse after 8s of no interaction if expanded
  const scheduleAutoCollapse = () => {
    if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    autoCollapseTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      setIsVolumeSliderOpen(false);
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

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        volumeSliderRef.current &&
        !volumeSliderRef.current.contains(e.target as Node)
      ) {
        setIsVolumeSliderOpen(false);
      }
    };
    if (isVolumeSliderOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVolumeSliderOpen]);

  // User explicitly requested: Television visual icon, play button, volume icon, no video name
  const MediaIcon = mediaType === 'video' ? Tv : mediaType === 'audio' ? Music : ImageIcon;

  return (
    <div
      ref={volumeSliderRef}
      onClick={(e) => {
        e.stopPropagation();
        scheduleAutoCollapse();
      }}
      className="relative pointer-events-auto select-none transition-all duration-300 ease-out"
    >
      {/* ── VERTICAL VOLUME POPUP SLIDER (Yukarı Açılan Ses Barı) ── */}
      {isVolumeSliderOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.25)] flex flex-col items-center gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200 z-50 text-white min-w-[56px]"
        >
          <span className="text-[10px] font-mono font-bold text-amber-300">
            %{Math.round((isMuted ? 0 : volume) * 100)}
          </span>

          {/* Upward Vertical Slider */}
          <div className="h-28 flex items-center justify-center relative w-6">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                scheduleAutoCollapse();
                const newVol = parseFloat(e.target.value);
                onVolumeChange?.(newVol);
                if (isMuted && onToggleMute) {
                  onToggleMute();
                }
              }}
              className="accent-amber-400 cursor-pointer -rotate-90 origin-center h-1.5 w-24 bg-white/20 rounded-lg"
            />
          </div>

          {/* Quick Mute/Unmute in Slider */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scheduleAutoCollapse();
              onToggleMute?.();
            }}
            className="p-1 rounded-lg hover:bg-white/10 active:scale-90 transition-all text-slate-300 hover:text-white"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      )}

      {!isExpanded ? (
        /* ── MINIMIZED COMPACT MEDIA PILL (Televizyon simgesi, Play/Pause butonu, Ses simgesi - Video ismi yazmaz) ── */
        <div
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-2xl border border-white/20 hover:border-amber-400/40 text-white shadow-2xl transition-all cursor-pointer active:scale-95"
          title="Medya kontrollerini açmak için tıklayın"
        >
          {/* Television Icon with gentle pulse */}
          <div className="relative flex items-center justify-center">
            <span
              className={`absolute w-3.5 h-3.5 rounded-full opacity-60 ${
                isPlaying ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <MediaIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Quick Play/Pause Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 flex items-center justify-center text-white transition-all shadow-sm cursor-pointer"
            title={isPlaying ? 'Durdur' : 'Oynat'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>

          {/* Volume Button: Opens vertical volume slider upward */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVolumeSliderOpen((prev) => !prev);
            }}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
            title="Ses ayarı (Yukarı açılır ses barı)"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            )}
          </button>

          {/* Expand indicator chevron */}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </div>
      ) : (
        /* ── EXPANDED LUXURY MEDIA BAR (Previous, Play/Pause, Next, Loop, Upward Volume, Collapse) ── */
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] text-white animate-in zoom-in-95 duration-200">
          {/* Television Icon Badge (No video title text as requested) */}
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/30">
            <MediaIcon className="w-3.5 h-3.5" />
          </div>

          <div className="w-px h-5 bg-white/20" />

          {/* Media Navigation Controls: Previous | Play/Pause | Next */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scheduleAutoCollapse();
                onPrevious();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
              title="Önceki"
            >
              <SkipBack className="w-3.5 h-3.5 fill-white/80" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scheduleAutoCollapse();
                onTogglePlay();
              }}
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 active:scale-90 text-white shadow-lg shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center"
              title={isPlaying ? 'Durdur' : 'Oynat'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scheduleAutoCollapse();
                onNext();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
              title="Sonraki"
            >
              <SkipForward className="w-3.5 h-3.5 fill-white/80" />
            </button>
          </div>

          <div className="w-px h-5 bg-white/20" />

          {/* Loop / Repeat Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scheduleAutoCollapse();
              onToggleLoop?.();
            }}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isLoop
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-xs'
                : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
            }`}
            title={isLoop ? 'Döngü Açık (Sürekli Tekrarla)' : 'Döngü Kapalı'}
          >
            {isLoop ? (
              <Repeat className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Repeat className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Volume Control: Toggles upward slider */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVolumeSliderOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isVolumeSliderOpen
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
            }`}
            title="Ses Kontrolü (Yukarı Açılır)"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Collapse Bar Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
              setIsVolumeSliderOpen(false);
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
