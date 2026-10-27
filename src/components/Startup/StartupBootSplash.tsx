import React, { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface StartupBootSplashProps {
  onComplete: () => void;
  isPreview?: boolean;
}

export const StartupBootSplash: React.FC<StartupBootSplashProps> = ({
  onComplete,
  isPreview = false,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  // Store onComplete in ref so parent re-renders do NOT re-trigger the animation effect
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startTime = performance.now();
    const DURATION = 1200; // 1.2s progress duration
    let animationFrameId: number;
    let hasTriggeredEndHaptic = false;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(pct);

      if (pct < 100) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        if (!hasTriggeredEndHaptic) {
          hasTriggeredEndHaptic = true;
          triggerHaptic('success');
        }

        // Trigger gentle fade out at 1.2s
        setIsDismissing(true);

        // Terminate cleanly at exactly 1.5s total
        setTimeout(() => {
          onCompleteRef.current();
        }, 300);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sistem Açılış Ekranı"
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-300 ease-out pointer-events-none ${
        isDismissing ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
      }`}
      style={{
        background: `
          radial-gradient(circle at 50% 48%, rgba(255, 140, 50, 0.16) 0%, rgba(200, 75, 20, 0.08) 35%, transparent 70%),
          linear-gradient(180deg, #161420 0%, #0d0c14 55%, #07070b 100%)
        `,
      }}
    >
      {/* Background Micro Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Preview Badge if triggered from Settings */}
      {isPreview && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
            AÇILIŞ ÖNİZLEMESİ
          </span>
        </div>
      )}

      {/* Centerpiece: Glowing Flame with subtle breathing pulse */}
      <div className="relative flex flex-col items-center justify-center mb-6">
        <div className="absolute w-48 h-48 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

        <div
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center p-2 shadow-2xl"
          style={{
            background: 'radial-gradient(circle at 40% 35%, #252230 0%, #100f16 80%)',
            border: '1px solid rgba(255, 150, 80, 0.25)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,120,40,0.25)',
          }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/40 border border-amber-300/50">
            <Flame className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>

      {/* App Title */}
      <div className="flex flex-col items-center text-center px-4 mb-6 z-10">
        <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-100 uppercase drop-shadow-sm">
          Kombi Termostat 3D
        </h1>
        <p className="text-[11px] font-mono text-slate-400 mt-1 tracking-wider uppercase">
          Tactile Edition
        </p>
      </div>

      {/* Progress Bar & Status Text */}
      <div className="w-[78vw] max-w-xs flex flex-col items-center gap-2 z-10">
        {/* Glowing Progress Track */}
        <div className="w-full h-1.5 rounded-full bg-[#1b1827] border border-white/10 p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75 ease-linear"
            style={{
              width: `${progress}%`,
              background:
                'linear-gradient(90deg, #ff9a3c 0%, #ff6b1a 60%, #ffd06b 100%)',
              boxShadow: '0 0 10px rgba(255, 140, 50, 0.7)',
            }}
          />
        </div>

        {/* Status Line & % Counter */}
        <div className="flex items-center justify-between w-full text-[11px] text-slate-300">
          <span className="font-medium text-slate-400">
            {progress < 60
              ? 'Sistem başlatılıyor...'
              : progress < 100
              ? 'Donanım bağlanıyor...'
              : 'Bağlantı kuruldu ✓'}
          </span>
          <span className="font-mono font-bold text-amber-400 ml-2">
            %{progress}
          </span>
        </div>
      </div>
    </div>
  );
};
