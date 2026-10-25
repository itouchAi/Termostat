import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Power,
  RotateCcw,
  Check,
  Sparkles,
  Gauge,
  Droplets,
  Clock,
  Zap,
  Volume2,
  Sliders,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface TactileDeckPreviewCardProps {
  onApplyTheme?: () => void;
  isActiveTheme?: boolean;
  currentRoomTemp?: number;
  initialTargetTemp?: number;
  initialIsActive?: boolean;
}

export const TactileDeckPreviewCard: React.FC<TactileDeckPreviewCardProps> = ({
  onApplyTheme,
  isActiveTheme = false,
  currentRoomTemp = 21.8,
  initialTargetTemp = 22.5,
  initialIsActive = true,
}) => {
  // Core Thermostat States
  const [targetTemp, setTargetTemp] = useState<number>(initialTargetTemp);
  const [isKombiOn, setIsKombiOn] = useState<boolean>(initialIsActive);
  const [activeMode, setActiveMode] = useState<'EKO' | 'KONFOR' | 'GECE' | 'BOOST'>('KONFOR');
  const [flameModulation, setFlameModulation] = useState<number>(65); // 0-100%
  const [waterPressure, setWaterPressure] = useState<number>(1.6); // 1.0 - 2.5 Bar
  const [hue, setHue] = useState<number>(65); // Color tone for neon accent
  const [brightness, setBrightness] = useState<number>(75); // Glow brightness

  // Temporary flash message for VFD display
  const [displayFlash, setDisplayFlash] = useState<string | null>(null);

  // Knob interaction drag handling
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startTempRef = useRef(targetTemp);

  const triggerDisplayMessage = (msg: string) => {
    setDisplayFlash(msg);
    const timer = setTimeout(() => setDisplayFlash(null), 1400);
    return () => clearTimeout(timer);
  };

  // Synchronize target temperature with dial rotation angle (-135deg to +135deg for 16°C - 30°C)
  // minTemp: 16°C, maxTemp: 30°C -> span = 14°C, angleSpan = 270deg
  const dialAngle = Math.min(135, Math.max(-135, ((targetTemp - 16) / 14) * 270 - 135));

  // Secondary knob angles
  const pumpAngle = ((flameModulation / 100) * 270) - 135;
  const hueAngle = ((hue / 100) * 270) - 135;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startTempRef.current = targetTemp;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = startYRef.current - e.clientY;
    const tempChange = (deltaY / 80) * 2.5; // Smooth increment
    const newTemp = Math.min(30, Math.max(16, Math.round((startTempRef.current + tempChange) * 2) / 2));
    if (newTemp !== targetTemp) {
      setTargetTemp(newTemp);
      triggerHaptic('selection');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.5 : -0.5;
    const newTemp = Math.min(30, Math.max(16, Math.round((targetTemp + delta) * 2) / 2));
    setTargetTemp(newTemp);
    triggerHaptic('selection');
  };

  const selectPresetMode = (mode: 'EKO' | 'KONFOR' | 'GECE' | 'BOOST', temp: number) => {
    setActiveMode(mode);
    setTargetTemp(temp);
    triggerHaptic('medium');
    triggerDisplayMessage(`${mode}: ${temp.toFixed(1)}°C`);
  };

  const togglePower = () => {
    const nextState = !isKombiOn;
    setIsKombiOn(nextState);
    triggerHaptic('heavy');
    triggerDisplayMessage(nextState ? 'KOMBİ ATEŞLENDİ' : 'KOMBİ KAPATILDI');
  };

  // Dynamic CSS variables according to user's HTML specification
  const accentH = 190 + hue * 1.7;
  const accentLight = 0.25 + (brightness / 100) * 0.95;

  return (
    <div
      className="w-full rounded-[34px] sm:rounded-[38px] p-4 sm:p-6 text-white relative overflow-hidden select-none transition-all duration-500 font-sans"
      style={{
        background: `
          radial-gradient(48% 42% at 78% 40%, hsl(${accentH} 55% 48% / 0.35), transparent 72%),
          radial-gradient(42% 40% at 20% 78%, rgba(255,150,70, ${isKombiOn ? 0.35 : 0.08}), transparent 72%),
          linear-gradient(215deg, #706e8e 0%, #47435a 42%, #262330 100%)
        `,
        boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.95)',
      }}
    >
      {/* ── Top Header Notice ── */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
              <span>Tactile Deck • Kombi Donanım Konsolu</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Canlı Önizleme
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Skeuomorphic metal potansiyometreler, 3D mekanik basmalı tuşlar ve sıcak akkor ateşleme aurası.
            </p>
          </div>
        </div>

        {onApplyTheme && (
          <button
            type="button"
            onClick={onApplyTheme}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md ${
              isActiveTheme
                ? 'bg-emerald-600 text-white border border-emerald-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border border-amber-300/40 shadow-amber-500/20'
            }`}
          >
            {isActiveTheme ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Aktif Tema</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bu Temayı Uygula</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── 3D PHYSICAL HARDWARE DECK CONTAINER (Exact implementation from user's HTML) ── */}
      <div className="relative mx-auto w-full max-w-xl transition-transform duration-300">
        {/* Layer 1: sh - Deep Black Blur Shadow */}
        <div
          className="absolute inset-0 rounded-[52px] pointer-events-none"
          style={{
            transform: 'translate(18px, 48px) scale(0.96)',
            background: '#000',
            filter: 'blur(34px)',
            opacity: 0.65,
          }}
        />

        {/* Layer 2: wm - Warm Fire Ambient Glow behind the chassis (Linked to Kombi Fire!) */}
        <div
          className="absolute inset-0 rounded-[52px] pointer-events-none transition-opacity duration-700"
          style={{
            transform: 'translate(-40px, 42px) scale(0.92)',
            background: isKombiOn
              ? 'radial-gradient(circle at 40% 50%, rgba(255, 140, 60, 0.85), rgba(249, 115, 22, 0.4) 60%, transparent 80%)'
              : 'radial-gradient(circle at 40% 50%, rgba(138, 92, 246, 0.3), transparent 70%)',
            filter: 'blur(45px)',
            opacity: isKombiOn ? accentLight * 0.9 : 0.25,
          }}
        />

        {/* Layer 3: l3 - Deep Chassis Edge */}
        <div
          className="absolute inset-0 rounded-[52px] pointer-events-none"
          style={{
            transform: 'translateY(20px)',
            background: '#15131b',
            border: '1.5px solid #3b3846',
          }}
        />

        {/* Layer 4: l2 - Middle Bevel with Neon Radiance */}
        <div
          className="absolute inset-0 rounded-[52px] pointer-events-none"
          style={{
            transform: 'translateY(11px)',
            border: `1.5px solid hsl(${accentH} 70% 60% / 0.5)`,
            background: `linear-gradient(135deg, #2a1546, hsl(${accentH} 55% 36%))`,
            boxShadow: `0 0 45px hsl(${accentH} 90% 60% / ${accentLight * 0.45})`,
          }}
        />

        {/* Layer 5: l1 - Raised Plate Rim */}
        <div
          className="absolute inset-0 rounded-[52px] pointer-events-none"
          style={{
            transform: 'translateY(5px)',
            background: '#1b1a21',
            border: '1.5px solid #46424f',
          }}
        />

        {/* ── TOP LAYER: Brushed Dark Faceplate with all controls ── */}
        <div
          className="relative rounded-[50px] p-5 sm:p-7 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(145deg, #3c3a46, #23222a 58%, #1b1a21)',
            border: '1.5px solid rgba(255, 255, 255, 0.16)',
            boxShadow: `
              inset 0 2px 0 rgba(255, 255, 255, 0.22),
              inset 0 0 70px rgba(0, 0, 0, 0.4),
              inset -40px -40px 90px hsl(${accentH} 70% 40% / 0.2)
            `,
          }}
        >
          {/* Top Row: Auxiliary Knobs (Fan/Pump RPM, Neon Aura Hue) + Status LED */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Secondary Knob 1: Pompa Devri (RPM) / Alev Hızı */}
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-full relative cursor-ns-resize touch-none shadow-[0_10px_18px_rgba(0,0,0,0.65),0_0_0_2px_#0a090d]"
                  style={{
                    background: 'repeating-conic-gradient(#0b0a0f 0 4deg, #5d5663 4deg 8deg)',
                  }}
                  title="Pompa Devri ve Alev Modülasyonu"
                  onClick={() => {
                    const next = flameModulation >= 90 ? 30 : flameModulation + 20;
                    setFlameModulation(next);
                    triggerHaptic('selection');
                    triggerDisplayMessage(`ALEV: %${next}`);
                  }}
                >
                  <div
                    className="absolute inset-1.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 34% 28%, #4c4954, #18171d 72%)',
                      boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.28), inset 0 -4px 7px rgba(0,0,0,0.65)',
                    }}
                  >
                    <div
                      className="absolute inset-0 transition-transform duration-200"
                      style={{ transform: `rotate(${pumpAngle}deg)` }}
                    >
                      <div
                        className="absolute left-1/2 top-1 w-1 h-2 -ml-0.5 rounded-full"
                        style={{
                          backgroundColor: '#ff9a4a',
                          boxShadow: '0 0 6px #ff8a3a',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-1">Pompa</span>
              </div>

              {/* Secondary Knob 2: Neon Aura Hue */}
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-full relative cursor-ns-resize touch-none shadow-[0_10px_18px_rgba(0,0,0,0.65),0_0_0_2px_#0a090d]"
                  style={{
                    background: 'repeating-conic-gradient(#0b0a0f 0 4deg, #5d5663 4deg 8deg)',
                  }}
                  title="Konsol Işık Tonu (Hue)"
                  onClick={() => {
                    const next = hue >= 90 ? 10 : hue + 25;
                    setHue(next);
                    triggerHaptic('selection');
                    triggerDisplayMessage(`TON: ${Math.round(next)}°`);
                  }}
                >
                  <div
                    className="absolute inset-1.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 34% 28%, #4c4954, #18171d 72%)',
                      boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.28), inset 0 -4px 7px rgba(0,0,0,0.65)',
                    }}
                  >
                    <div
                      className="absolute inset-0 transition-transform duration-200"
                      style={{ transform: `rotate(${hueAngle}deg)` }}
                    >
                      <div
                        className="absolute left-1/2 top-1 w-1 h-2 -ml-0.5 rounded-full"
                        style={{
                          backgroundColor: `hsl(${accentH} 90% 72%)`,
                          boxShadow: `0 0 8px hsl(${accentH} 90% 72%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-1">Ambiyans</span>
              </div>
            </div>

            {/* Hardware Status LED Lamp */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full transition-all duration-300"
                style={{
                  border: isKombiOn ? `3px solid hsl(${accentH} 90% 72%)` : '3px solid #55505f',
                  backgroundColor: isKombiOn ? `hsl(${accentH} 90% 72%)` : '#1c1b22',
                  boxShadow: isKombiOn
                    ? `0 0 16px hsl(${accentH} 90% 72%), inset 0 0 6px hsl(${accentH} 90% 65% / 0.55)`
                    : 'none',
                }}
              />
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">
                {isKombiOn ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* ── ROW 2: VFD / LCD DIGITAL DISPLAY BAND (.disp from user's HTML) ── */}
          <div
            className="w-full py-2.5 px-4 rounded-[22px] flex items-center justify-between font-mono text-xs font-semibold tracking-wider transition-all duration-300"
            style={{
              background: 'linear-gradient(172deg, rgba(255, 255, 255, 0.14), transparent 40%), #2a2733',
              boxShadow: '0 5px 0 #0c0b10, 0 10px 16px rgba(0, 0, 0, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: `hsl(${accentH} 90% 72%)`,
              textShadow: `0 0 10px hsl(${accentH} 90% 65% / 0.55)`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="opacity-70">ODA:</span>
                <span className="font-black text-white">{currentRoomTemp.toFixed(1)}°C</span>
              </span>
              <span className="opacity-30">|</span>
              <span className="flex items-center gap-1">
                <span className="opacity-70">BASINÇ:</span>
                <span className="font-black text-white">{waterPressure.toFixed(1)} Bar</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {displayFlash ? (
                <span className="text-amber-300 animate-pulse font-black uppercase">{displayFlash}</span>
              ) : (
                <>
                  <span className="opacity-70">HEDEF:</span>
                  <span className="font-black text-white text-sm">{targetTemp.toFixed(1)}°C</span>
                </>
              )}
            </div>
          </div>

          {/* ── ROW 3: CENTERPIECE BIG ROTARY TEMPERATURE DIAL (KNOB) ── */}
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center">
              {/* The Grand Tactile Dial */}
              <div
                ref={knobRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full relative cursor-ns-resize touch-none select-none transition-transform"
                style={{
                  background: 'repeating-conic-gradient(#0b0a0f 0 4deg, #5d5663 4deg 8deg)',
                  boxShadow: `
                    0 18px 30px rgba(0,0,0,0.8),
                    0 0 0 3px #0a090d,
                    0 0 25px hsl(${accentH} 90% 60% / ${isKombiOn ? 0.35 : 0.05})
                  `,
                }}
                title="Sıcaklığı değiştirmek için dikey sürükleyin veya fare tekerleğini çevirin"
              >
                {/* Dial Center Metallic Cap */}
                <div
                  className="absolute inset-3 sm:inset-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-300"
                  style={{
                    background: 'radial-gradient(circle at 34% 28%, #4c4954, #18171d 72%)',
                    boxShadow: isKombiOn
                      ? `
                        inset 0 2px 4px rgba(255,255,255,0.35),
                        inset 0 -6px 12px rgba(0,0,0,0.7),
                        0 0 24px rgba(255, 170, 110, ${accentLight * 0.7})
                      `
                      : 'inset 0 2px 4px rgba(255,255,255,0.28), inset 0 -6px 12px rgba(0,0,0,0.7)',
                  }}
                >
                  {/* Rotating Dial Line Marker */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-transform duration-100"
                    style={{ transform: `rotate(${dialAngle}deg)` }}
                  >
                    <div
                      className="absolute left-1/2 top-1.5 w-1.5 h-3.5 -ml-[3px] rounded-sm transition-all"
                      style={{
                        backgroundColor: isKombiOn ? '#ff9a4a' : `hsl(${accentH} 90% 72%)`,
                        boxShadow: isKombiOn ? '0 0 10px #ff8a3a' : `0 0 10px hsl(${accentH} 90% 72%)`,
                      }}
                    />
                  </div>

                  {/* Temperature Readout inside Knob */}
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      HEDEF TERMOSTAT
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {targetTemp.toFixed(1)}°
                    </span>
                    <span className="text-[9px] font-semibold text-amber-300 mt-0.5">
                      {activeMode} MODU
                    </span>
                  </div>
                </div>
              </div>

              {/* Stepper Buttons for Quick Increment */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const newT = Math.max(16, Math.round((targetTemp - 0.5) * 2) / 2);
                    setTargetTemp(newT);
                    triggerHaptic('selection');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all active:translate-y-1"
                  style={{
                    background: 'linear-gradient(172deg, rgba(255,255,255,0.22), transparent 46%), #2b2932',
                    boxShadow: '0 4px 0 #0c0b10, 0 8px 12px rgba(0,0,0,0.65)',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }}
                  title="0.5°C Azalt"
                >
                  -
                </button>
                <span className="text-[11px] font-mono text-slate-300 font-bold">±0.5°C</span>
                <button
                  type="button"
                  onClick={() => {
                    const newT = Math.min(30, Math.round((targetTemp + 0.5) * 2) / 2);
                    setTargetTemp(newT);
                    triggerHaptic('selection');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all active:translate-y-1"
                  style={{
                    background: 'linear-gradient(172deg, rgba(255,255,255,0.22), transparent 46%), #2b2932',
                    boxShadow: '0 4px 0 #0c0b10, 0 8px 12px rgba(0,0,0,0.65)',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }}
                  title="0.5°C Artır"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ── ROW 4: NEON PROGRESS RAIL (.rail from user's HTML) ── */}
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span
                style={{
                  color: `hsl(${accentH} 90% 72%)`,
                  textShadow: `0 0 10px hsl(${accentH} 90% 65% / 0.55)`,
                }}
              >
                Alev Modülasyonu: %{flameModulation}
              </span>
              <span className="text-slate-400 text-[10px]">Modülasyonlu Yanma Seviyesi</span>
            </div>

            {/* Interactive Rail */}
            <div
              className="relative h-7 cursor-pointer touch-none flex items-center"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                setFlameModulation(pct);
                triggerHaptic('selection');
              }}
            >
              {/* Dark Groove */}
              <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#0b0a0f] shadow-[0_1px_0_rgba(255,255,255,0.12)]" />
              {/* Glowing Neon Tube */}
              <div
                className="absolute left-0 h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: `${flameModulation}%`,
                  background: isKombiOn
                    ? 'linear-gradient(90deg, #ea580c, #f97316 60%, #fdba74)'
                    : `linear-gradient(90deg, hsl(${accentH} 60% 36%), hsl(${accentH} 90% 72%))`,
                  boxShadow: isKombiOn
                    ? '0 0 14px #ea580c, 0 0 28px rgba(234,88,12,0.5)'
                    : `0 0 12px hsl(${accentH} 90% 72%), 0 0 28px hsl(${accentH} 90% 65% / 0.55)`,
                }}
              />
              {/* Shiny White Thumb Bead */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#fff] transition-all duration-200 -ml-1.5"
                style={{ left: `${flameModulation}%` }}
              />
            </div>
          </div>

          {/* ── ROW 5: 3D MECHANICAL PRESET MODE BUTTONS (.b, .lit, .warm from user's HTML) ── */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { id: 'EKO' as const, label: 'EKO', temp: 20.0, icon: '🍃', isWarm: false },
              { id: 'KONFOR' as const, label: 'KONFOR', temp: 22.5, icon: '🔥', isWarm: true },
              { id: 'GECE' as const, label: 'GECE', temp: 18.5, icon: '🌙', isWarm: false },
              { id: 'BOOST' as const, label: 'BOOST', temp: 25.0, icon: '⚡', isWarm: true },
            ].map((btn) => {
              const isSelected = activeMode === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => selectPresetMode(btn.id, btn.temp)}
                  className="py-2.5 px-1 rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer font-bold text-xs transition-all duration-120 active:translate-y-1.5"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    background: isSelected
                      ? btn.isWarm
                        ? 'linear-gradient(172deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%), radial-gradient(70% 130% at 50% 60%, rgba(255,140,60,0.5), transparent 75%), #2b2830'
                        : `linear-gradient(172deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%), radial-gradient(60% 130% at 50% 60%, hsl(${accentH} 85% 50% / 0.55), transparent 75%), #27252e`
                      : 'linear-gradient(172deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 46%), #2b2932',
                    boxShadow: isSelected
                      ? btn.isWarm
                        ? '0 6px 0 #0c0b10, 0 10px 16px rgba(0,0,0,0.65), 0 0 28px rgba(255,150,70,0.45)'
                        : `0 6px 0 #0c0b10, 0 10px 16px rgba(0,0,0,0.65), 0 0 26px hsl(${accentH} 90% 60% / 0.35)`
                      : '0 6px 0 #0c0b10, 0 12px 18px rgba(0,0,0,0.65)',
                    color: isSelected ? (btn.isWarm ? '#ffe2c2' : '#ffe3ff') : '#cfc9da',
                    textShadow: isSelected
                      ? btn.isWarm
                        ? '0 0 4px #fff9, 0 0 12px #ff9a4a, 0 0 20px #ff8a3a'
                        : `0 0 4px #fff9, 0 0 12px hsl(${accentH} 90% 72%), 0 0 20px hsl(${accentH} 90% 72%)`
                      : 'none',
                  }}
                >
                  <span className="text-sm">{btn.icon}</span>
                  <span className="tracking-tight text-[11px] font-black">{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── ROW 6: GRAND POWER / IGNITION SWITCH (.go from user's HTML) ── */}
          <button
            type="button"
            onClick={togglePower}
            className="w-full py-4 px-6 rounded-full flex items-center justify-between font-black text-lg sm:text-xl text-white cursor-pointer transition-all duration-150 active:translate-y-1.5"
            style={{
              border: '1.5px solid rgba(255, 255, 255, 0.28)',
              background: isKombiOn
                ? 'linear-gradient(172deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 52%), linear-gradient(100deg, #7c2d12 0%, #c2410c 42%, #fb923c 100%)'
                : `linear-gradient(172deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 52%), linear-gradient(100deg, hsl(${accentH} 60% 16%) 0%, hsl(${accentH} 55% 30%) 42%, hsl(${accentH} 92% 68%) 100%)`,
              boxShadow: isKombiOn
                ? '0 7px 0 #0c0b10, 0 14px 22px rgba(0,0,0,0.65), 0 0 42px rgba(249,115,22,0.65)'
                : `0 7px 0 #0c0b10, 0 14px 22px rgba(0,0,0,0.65), 0 0 36px hsl(${accentH} 90% 60% / 0.35)`,
              textShadow: '0 0 14px rgba(255,255,255,0.6)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
                }}
              >
                {isKombiOn ? (
                  <Flame className="w-6 h-6 text-yellow-200 fill-yellow-300 drop-shadow-[0_0_8px_#fff]" />
                ) : (
                  <Power className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="leading-tight">
                  {isKombiOn ? 'KOMBİ ATEŞLEMEDE' : 'KOMBİ BEKLEMEDE'}
                </span>
                <span className="text-[10px] font-mono font-semibold tracking-wider opacity-80">
                  {isKombiOn ? 'Alev Aktif • Modülasyon %' + flameModulation : 'Isıtma Kapalı • Dokun Aç'}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/30 border border-white/20">
              {isKombiOn ? 'DURDUR' : 'BAŞLAT'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Bottom Information Strip ── */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Fiziksel dokunsal düğme tepkisi (5px click drop) ve akkor aydınlatma devrede</span>
        </div>
        <span className="font-mono text-[11px] text-amber-300 font-bold">Tactile Skeuomorphic v1.0</span>
      </div>
    </div>
  );
};
