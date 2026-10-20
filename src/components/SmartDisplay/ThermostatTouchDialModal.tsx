import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Flame,
  Minus,
  Plus,
  Moon,
  Leaf,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ThermostatTouchDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemp: number;
  targetTemp: number;
  isKombiActive: boolean;
  onSetTargetTemp: (temp: number) => void;
}

export const ThermostatTouchDialModal: React.FC<ThermostatTouchDialModalProps> = ({
  isOpen,
  onClose,
  currentTemp,
  targetTemp,
  isKombiActive,
  onSetTargetTemp,
}) => {
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const dialRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef(false);

  // 15-second inactivity reset handler
  const resetInactivityTimer = useCallback(() => {
    setCountdown(15);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    timerRef.current = setTimeout(() => {
      onClose();
    }, 15000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
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

    // Angle in degrees from top (0 to 360)
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    // Map 135° -> 405° (which is 45°)
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

  const isHeating = targetTemp > currentTemp;
  const tempDiff = +(targetTemp - currentTemp).toFixed(1);

  // Knob indicator position
  const knobPos = polarToCartesian(150, 150, 115, currentAngle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 select-none cursor-default"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Centered Thermostat Control Card */}
      <div
        className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-white flex flex-col items-center animate-in zoom-in-95 duration-300"
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
              <h3 className="text-sm sm:text-base font-bold tracking-wide text-white">
                Termostat Kontrol Tekerleği
              </h3>
              <p className="text-[10px] text-slate-400">
                Dokunmatik hassas sıcaklık ayarı
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Kapat ve Ambiyansa Dön"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 15-Second Inactivity Countdown Progress Pill */}
        <div className="w-full my-2 flex items-center justify-between px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Dokunulmazsa ambiyansa döner</span>
          </span>
          <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            {countdown} sn
          </span>
        </div>

        {/* ── THE INTERACTIVE THERMOSTAT ROTARY DIAL WHEEL ── */}
        <div className="relative my-4 flex items-center justify-center">
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
              stroke="rgba(255, 255, 255, 0.12)"
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Hedef Sıcaklık
            </span>
            <div className="flex items-baseline font-mono font-black text-4xl sm:text-5xl text-white tracking-tight drop-shadow-lg">
              <span>{targetTemp.toFixed(1)}</span>
              <span className="text-xl sm:text-2xl text-amber-400 ml-0.5">°C</span>
            </div>

            {/* Kombi / Heating Status Badge */}
            <div
              className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                isKombiActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>{isKombiActive ? 'Kombi Isıtıyor' : 'Beklemede'}</span>
            </div>

            <div className="mt-1 text-[10px] font-medium text-slate-400">
              Oda Sıcaklığı:{' '}
              <span className="font-bold text-emerald-400">{currentTemp}°C</span>
              {tempDiff !== 0 && (
                <span className="ml-1 text-slate-500">
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
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white font-black flex items-center justify-center transition-all border border-white/15 shadow-lg cursor-pointer"
            title="0.5°C Azalt"
          >
            <Minus className="w-5 h-5 text-sky-400" />
          </button>

          <div className="flex flex-col items-center px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">
              Hassas Adım
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
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
                  isSelected
                    ? 'bg-amber-500/25 border-amber-400 text-white font-bold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${preset.color} mb-0.5`} />
                <span className="text-[10px]">{preset.label}</span>
                <span className="text-[9px] font-mono text-slate-400">
                  {preset.temp}°C
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Return Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sinematik Ambiyans Moduna Dön</span>
        </button>
      </div>
    </div>
  );
};
