import React, { useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface TactileDialWidgetProps {
  targetTemp: number;
  currentTemp: number;
  isKombiActive: boolean;
  onSetTarget: (newTemp: number) => void;
  activeModeName?: string;
  thermalHue?: number;
}

export const TactileDialWidget: React.FC<TactileDialWidgetProps> = ({
  targetTemp,
  currentTemp,
  isKombiActive,
  onSetTarget,
  activeModeName = 'KONFOR',
  thermalHue = 300,
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Map 16.0°C - 30.0°C to -135deg to +135deg (span 270 deg)
  const minTemp = 16.0;
  const maxTemp = 30.0;
  const currentAngle = Math.min(135, Math.max(-135, ((targetTemp - minTemp) / (maxTemp - minTemp)) * 270 - 135));
  const lastAngleRef = useRef<number>(currentAngle);

  // Update angle directly from pointer coords relative to dial center
  const updateAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    // Angle where 12 o'clock is 0 deg, clockwise is positive
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;

    let targetAngle = deg;
    // Guard against flipping through bottom dead zone (-135° to +135°)
    if (lastAngleRef.current > 60 && deg < -90) {
      targetAngle = 135;
    } else if (lastAngleRef.current < -60 && deg > 90) {
      targetAngle = -135;
    } else if (targetAngle > 135) {
      targetAngle = 135;
    } else if (targetAngle < -135) {
      targetAngle = -135;
    }

    lastAngleRef.current = targetAngle;

    const fraction = (targetAngle - (-135)) / 270;
    const rawTemp = minTemp + fraction * (maxTemp - minTemp);
    const clamped = Math.min(maxTemp, Math.max(minTemp, Math.round(rawTemp * 2) / 2));
    if (clamped !== targetTemp) {
      onSetTarget(clamped);
      triggerHaptic('selection');
    }
  }, [targetTemp, onSetTarget]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
    lastAngleRef.current = currentAngle;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.5 : -0.5;
    const clamped = Math.min(maxTemp, Math.max(minTemp, Math.round((targetTemp + delta) * 2) / 2));
    if (clamped !== targetTemp) {
      onSetTarget(clamped);
      triggerHaptic('selection');
    }
  };

  const handleIncrement = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const clamped = Math.min(maxTemp, Math.max(minTemp, Math.round((targetTemp + amount) * 2) / 2));
    onSetTarget(clamped);
    triggerHaptic('selection');
  };

  // Determine mode color
  let modeBadgeColor = '#f59e0b'; // amber
  if (activeModeName.includes('EKO')) modeBadgeColor = '#10b981';
  else if (activeModeName.includes('GECE')) modeBadgeColor = '#818cf8';
  else if (activeModeName.includes('BOOST')) modeBadgeColor = '#fb923c';

  return (
    <div
      className="flex flex-col items-center justify-center select-none py-1 my-auto w-fit mx-auto"
    >
      {/* ── ROTARY DIAL (Exact Knurled 3D Design with 360° Circular Drag) ── */}
      <div
        ref={dialRef}
        data-no-swipe="true"
        data-dial-widget="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        className={`w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 rounded-full relative touch-none select-none no-swipe ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          background: 'repeating-conic-gradient(#0b0a0f 0 4deg, #5d5663 4deg 8deg)',
          boxShadow: `
            0 16px 30px rgba(0, 0, 0, 0.8),
            0 0 0 3px #0a090d,
            0 0 ${isDragging ? '45px' : '30px'} rgba(255, 140, 60, ${isDragging ? 0.65 : isKombiActive ? 0.45 : 0.08})
          `,
        }}
        title="Turuncu ayar ışığını parmağınızla saat yönünde veya tersinde çevirerek dereceyi ayarlayabilirsiniz"
      >
        {/* Inner Metallic Disc / Convex Cap */}
        <div
          className="absolute inset-3 sm:inset-4 rounded-full flex flex-col items-center justify-center pointer-events-none transition-all duration-300"
          style={{
            background: `
              linear-gradient(172deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 60%),
              radial-gradient(circle at 35% 28%, #4c4954, #18171d 75%)
            `,
            boxShadow: `
              inset 0 2.5px 5px rgba(255, 255, 255, 0.35),
              inset 0 -7px 14px rgba(0, 0, 0, 0.75),
              0 0 24px rgba(255, 150, 70, ${isDragging ? 0.5 : isKombiActive ? 0.35 : 0.05})
            `,
          }}
        >
          {/* Rotating Dial Indicator Pill (Orange Setting Light) */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-75"
            style={{ transform: `rotate(${currentAngle}deg)` }}
          >
            <div
              className="absolute left-1/2 top-1 sm:top-1.5 w-2 sm:w-2.5 h-4 sm:h-5 -ml-1 sm:-ml-1.25 rounded-full transition-all duration-150"
              style={{
                backgroundColor: isDragging ? '#ffbe76' : isKombiActive ? '#ff9a4a' : '#f59e0b',
                boxShadow: isDragging
                  ? '0 0 16px #ff9a4a, 0 0 28px #ff7a1a, 0 0 6px #ffffff'
                  : isKombiActive
                  ? '0 0 10px #ff8a3a, 0 0 20px #ff7a1a'
                  : '0 0 8px #f59e0b',
                transform: isDragging ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          </div>

          {/* Central Readout (Exact typography from Image 3) */}
          <div className="flex flex-col items-center justify-center text-center z-10 px-2 pointer-events-none">
            <span className="text-[10px] xs:text-[11px] font-bold text-[#8f9bb3] tracking-widest uppercase mb-0.5">
              HEDEF TERMOSTAT
            </span>

            <span className="text-3xl xs:text-4xl sm:text-5xl font-black font-mono tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none my-0.5">
              {targetTemp.toFixed(1)}°
            </span>

            <span
              className="text-[10px] xs:text-[11px] font-extrabold uppercase tracking-wide mt-1"
              style={{
                color: modeBadgeColor,
                textShadow: `0 0 10px ${modeBadgeColor}80`,
              }}
            >
              {activeModeName} MODU
            </span>
          </div>
        </div>
      </div>

      {/* ── STEPPER BUTTONS (Exact [-] ±0.5°C [+] row from User's Image 3 with Convex 3D Styling) ── */}
      <div className="flex items-center gap-3.5 mt-3 sm:mt-4">
        <button
          type="button"
          onClick={(e) => handleIncrement(-0.5, e)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-lg text-white cursor-pointer transition-all active:translate-y-1"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: `
              linear-gradient(172deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 60%),
              radial-gradient(circle at 50% 45%, #464250 0%, #201e27 80%)
            `,
            boxShadow: `
              0 6px 0 #0c0b10,
              0 12px 18px rgba(0, 0, 0, 0.7),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
              inset 0 -2px 3px rgba(0, 0, 0, 0.6)
            `,
          }}
          title="0.5°C Azalt"
        >
          -
        </button>

        <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 tracking-wider">
          ±0.5°C
        </span>

        <button
          type="button"
          onClick={(e) => handleIncrement(0.5, e)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-lg text-white cursor-pointer transition-all active:translate-y-1"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: `
              linear-gradient(172deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 60%),
              radial-gradient(circle at 50% 45%, #464250 0%, #201e27 80%)
            `,
            boxShadow: `
              0 6px 0 #0c0b10,
              0 12px 18px rgba(0, 0, 0, 0.7),
              inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
              inset 0 -2px 3px rgba(0, 0, 0, 0.6)
            `,
          }}
          title="0.5°C Artır"
        >
          +
        </button>
      </div>
    </div>
  );
};
