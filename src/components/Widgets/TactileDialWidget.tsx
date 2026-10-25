import React, { useRef } from 'react';
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
  const startYRef = useRef(0);
  const startTempRef = useRef(targetTemp);

  // Map 16.0°C - 30.0°C to -135deg to +135deg (span 270 deg)
  const minTemp = 16.0;
  const maxTemp = 30.0;
  const angle = Math.min(135, Math.max(-135, ((targetTemp - minTemp) / (maxTemp - minTemp)) * 270 - 135));

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startTempRef.current = targetTemp;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const deltaY = startYRef.current - e.clientY;
    const tempChange = (deltaY / 70) * 2.0;
    const rawNew = startTempRef.current + tempChange;
    const clamped = Math.min(maxTemp, Math.max(minTemp, Math.round(rawNew * 2) / 2));
    if (clamped !== targetTemp) {
      onSetTarget(clamped);
      triggerHaptic('selection');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
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
      data-no-swipe="true"
      data-dial-widget="true"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onPointerMoveCapture={(e) => e.stopPropagation()}
      onPointerUpCapture={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
      onTouchMoveCapture={(e) => e.stopPropagation()}
      onTouchEndCapture={(e) => e.stopPropagation()}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onMouseMoveCapture={(e) => e.stopPropagation()}
      onMouseUpCapture={(e) => e.stopPropagation()}
      className="flex flex-col items-center justify-center select-none py-1 my-auto touch-none no-swipe"
    >
      {/* ── ROTARY DIAL (Exact Knurled 3D Design from User's Image 3) ── */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 rounded-full relative cursor-ns-resize touch-none select-none transition-transform"
        style={{
          background: 'repeating-conic-gradient(#0b0a0f 0 4deg, #5d5663 4deg 8deg)',
          boxShadow: `
            0 16px 30px rgba(0, 0, 0, 0.8),
            0 0 0 3px #0a090d,
            0 0 30px rgba(255, 140, 60, ${isKombiActive ? 0.45 : 0.08})
          `,
        }}
        title="Sıcaklığı ayarlamak için dikey sürükleyin veya fare tekerleğini çevirin"
      >
        {/* Inner Metallic Disc / Convex Cap */}
        <div
          className="absolute inset-3 sm:inset-4 rounded-full flex flex-col items-center justify-center transition-all duration-300"
          style={{
            background: `
              linear-gradient(172deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 60%),
              radial-gradient(circle at 35% 28%, #4c4954, #18171d 75%)
            `,
            boxShadow: `
              inset 0 2.5px 5px rgba(255, 255, 255, 0.35),
              inset 0 -7px 14px rgba(0, 0, 0, 0.75),
              0 0 24px rgba(255, 150, 70, ${isKombiActive ? 0.35 : 0.05})
            `,
          }}
        >
          {/* Rotating Dial Indicator Pill */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-100"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div
              className="absolute left-1/2 top-1.5 sm:top-2 w-1.5 sm:w-2 h-3.5 sm:h-4.5 -ml-0.5 sm:-ml-1 rounded-sm sm:rounded-full transition-all"
              style={{
                backgroundColor: isKombiActive ? '#ff9a4a' : '#f59e0b',
                boxShadow: isKombiActive
                  ? '0 0 10px #ff8a3a, 0 0 20px #ff7a1a'
                  : '0 0 8px #f59e0b',
              }}
            />
          </div>

          {/* Central Readout (Exact typography from Image 3) */}
          <div className="flex flex-col items-center justify-center text-center z-10 px-2">
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
