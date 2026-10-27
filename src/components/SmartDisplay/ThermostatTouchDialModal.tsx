import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Flame,
  Minus,
  Plus,
  Moon,
  Leaf,
  Zap,
  Sparkles,
} from 'lucide-react';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface ThermostatTouchDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClosingChange?: (isClosing: boolean) => void;
  currentTemp: number;
  targetTemp: number;
  isKombiActive: boolean;
  onSetTargetTemp: (temp: number) => void;
  themeMode?: ThemeMode;
}

export const ThermostatTouchDialModal: React.FC<ThermostatTouchDialModalProps> = ({
  isOpen,
  onClose,
  onClosingChange,
  currentTemp,
  targetTemp,
  isKombiActive,
  onSetTargetTemp,
  themeMode = 'tactile_deck',
}) => {
  // 5 seconds inactivity timeout as requested ("ayrıca 15 sn uzun 5 sn olsun")
  const INACTIVITY_TIMEOUT_SEC = 5;
  const [countdown, setCountdown] = useState(INACTIVITY_TIMEOUT_SEC);

  // Animation states: Blur-in to Sharp Focus and Blur-out to Clear
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const dialRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef(false);

  // Keep stable reference to onClose to prevent clock tick re-render cancellations
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onClosingChangeRef = useRef(onClosingChange);
  onClosingChangeRef.current = onClosingChange;

  // Trigger cinematic close with blur-out animation and simultaneous background unblur
  const handleTriggerClose = useCallback(() => {
    setIsClosing(true);
    onClosingChangeRef.current?.(true);
    setTimeout(() => {
      onCloseRef.current();
    }, 500); // Matches 0.5s CSS animation duration
  }, []);

  // Stable inactivity timer reset
  const resetInactivityTimer = useCallback(() => {
    if (isClosing) return;
    setCountdown(INACTIVITY_TIMEOUT_SEC);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    timerRef.current = setTimeout(() => {
      handleTriggerClose();
    }, INACTIVITY_TIMEOUT_SEC * 1000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isClosing, handleTriggerClose]);

  // Entrance & exit handling
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      onClosingChangeRef.current?.(false);
      setCountdown(INACTIVITY_TIMEOUT_SEC);
      // Small timeout to trigger CSS transition from blur to sharp focus
      const t = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 20);

      resetInactivityTimer();

      return () => {
        clearTimeout(t);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    } else {
      setIsAnimatingIn(false);
      setIsClosing(false);
      onClosingChangeRef.current?.(false);
    }
  }, [isOpen, resetInactivityTimer]);

  const handleStep = (step: number) => {
    resetInactivityTimer();
    triggerHaptic('selection');
    const updated = Math.round((targetTemp + step) * 2) / 2;
    if (updated >= 10 && updated <= 32) {
      onSetTargetTemp(updated);
    }
  };

  const handleSetPreset = (temp: number) => {
    resetInactivityTimer();
    triggerHaptic('medium');
    onSetTargetTemp(temp);
  };

  // Convert temperature (10-32°C) to angle (135° to 405° = 270° range)
  const MIN_TEMP = 10;
  const MAX_TEMP = 32;
  const tempRatio = Math.max(0, Math.min(1, (targetTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)));
  const START_ANGLE = 135;
  const SWEEP_ANGLE = 270;
  const currentAngle = START_ANGLE + tempRatio * SWEEP_ANGLE;

  // SVG Arc calculations
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Dial drag interaction handler
  const handleDialPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    resetInactivityTimer();
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;

    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    let mappedAngle = deg;
    if (mappedAngle < 90) mappedAngle += 360;

    if (mappedAngle >= 135 && mappedAngle <= 405) {
      const ratio = (mappedAngle - 135) / 270;
      const rawTemp = MIN_TEMP + ratio * (MAX_TEMP - MIN_TEMP);
      const rounded = Math.round(rawTemp * 2) / 2;
      if (rounded !== targetTemp) {
        triggerHaptic('light');
        onSetTargetTemp(rounded);
      }
    }
  };

  // Comprehensive theme resolver for full design harmony
  const theme = useMemo(() => {
    const isTactile = themeMode === 'tactile_deck';
    const isObsidian = themeMode === 'obsidian_lavender';
    const isGlass = themeMode === 'glass';
    const isLight = themeMode === 'light';

    if (isTactile) {
      return {
        id: 'tactile_deck',
        label: 'TACTILE DECK',
        backdrop: 'bg-black/80 backdrop-blur-md',
        cardClass:
          'bg-[#14121e] text-white border-t border-l border-white/[0.22] border-r border-black/80 border-b border-black/95 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1.5px_2px_rgba(255,255,255,0.18),0_0_40px_rgba(245,158,11,0.16)]',
        cardStyle: {
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)',
        },
        badgeClass:
          'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        headerIconClass:
          'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.25)]',
        countdownClass:
          'bg-[#191624] border-t border-l border-white/10 border-r border-b border-black/70 text-amber-300/90 font-mono',
        countdownPill:
          'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono',
        trackStroke: 'rgba(255, 200, 150, 0.12)',
        dialGradientId: 'tactileWheelGradient',
        dialGradientStops: (
          <>
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </>
        ),
        knobFill: '#ffffff',
        knobStroke: '#f59e0b',
        knobFilter: 'drop-shadow(0 0 10px rgba(245,158,11,0.95))',
        centerReadoutSub: 'text-amber-300/80 font-mono text-[9.5px]',
        centerReadoutVal: 'text-white font-mono drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]',
        centerReadoutDeg: 'text-amber-400',
        stepperMinus:
          'bg-[#1b1827] hover:bg-[#252236] active:scale-90 border-t border-l border-white/[0.20] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]',
        stepperPlus:
          'bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-90 border-t border-l border-amber-300/60 border-r border-amber-800 border-b border-amber-950 text-white shadow-[0_4px_16px_rgba(245,158,11,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.4)]',
        stepPill:
          'bg-[#181523] border-t border-l border-white/[0.12] border-r border-b border-black/80 text-amber-300',
        presetSelected:
          'bg-[#282238] border-t border-l border-amber-400/80 border-r border-amber-900 border-b border-black text-amber-300 font-bold shadow-[0_4px_14px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(255,255,255,0.2)]',
        presetNormal:
          'bg-[#181523] hover:bg-[#211d30] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-slate-300',
        returnBtn:
          'bg-[#1c192a] hover:bg-[#262238] active:scale-95 border-t border-l border-white/[0.20] border-r border-black/70 border-b border-black/90 text-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.7)]',
        closeBtn:
          'bg-[#1b1827] hover:bg-[#252236] text-amber-300/80 hover:text-amber-200 border-t border-l border-white/[0.18] border-r border-b border-black/80 active:scale-95',
      };
    }

    if (isObsidian) {
      return {
        id: 'obsidian_lavender',
        label: 'OBSIDIAN',
        backdrop: 'bg-black/80 backdrop-blur-xl',
        cardClass:
          'bg-[#0d0b17]/95 text-white border border-[#8261e6]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(130,97,230,0.35),inset_0_1.5px_2px_rgba(216,202,255,0.22)] backdrop-blur-2xl',
        cardStyle: {
          backgroundImage:
            'radial-gradient(circle at 50% 15%, rgba(130, 97, 230, 0.16) 0%, transparent 65%)',
        },
        badgeClass:
          'bg-[#8261e6]/25 text-[#d8caff] border border-[#8261e6]/50 font-bold shadow-[0_0_12px_rgba(130,97,230,0.25)]',
        headerIconClass:
          'bg-[#8261e6]/25 text-[#d8caff] border border-[#8261e6]/40 shadow-[0_0_12px_rgba(130,97,230,0.3)]',
        countdownClass:
          'bg-[#151224] border border-[#8261e6]/30 text-[#d8caff]/90 font-mono',
        countdownPill:
          'bg-[#8261e6]/30 text-[#e9d5ff] border border-[#8261e6]/50 font-mono',
        trackStroke: 'rgba(167, 134, 255, 0.18)',
        dialGradientId: 'obsidianWheelGradient',
        dialGradientStops: (
          <>
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="45%" stopColor="#a786ff" />
            <stop offset="80%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f43f5e" />
          </>
        ),
        knobFill: '#ffffff',
        knobStroke: '#a786ff',
        knobFilter: 'drop-shadow(0 0 10px rgba(167,134,255,0.95))',
        centerReadoutSub: 'text-[#d8caff]/80 uppercase tracking-widest text-[9.5px]',
        centerReadoutVal: 'text-white font-mono drop-shadow-[0_0_18px_rgba(167,134,255,0.4)]',
        centerReadoutDeg: 'text-[#a786ff]',
        stepperMinus:
          'bg-[#18142a] hover:bg-[#231d3d] active:scale-90 border border-[#8261e6]/40 text-[#d8caff] shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
        stepperPlus:
          'bg-gradient-to-r from-[#7352d4] via-[#8563e8] to-[#9979f5] hover:brightness-110 active:scale-90 border border-[#c4b5fd]/60 text-white shadow-[0_0_20px_rgba(130,97,230,0.6)]',
        stepPill:
          'bg-[#141024] border border-[#8261e6]/35 text-[#d8caff]',
        presetSelected:
          'bg-[#8261e6]/35 border-[#a786ff] text-white font-bold shadow-[0_0_15px_rgba(130,97,230,0.5)]',
        presetNormal:
          'bg-[#141024] hover:bg-[#1f1936] border border-white/10 text-slate-300',
        returnBtn:
          'bg-gradient-to-r from-[#7352d4]/30 via-[#8563e8]/30 to-[#9979f5]/30 hover:from-[#7352d4]/50 hover:to-[#9979f5]/50 border border-[#8261e6]/50 text-[#d8caff] shadow-lg active:scale-95',
        closeBtn:
          'bg-[#161227] hover:bg-[#231d3d] text-[#d8caff] border border-[#8261e6]/35 active:scale-95',
      };
    }

    if (isGlass) {
      return {
        id: 'glass',
        label: 'CANLI CAM',
        backdrop: 'bg-black/25 backdrop-blur-xs',
        cardClass:
          'bg-white/[0.12] text-white border border-white/35 shadow-[0_25px_60px_rgba(0,0,0,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.45)] backdrop-blur-2xl',
        cardStyle: {},
        badgeClass:
          'bg-white/20 text-white border border-white/25 shadow-xs',
        headerIconClass:
          'bg-white/15 text-white border border-white/25 shadow-xs',
        countdownClass:
          'bg-white/10 border border-white/20 text-white',
        countdownPill:
          'bg-white/20 text-white border border-white/30',
        trackStroke: 'rgba(255, 255, 255, 0.28)',
        dialGradientId: 'glassWheelGradient',
        dialGradientStops: (
          <>
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f43f5e" />
          </>
        ),
        knobFill: '#ffffff',
        knobStroke: '#f59e0b',
        knobFilter: 'drop-shadow(0 0 8px rgba(245,158,11,0.9))',
        centerReadoutSub: 'text-white/80 uppercase tracking-widest text-[9.5px]',
        centerReadoutVal: 'text-white font-mono drop-shadow-md',
        centerReadoutDeg: 'text-amber-400',
        stepperMinus:
          'bg-white/15 hover:bg-white/25 active:scale-90 border border-white/25 text-white backdrop-blur-md',
        stepperPlus:
          'bg-amber-500/80 hover:bg-amber-500 active:scale-90 border border-amber-300/40 text-white shadow-amber-500/30',
        stepPill:
          'bg-white/10 border border-white/20 text-white backdrop-blur-md',
        presetSelected:
          'bg-amber-500/35 border-amber-400 text-amber-200 font-bold shadow-md backdrop-blur-md',
        presetNormal:
          'bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 backdrop-blur-md',
        returnBtn:
          'bg-white/15 hover:bg-white/25 active:scale-90 border border-white/25 text-white backdrop-blur-md shadow-xs',
        closeBtn:
          'bg-white/15 hover:bg-white/25 active:scale-90 text-white border border-white/25',
      };
    }

    if (isLight) {
      return {
        id: 'light',
        label: 'AYDINLIK',
        backdrop: 'bg-slate-900/40 backdrop-blur-md',
        cardClass:
          'bg-white/95 text-slate-900 border border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.35)]',
        cardStyle: {},
        badgeClass:
          'bg-slate-200 text-slate-700 border border-slate-300',
        headerIconClass:
          'bg-amber-500/15 text-amber-600 border border-amber-500/25',
        countdownClass:
          'bg-slate-100 border border-slate-200 text-slate-700',
        countdownPill:
          'bg-amber-100 text-amber-800 border border-amber-300 font-mono',
        trackStroke: 'rgba(0, 0, 0, 0.12)',
        dialGradientId: 'lightWheelGradient',
        dialGradientStops: (
          <>
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#e11d48" />
          </>
        ),
        knobFill: '#ffffff',
        knobStroke: '#d97706',
        knobFilter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
        centerReadoutSub: 'text-slate-500 uppercase tracking-widest text-[9.5px]',
        centerReadoutVal: 'text-slate-900 font-mono',
        centerReadoutDeg: 'text-amber-600',
        stepperMinus:
          'bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-300 text-slate-800 shadow-xs',
        stepperPlus:
          'bg-amber-600 hover:bg-amber-500 active:scale-90 text-white shadow-amber-600/30',
        stepPill:
          'bg-slate-100 border border-slate-200 text-slate-800',
        presetSelected:
          'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-xs',
        presetNormal:
          'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700',
        returnBtn:
          'bg-slate-100 hover:bg-slate-200 active:scale-90 border border-slate-300 text-slate-800 shadow-xs',
        closeBtn:
          'bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700',
      };
    }

    // Default Dark Theme
    return {
      id: 'dark',
      label: 'KARANLIK',
      backdrop: 'bg-black/75 backdrop-blur-xl',
      cardClass:
        'bg-slate-950/95 text-white border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]',
      cardStyle: {},
      badgeClass:
        'bg-slate-800 text-slate-300 border border-slate-700',
      headerIconClass:
        'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      countdownClass:
        'bg-white/5 border border-white/10 text-slate-300',
      countdownPill:
        'bg-amber-400/20 text-amber-400 border border-amber-400/30 font-mono',
      trackStroke: 'rgba(255, 255, 255, 0.12)',
      dialGradientId: 'darkWheelGradient',
      dialGradientStops: (
        <>
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f43f5e" />
        </>
      ),
      knobFill: '#ffffff',
      knobStroke: '#f59e0b',
      knobFilter: 'drop-shadow(0 0 8px rgba(245,158,11,0.9))',
      centerReadoutSub: 'text-slate-400 uppercase tracking-widest text-[9.5px]',
      centerReadoutVal: 'text-white font-mono',
      centerReadoutDeg: 'text-amber-500',
      stepperMinus:
        'bg-white/10 hover:bg-white/20 active:scale-90 border border-white/15 text-white',
      stepperPlus:
        'bg-amber-600 hover:bg-amber-500 active:scale-90 text-white shadow-amber-600/30',
      stepPill:
        'bg-white/5 border border-white/10 text-slate-200',
      presetSelected:
        'bg-amber-500/30 border-amber-400 text-amber-300 font-bold shadow-md',
      presetNormal:
        'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300',
      returnBtn:
        'bg-white/10 hover:bg-white/20 active:scale-90 border border-white/15 text-slate-200 hover:text-white',
      closeBtn:
        'bg-white/10 hover:bg-white/20 active:scale-90 text-slate-300 hover:text-white',
    };
  }, [themeMode]);

  if (!isOpen) return null;

  const tempDiff = +(targetTemp - currentTemp).toFixed(1);
  const knobPos = polarToCartesian(150, 150, 115, currentAngle);

  const backdropClasses = `fixed inset-0 z-50 flex items-center justify-center p-4 select-none cursor-default transition-all duration-500 ${theme.backdrop} ${
    isAnimatingIn && !isClosing
      ? 'opacity-100 pointer-events-auto'
      : 'opacity-0 pointer-events-none'
  }`;

  const cardAnimationClasses = `relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl transition-all duration-500 ${theme.cardClass} ${
    isAnimatingIn && !isClosing
      ? 'opacity-100 scale-100 blur-none'
      : 'opacity-0 scale-90 blur-2xl'
  }`;

  return (
    <div
      className={backdropClasses}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleTriggerClose();
        }
      }}
      onMouseMove={resetInactivityTimer}
      onTouchStart={resetInactivityTimer}
    >
      {/* ── CENTERED THERMOSTAT CONTROL CARD ── */}
      <div
        className={cardAnimationClasses}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          ...theme.cardStyle,
        }}
        onClick={(e) => {
          e.stopPropagation();
          resetInactivityTimer();
        }}
      >
        {/* Top Header: Title & Close Button */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${theme.headerIconClass}`}>
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-wide">
                  Termostat Kontrolü
                </h3>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${theme.badgeClass}`}
                >
                  {theme.label}
                </span>
              </div>
              <p className="text-[10px] opacity-75">
                Hassas dokunmatik sıcaklık ayarı
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${theme.closeBtn}`}
            title="Kapat ve Ambiyansa Dön"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Second Inactivity Countdown Pill */}
        <div
          className={`w-full my-2.5 flex items-center justify-between px-3 py-1.5 rounded-full border text-[10px] ${theme.countdownClass}`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Dokunulmazsa otomatik ambiyansa döner</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full font-bold ${theme.countdownPill}`}>
            {countdown} sn
          </span>
        </div>

        {/* ── THE INTERACTIVE THERMOSTAT ROTARY DIAL WHEEL ── */}
        <div className="relative my-3 flex items-center justify-center">
          <svg
            ref={dialRef}
            className="w-64 h-64 sm:w-72 sm:h-72 touch-none cursor-pointer"
            viewBox="0 0 300 300"
            onPointerDown={(e) => {
              isDraggingRef.current = true;
              (e.currentTarget as any).setPointerCapture?.(e.pointerId);
              handleDialPointer(e);
            }}
            onPointerMove={(e) => {
              if (isDraggingRef.current) {
                handleDialPointer(e);
              }
            }}
            onPointerUp={(e) => {
              isDraggingRef.current = false;
              (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
            }}
          >
            <defs>
              <linearGradient id={theme.dialGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                {theme.dialGradientStops}
              </linearGradient>
              <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc Track */}
            <path
              d={describeArc(150, 150, 115, START_ANGLE, START_ANGLE + SWEEP_ANGLE)}
              fill="none"
              stroke={theme.trackStroke}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Active Temperature Colored Fill Arc */}
            <path
              d={describeArc(150, 150, 115, START_ANGLE, currentAngle)}
              fill="none"
              stroke={`url(#${theme.dialGradientId})`}
              strokeWidth="16"
              strokeLinecap="round"
              filter="url(#dialGlow)"
            />

            {/* Indicator Thumb / Knob on Arc */}
            <circle
              cx={knobPos.x}
              cy={knobPos.y}
              r="13"
              fill={theme.knobFill}
              stroke={theme.knobStroke}
              strokeWidth="4"
              style={{ filter: theme.knobFilter }}
              className="cursor-grab active:cursor-grabbing"
            />
          </svg>

          {/* Central Target Temp Readout & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className={theme.centerReadoutSub}>
              Hedef Sıcaklık
            </span>
            <div className={`flex items-baseline font-black text-4xl sm:text-5xl tracking-tight ${theme.centerReadoutVal}`}>
              <span>{targetTemp.toFixed(1)}</span>
              <span className={`text-xl sm:text-2xl ml-0.5 ${theme.centerReadoutDeg}`}>°C</span>
            </div>

            {/* Kombi / Heating Status Badge */}
            <div
              className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                isKombiActive
                  ? 'bg-amber-500/25 text-amber-400 border-amber-400/40 animate-pulse'
                  : 'bg-white/10 text-white/80 border-white/20'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>{isKombiActive ? 'Kombi Isıtıyor' : 'Beklemede'}</span>
            </div>

            <div className="mt-1 text-[10px] font-medium opacity-80">
              Oda:{' '}
              <span className="font-bold text-emerald-400">{currentTemp}°C</span>
              {tempDiff !== 0 && (
                <span className="ml-1 opacity-70">
                  ({tempDiff > 0 ? `+${tempDiff}°C` : `${tempDiff}°C`})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STEPPERS: Tactile Minus & Plus Buttons ── */}
        <div className="w-full flex items-center justify-center gap-4 my-1">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center transition-all cursor-pointer ${theme.stepperMinus}`}
            title="0.5°C Azalt"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className={`flex flex-col items-center px-4 py-1.5 rounded-2xl border ${theme.stepPill}`}>
            <span className="text-[9px] uppercase tracking-wider opacity-70">
              Hassas Adım
            </span>
            <span className="text-xs font-mono font-bold">0.5°C</span>
          </div>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center transition-all cursor-pointer ${theme.stepperPlus}`}
            title="0.5°C Artır"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── QUICK PRESET BUTTONS (Gece, Eko, Konfor, Boost) ── */}
        <div className="w-full grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/10">
          {[
            { label: 'Gece', temp: 18.5, icon: Moon, color: 'text-indigo-400' },
            { label: 'Eko', temp: 20.0, icon: Leaf, color: 'text-emerald-400' },
            { label: 'Konfor', temp: 22.5, icon: Flame, color: 'text-amber-400' },
            { label: 'Boost', temp: 25.0, icon: Zap, color: 'text-rose-400' },
          ].map((preset) => {
            const Icon = preset.icon;
            const isSelected = targetTemp === preset.temp;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSetPreset(preset.temp)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? theme.presetSelected : theme.presetNormal
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${preset.color} mb-0.5`} />
                <span className="text-[10px]">{preset.label}</span>
                <span className="text-[9px] font-mono opacity-80">
                  {preset.temp}°C
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Return Button */}
        <button
          type="button"
          onClick={handleTriggerClose}
          className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${theme.returnBtn}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sinematik Ambiyans Moduna Dön</span>
        </button>
      </div>
    </div>
  );
};
