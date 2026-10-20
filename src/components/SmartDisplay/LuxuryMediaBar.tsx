import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Tv,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface LuxuryMediaBarProps {
  mediaType: 'audio' | 'video' | 'image';
  title: string;
  subtitle?: string;
  counterText?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const LuxuryMediaBar: React.FC<LuxuryMediaBarProps> = ({
  mediaType,
  title,
  subtitle,
  counterText,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  isMuted,
  onToggleMute,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCollapseTimerRef = useRef<any>(null);

  // Auto-collapse after 7s of no interaction if expanded
  const scheduleAutoCollapse = () => {
    if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    autoCollapseTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 7000);
  };

  useEffect(() => {
    if (isExpanded) {
      scheduleAutoCollapse();
    }
    return () => {
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
    };
  }, [isExpanded]);

  const MediaIcon =
    mediaType === 'audio' ? Music : mediaType === 'video' ? Tv : ImageIcon;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        scheduleAutoCollapse();
      }}
      className="pointer-events-auto select-none transition-all duration-300 ease-out"
    >
      {!isExpanded ? (
        /* ── COMPACT LUXURY PILL BAR (Dokununca genişleyen küçük lüks bar) ── */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-2xl border border-white/20 hover:border-amber-400/40 text-white shadow-2xl transition-all cursor-pointer active:scale-95"
          title="Medya çubuğunu genişlet"
        >
          {/* Glowing pulse indicator */}
          <div className="relative flex items-center justify-center">
            <span
              className={`absolute w-3 h-3 rounded-full opacity-60 ${
                isPlaying ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white">
              <MediaIcon className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="text-[11px] font-bold text-white tracking-wide truncate max-w-[120px] sm:max-w-[160px] flex items-center gap-1.5">
              <span>{title || 'Kombi Medya'}</span>
            </div>
            {counterText && (
              <span className="text-[9px] font-mono text-amber-300/90 leading-none">
                {counterText}
              </span>
            )}
          </div>

          {/* Quick Play/Pause on compact pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white transition-all ml-1"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-white" />
            ) : (
              <Play className="w-3 h-3 fill-white ml-0.5" />
            )}
          </button>

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
        </button>
      ) : (
        /* ── EXPANDED LUXURY MEDIA BAR (Genişlemiş Lüks Kontrol Barı) ── */
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] text-white animate-in zoom-in-95 duration-200">
          {/* Media Info Badge */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/15">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/30">
              <MediaIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left max-w-[110px] sm:max-w-[160px]">
              <span className="text-[11px] font-bold text-white tracking-tight truncate">
                {title || 'Oynatılıyor'}
              </span>
              <span className="text-[9px] font-mono text-amber-300">
                {counterText || subtitle || (isPlaying ? 'Oynatılıyor' : 'Duraklatıldı')}
              </span>
            </div>
          </div>

          {/* Controls: Previous | Play/Pause | Next */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevious}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
              title="Önceki (Geri)"
            >
              <SkipBack className="w-4 h-4 fill-white/80" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 active:scale-90 text-white shadow-lg shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center"
              title={isPlaying ? 'Durdur' : 'Oynat'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
              title="Sonraki (İleri)"
            >
              <SkipForward className="w-4 h-4 fill-white/80" />
            </button>
          </div>

          {/* Optional Mute Toggle if audio */}
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          )}

          {/* Minimize / Collapse Bar */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
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
