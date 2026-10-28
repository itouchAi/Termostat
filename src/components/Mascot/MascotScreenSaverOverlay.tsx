import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Flame, Sun, Cloud, Moon, X, Clock } from 'lucide-react';
import type { MascotConfig, MascotState } from '../../types/mascot.ts';
import { TermoBotMascot } from './TermoBotMascot.tsx';
import { triggerHaptic } from '../../utils/haptics.ts';

interface MascotScreenSaverOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: MascotConfig;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
  weatherTemp?: number;
  weatherConditionText?: string;
  cityName?: string;
}

export const MascotScreenSaverOverlay: React.FC<MascotScreenSaverOverlayProps> = ({
  isOpen,
  onClose,
  config,
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
  weatherTemp = 18,
  weatherConditionText = 'Güneşli',
  cityName = 'İstanbul',
}) => {
  const [wakingUp, setWakingUp] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [clockStr, setClockStr] = useState('');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setClockStr(
        d.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setWakingUp(false);
      setCountdown(3);
      setMascotState('idle');
    }
  }, [isOpen]);

  // Handle tap / wake interaction
  const handleInteraction = () => {
    if (wakingUp) return;
    triggerHaptic('success');
    setWakingUp(true);
    setMascotState('happy');
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Keyboard dismiss (Escape or Space)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else {
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, wakingUp]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Background style renderer
  const renderBackground = () => {
    const { backgroundMode, customWallpaperUrl, isBackgroundBlurred } = config;
    const blurClass = isBackgroundBlurred ? 'backdrop-blur-xl scale-105' : '';

    if (backgroundMode === 'custom' && customWallpaperUrl) {
      return (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${blurClass}`}
          style={{
            backgroundImage: `url(${customWallpaperUrl})`,
            filter: isBackgroundBlurred ? 'blur(10px) brightness(0.6)' : 'brightness(0.65)',
          }}
        />
      );
    }

    if (backgroundMode === 'cyber_station') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-700 ${blurClass}`}>
          {/* Cyber Lab Theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#090b14] via-[#0d1224] to-[#05070e]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.25) 0%, transparent 60%), linear-gradient(rgba(56,189,248,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.1) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            }}
          />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        </div>
      );
    }

    if (backgroundMode === 'warm_hearth') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-700 ${blurClass}`}>
          {/* Warm Cozy Hearth Theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#180e0a] via-[#120804] to-[#080402]" />
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-orange-600/20 via-amber-600/10 to-transparent blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        </div>
      );
    }

    if (backgroundMode === 'midnight_purple') {
      return (
        <div className={`absolute inset-0 overflow-hidden transition-all duration-700 ${blurClass}`}>
          {/* Midnight Nebula Theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0a1a] via-[#090613] to-[#040208]" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        </div>
      );
    }

    // Default: Pure OLED Black
    return <div className="absolute inset-0 bg-black" />;
  };

  return createPortal(
    <div
      onClick={handleInteraction}
      className="fixed inset-0 z-[9999] flex flex-col justify-between items-center select-none cursor-pointer overflow-hidden animate-in fade-in duration-500"
    >
      {/* ── BACKGROUND ── */}
      {renderBackground()}

      {/* ── TOP BAR (FIXED TELEMETRY AT TOP RIGHT) ── */}
      <div className="relative z-10 w-full px-5 py-4 flex items-start justify-between">
        {/* Subtle Wake Hint or Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md border border-white/10 transition-all cursor-pointer active:scale-95"
          title="Ekran koruyucudan hemen çık"
        >
          <X className="w-3.5 h-3.5" />
          <span>Uyan / Kapat</span>
        </button>

        {/* ── FIXED TOP-RIGHT TELEMETRY PANEL ── */}
        <div className="flex flex-col items-end gap-1.5 p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl text-right">
          {/* Saat */}
          <div className="flex items-center gap-1.5 text-white font-mono font-bold text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{clockStr}</span>
          </div>

          {/* Termostat Sıcaklığı */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1">
              {isKombiActive ? (
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
              <span>{currentTemp.toFixed(1)}°C</span>
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              Hedef: {targetTemp.toFixed(1)}°C
            </span>
          </div>

          {/* Hava Durumu */}
          <div className="flex items-center gap-1.5 text-[11px] text-sky-200">
            <Sun className="w-3 h-3 text-amber-300" />
            <span className="font-semibold">{weatherTemp}°C</span>
            <span className="text-white/60">· {weatherConditionText} ({cityName})</span>
          </div>
        </div>
      </div>

      {/* ── CENTER: THE MASCOT (TERMOBOT) ── */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4">
        <TermoBotMascot
          state={mascotState}
          themeMode="tactile_deck"
          currentTemp={currentTemp}
          targetTemp={targetTemp}
          isKombiActive={isKombiActive}
          size="lg"
          interactive={true}
          onWakeScreen={handleInteraction}
        />

        {/* Interactive Tap Hint or Countdown */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {wakingUp ? (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/25 border border-amber-400/50 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>TermoBot uyandı! {countdown} sn içinde ana ekrana dönülüyor...</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/70 text-[11px] font-medium flex items-center gap-1.5 animate-pulse">
              <span>Ekrana dokunun, robotunuz sevinsin ve uyansın ✨</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM BRAND / FOOTER ── */}
      <div className="relative z-10 pb-5 text-center text-white/40 text-[10px] font-mono">
        TermoBot Akıllı Termostat Ekran Koruyucu · Dokununca 3 sn içinde kapanır
      </div>
    </div>,
    document.body
  );
};
