import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface ThermostatTouchDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemp: number;
  targetTemp: number;
  isKombiActive: boolean;
  onSetTargetTemp: (temp: number) => void;
  themeMode?: ThemeMode;
}

export const ThermostatTouchDialModal: React.FC<ThermostatTouchDialModalProps> = ({
  isOpen,
  onClose,
  currentTemp,
  targetTemp,
  isKombiActive,
  onSetTargetTemp,
  themeMode = 'glass',
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

  // Trigger cinematic close with blur-out animation
  const handleTriggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onCloseRef.current();
    }, 450); // Matches animation duration
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
    }
  }, [isOpen, resetInactivityTimer]);

  const handleStep = (step: number) => {
    resetInactivityTimer();
    const updated = Math.round((targetTemp + step) * 2) / 2;
    if (updated >= 10 && updated <= 32) {
      onSetTargetTemp(updated);
    }
  };

  const handleSetPreset = (temp: number) => {
    resetInactivityTimer();
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
      onSetTargetTemp(rounded);
    }
  };

  if (!isOpen) return null;

  const tempDiff = +(targetTemp - currentTemp).toFixed(1);
  const knobPos = polarToCartesian(150, 150, 115, currentAngle);

  // Theme-specific styling classes
  const isLight = themeMode === 'light';
  const isGlass = themeMode === 'glass';

  // Backdrop animation: Smoothly transitions into deep frosted blur and back to transparent on exit
  const backdropClasses = `fixed inset-0 z-50 flex items-center justify-center p-4 select-none cursor-default transition-all duration-450 ${
    isAnimatingIn && !isClosing
      ? 'bg-black/70 backdrop-blur-2xl opacity-100'
      : 'bg-black/0 backdrop-blur-none opacity-0'
  }`;

  // Card theme styling
  const cardThemeClasses = isLight
    ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.35)]'
    : isGlass
    ? 'bg-slate-900/40 text-white border-white/25 shadow-[0_8px_32px_0_rgba(255,255,255,0.15)] backdrop-blur-3xl'
    : 'bg-slate-950/95 text-white border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]';

  // Card animation: "blurdan netleserek gelecek, kapanırkende blur olarak yok olacak"
  const cardAnimationClasses = `relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl border transition-all duration-450 ${cardThemeClasses} ${
    isAnimatingIn && !isClosing
      ? 'opacity-100 scale-100 blur-none'
      : 'opacity-0 scale-90 blur-xl'
  }`;

  const trackStroke = isLight ? 'rgba(0, 0, 0, 0.12)' : isGlass ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)';

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
        }}
        onClick={(e) => {
          e.stopPropagation();
          resetInactivityTimer();
        }}
      >
        {/* Top Header: Title & Close Button */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Termostat Tekerleği
                </h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isLight ? 'bg-slate-200 text-slate-700' : isGlass ? 'bg-white/15 text-white/90' : 'bg-slate-800 text-slate-300'
                }`}>
                  {isGlass ? 'Cam Tema' : isLight ? 'Aydınlık' : 'Karanlık'}
                </span>
              </div>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Dokunmatik hassas sıcaklık ayarı
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700'
                : 'bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white'
            }`}
            title="Kapat ve Ambiyansa Dön"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Second Inactivity Countdown Pill ("5 sn sonra kapanır") */}
        <div className={`w-full my-2 flex items-center justify-between px-3 py-1.5 rounded-full border text-[10px] font-mono ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-slate-300'
        }`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Dokunulmazsa ambiyansa döner</span>
          </span>
          <span className="font-bold text-amber-500 dark:text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full">
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
              <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc Track */}
            <path
              d={describeArc(150, 150, 115, START_ANGLE, START_ANGLE + SWEEP_ANGLE)}
              fill="none"
              stroke={trackStroke}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Active Temperature Colored Fill Arc */}
            <path
              d={describeArc(150, 150, 115, START_ANGLE, currentAngle)}
              fill="none"
              stroke="url(#wheelGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Indicator Thumb / Knob on Arc */}
            <circle
              cx={knobPos.x}
              cy={knobPos.y}
              r="13"
              fill="#ffffff"
              stroke="#f59e0b"
              strokeWidth="4"
              className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] cursor-grab active:cursor-grabbing"
            />
          </svg>

          {/* Central Target Temp Readout & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hedef Sıcaklık
            </span>
            <div className={`flex items-baseline font-mono font-black text-4xl sm:text-5xl tracking-tight drop-shadow-md ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>{targetTemp.toFixed(1)}</span>
              <span className="text-xl sm:text-2xl text-amber-500 ml-0.5">°C</span>
            </div>

            {/* Kombi / Heating Status Badge */}
            <div
              className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                isKombiActive
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>{isKombiActive ? 'Kombi Isıtıyor' : 'Beklemede'}</span>
            </div>

            <div className={`mt-1 text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Oda:{' '}
              <span className="font-bold text-emerald-500">{currentTemp}°C</span>
              {tempDiff !== 0 && (
                <span className={`ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
            className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center transition-all border shadow-md active:scale-90 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
            }`}
            title="0.5°C Azalt"
          >
            <Minus className="w-5 h-5 text-sky-500" />
          </button>

          <div className={`flex flex-col items-center px-4 py-1.5 rounded-2xl border ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-white/5 border-white/10 text-slate-200'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hassas Adım
            </span>
            <span className="text-xs font-mono font-bold">
              0.5°C
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            className="w-12 h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-90 text-white font-black flex items-center justify-center transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
            title="0.5°C Artır"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── QUICK PRESET BUTTONS (Gece, Eko, Konfor, Boost) ── */}
        <div className={`w-full grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          {[
            { label: 'Gece', temp: 18.5, icon: Moon, color: 'text-indigo-500' },
            { label: 'Eko', temp: 20.0, icon: Leaf, color: 'text-emerald-500' },
            { label: 'Konfor', temp: 22.5, icon: Flame, color: 'text-amber-500' },
            { label: 'Boost', temp: 25.0, icon: Zap, color: 'text-rose-500' },
          ].map((preset) => {
            const Icon = preset.icon;
            const isSelected = targetTemp === preset.temp;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSetPreset(preset.temp)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-md'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${preset.color} mb-0.5`} />
                <span className="text-[10px]">{preset.label}</span>
                <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
          className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sinematik Ambiyans Moduna Dön</span>
        </button>
      </div>
    </div>
  );
};
