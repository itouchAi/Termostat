import React, { useState, useEffect, useRef } from 'react';
import type { MascotType, MascotState } from '../../types/mascot.ts';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';
import { playMascotSound } from '../../utils/mascotSounds.ts';

interface UniversalMascotProps {
  type?: MascotType;
  state?: MascotState;
  themeMode?: ThemeMode;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  soundEnabled?: boolean;
  onWakeScreen?: () => void;
  onStateChange?: (state: MascotState) => void;
  className?: string;
}

export const UniversalMascot: React.FC<UniversalMascotProps> = ({
  type = 'termobot',
  state: controlledState,
  themeMode = 'tactile_deck',
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
  size = 'md',
  interactive = true,
  soundEnabled = true,
  onWakeScreen,
  onStateChange,
  className = '',
}) => {
  // Autonomous state machine if state prop is not controlled
  const [internalState, setInternalState] = useState<MascotState>('idle');
  const activeState = controlledState !== undefined ? controlledState : internalState;

  const [speechText, setSpeechText] = useState<string | null>(null);
  const [sleepCycleCount, setSleepCycleCount] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState(false);

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scaled dimensions: 20% larger than previous baseline
  const scale = size === 'sm' ? 0.95 : size === 'lg' ? 1.6 : 1.3;

  // Synchronize state change to parent
  useEffect(() => {
    onStateChange?.(activeState);
  }, [activeState, onStateChange]);

  // Periodic eye blinking (when not sleeping)
  useEffect(() => {
    if (activeState === 'light_sleep' || activeState === 'deep_sleep' || activeState === 'sleeping') return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200 + Math.random() * 2200);
    return () => clearInterval(interval);
  }, [activeState]);

  // Knocking sound loop when knocking
  useEffect(() => {
    if (activeState !== 'knocking') return;
    const interval = setInterval(() => {
      playMascotSound('knock', soundEnabled);
    }, 900);
    return () => clearInterval(interval);
  }, [activeState, soundEnabled]);

  // Autonomous state transitions:
  // idle (5s) -> walking (7s) -> thinking (6s) -> knocking (6s) -> reading (7s) -> light_sleep (6s) -> brief_wake (3s) -> repeat x3 -> deep_sleep
  useEffect(() => {
    if (controlledState !== undefined) return;

    let timer: NodeJS.Timeout;

    if (internalState === 'idle') {
      timer = setTimeout(() => {
        setInternalState('walking');
        playMascotSound('walk', soundEnabled);
      }, 5500);
    } else if (internalState === 'walking') {
      timer = setTimeout(() => {
        setInternalState('thinking');
        playMascotSound('thinking', soundEnabled);
      }, 7000);
    } else if (internalState === 'thinking') {
      timer = setTimeout(() => {
        setInternalState('knocking');
        playMascotSound('knock', soundEnabled);
      }, 6000);
    } else if (internalState === 'knocking') {
      timer = setTimeout(() => {
        setInternalState('reading');
        playMascotSound('chirp', soundEnabled);
      }, 6500);
    } else if (internalState === 'reading') {
      timer = setTimeout(() => {
        setInternalState('light_sleep');
        playMascotSound('sleep', soundEnabled);
      }, 7500);
    } else if (internalState === 'light_sleep' || internalState === 'sleeping') {
      timer = setTimeout(() => {
        if (sleepCycleCount >= 2) {
          // 3rd cycle complete -> Enter Deep Sleep indefinitely until user interaction!
          setInternalState('deep_sleep');
        } else {
          setSleepCycleCount((prev) => prev + 1);
          setInternalState('brief_wake');
          playMascotSound('thinking', soundEnabled);
        }
      }, 6500);
    } else if (internalState === 'brief_wake') {
      timer = setTimeout(() => {
        setInternalState('light_sleep');
        playMascotSound('sleep', soundEnabled);
      }, 3500);
    } else if (internalState === 'happy') {
      // Return to idle after happy celebration
      timer = setTimeout(() => {
        setInternalState('idle');
        setSleepCycleCount(0);
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [controlledState, internalState, sleepCycleCount, soundEnabled]);

  // Handle interaction / click
  const handleInteraction = () => {
    if (!interactive) return;
    triggerHaptic('medium');
    playMascotSound('happy', soundEnabled);

    setInternalState('happy');
    setSleepCycleCount(0);

    let messages: string[] = [];
    if (type === 'termobot') {
      messages = [
        `Merhaba! TermoBot senin için 24 saat nöbette 🤖✨`,
        `Gıdıkladın! Oda sıcaklığı tam ${currentTemp.toFixed(1)}°C 💛`,
        isKombiActive
          ? `Kombi aktif alevde! Petekler sıcacık 🔥`
          : `Tasarruf modundayız, hedef ${targetTemp.toFixed(1)}°C! ⚡`,
      ];
    } else if (type === 'cat') {
      messages = [
        `Miyav! Peteklerin üstü tam bana göre sıcacık mırrr 🐱🔥`,
        `Gıdıklandım! Oda sıcaklığı tam ${currentTemp.toFixed(1)}°C 🐾`,
        `Mırrr... Kombi açıkken petek yanından ayrılmam! 💛`,
      ];
    } else if (type === 'rabbit') {
      messages = [
        `Havuç zamanı! Ev sıcacık, kulaklarımı oynatıyorum 🐰🥕`,
        `Zıplayarak geldim! Sıcaklık ${currentTemp.toFixed(1)}°C, çok ferah ✨`,
        `Beni uyandırdın! Petekler sıcacık, teşekkürler 🧡`,
      ];
    } else if (type === 'human_male') {
      messages = [
        `Selam! Kahvemi aldım, kombi telemetrisini izliyorum ☕👨`,
        `Oda sıcaklığı ${currentTemp.toFixed(1)}°C, hedef ${targetTemp.toFixed(1)}°C. Konfor harika! 🛋️`,
        isKombiActive ? `Kombi alevde, ev ısınıyor 🔥` : `Dengeli sıcaklık modundayız ❄️`,
      ];
    } else {
      messages = [
        `Merhaba! Sıcak çikolatamla ortam sıcaklığını dengeliyorum ☕👩`,
        `Oda sıcaklığı ${currentTemp.toFixed(1)}°C, evin ambiyansı tam kıvamında 🛋️✨`,
        isKombiActive ? `Petekler ısınıyor, her şey yolunda! 🔥` : `Tasarruf açık, keyfine bak 🌿`,
      ];
    }

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setSpeechText(randomMsg);

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => {
      setSpeechText(null);
    }, 3500);

    onWakeScreen?.();
  };

  const isSleeping =
    activeState === 'light_sleep' || activeState === 'deep_sleep' || activeState === 'sleeping';
  const isKnocking = activeState === 'knocking';
  const isThinking = activeState === 'thinking';
  const isReading = activeState === 'reading';
  const isWalking = activeState === 'walking';
  const isHappy = activeState === 'happy';

  // ─────────────────────────────────────────────────────────────
  // 1. DÜŞÜNME BULUTU (KAFASININ ÜSTÜNDE BULUT & İLGİSİZ HARFLER)
  // ─────────────────────────────────────────────────────────────
  const renderThinkingCloud = () => {
    if (!isThinking) return null;
    return (
      <div className="absolute -top-16 z-30 flex flex-col items-center animate-bounce duration-1000 select-none pointer-events-none">
        {/* Main Thought Cloud */}
        <div className="relative px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs shadow-[0_8px_20px_rgba(245,158,11,0.5)] border-2 border-white flex items-center gap-1.5 backdrop-blur-md">
          <span className="text-sm">💡</span>
          {/* İlgisiz / Gizemli Harfler ve Semboller */}
          <span className="font-mono text-[11px] tracking-wider text-slate-900 bg-white/40 px-1.5 py-0.5 rounded-md font-bold">
            ¿ ⚡ 404 ж Ω ∑ § λ π !
          </span>
        </div>
        {/* Trailing thought bubbles connecting to head */}
        <div className="flex flex-col items-center gap-0.5 mt-0.5 -mr-4">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-xs" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-white shadow-xs -ml-2" />
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CAMA TIK TIK TIK VURMA EFEKTİ & ŞOK DALGASI
  // ─────────────────────────────────────────────────────────────
  const renderGlassKnockEffect = () => {
    if (!isKnocking) return null;
    return (
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
        {/* Cam Vuruş Şok Dalgası Halka Efekti */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full border-2 border-cyan-400/90 animate-ping duration-700 opacity-75" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border border-white/80 animate-pulse duration-500" />
        </div>

        {/* Tık Tık Karikatür Rozeti */}
        <div className="absolute -top-12 z-30 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[11px] shadow-[0_6px_16px_rgba(6,182,212,0.6)] border-2 border-white flex items-center gap-1.5 animate-pulse">
          <span className="text-amber-300">✊</span>
          <span className="tracking-wide">TIK! TIK! TIK!</span>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 3. DOĞAL BÜYÜK KİTAP (YÜZÜN ÖNÜNDE İKİ ELLE TUTULAN)
  // ─────────────────────────────────────────────────────────────
  const renderNaturalBook = () => {
    if (!isReading) return null;
    return (
      <div className="absolute bottom-6 z-25 flex flex-col items-center pointer-events-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
        {/* Modeled Natural Open Book */}
        <div className="relative w-28 h-18 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-lg p-1 border-2 border-amber-600/60 shadow-2xl flex items-center justify-center">
          {/* Book Spine Center */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 bg-amber-950/90 z-20 shadow-inner" />

          {/* Left Page */}
          <div className="w-1/2 h-full bg-gradient-to-br from-amber-50 to-amber-100/90 rounded-l-md p-1.5 pr-2.5 flex flex-col justify-between border-r border-amber-300/40 shadow-inner">
            <div className="space-y-1">
              <div className="h-1 w-full bg-amber-900/40 rounded-full" />
              <div className="h-1 w-4/5 bg-amber-900/30 rounded-full" />
              <div className="h-1 w-3/4 bg-amber-900/30 rounded-full" />
              <div className="h-1 w-5/6 bg-amber-900/20 rounded-full" />
            </div>
            <div className="text-[7px] font-mono font-bold text-amber-700/80">Kombiler &bull; s.42</div>
          </div>

          {/* Right Page */}
          <div className="w-1/2 h-full bg-gradient-to-bl from-amber-50 to-amber-100/90 rounded-r-md p-1.5 pl-2.5 flex flex-col justify-between shadow-inner">
            <div className="space-y-1">
              <div className="h-1 w-full bg-amber-900/40 rounded-full" />
              <div className="h-1 w-5/6 bg-amber-900/30 rounded-full" />
              <div className="h-1 w-4/5 bg-amber-900/30 rounded-full" />
              <div className="h-1 w-2/3 bg-amber-900/20 rounded-full" />
            </div>
            <div className="text-[7px] font-mono font-bold text-amber-700/80 text-right">Termo v2</div>
          </div>

          {/* Red Bookmark Ribbon */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-4 bg-red-600 rounded-b-sm shadow-md" />

          {/* Hands holding the left and right margins */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-5 rounded-full bg-amber-400 border border-amber-600 shadow-sm" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-5 rounded-full bg-amber-400 border border-amber-600 shadow-sm" />
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 4. UYKU & DERİN UYKU Zzz GÖRSELİ
  // ─────────────────────────────────────────────────────────────
  const renderSleepZzz = () => {
    if (!isSleeping) return null;
    return (
      <div className="absolute -top-12 -right-4 z-30 pointer-events-none select-none flex flex-col items-center">
        <div className="relative text-sky-300 font-black flex flex-col items-end">
          <span className="text-xl animate-bounce duration-1000">Z</span>
          <span className="text-sm -mt-1 mr-2 opacity-80 animate-pulse">z</span>
          <span className="text-xs -mt-1 mr-4 opacity-60">z</span>
        </div>
        {activeState === 'deep_sleep' && (
          <div className="px-2 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/60 text-indigo-300 text-[9.5px] font-bold flex items-center gap-1 shadow-lg mt-0.5">
            <span>🌙</span>
            <span>Derin Uyku (%50 Kısık)</span>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 5. KARAKTER RENDERLAYICILARI (PROFESYONEL VEKTÖR MODELLEME)
  // ─────────────────────────────────────────────────────────────

  // --- A. TERMOBOT (RETRO CYBER ROBOT) ---
  const renderTermoBot = () => {
    return (
      <svg
        width={150 * scale}
        height={170 * scale}
        viewBox="0 0 150 170"
        className="filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        <defs>
          <linearGradient id="tbChassis" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#252e42" />
            <stop offset="50%" stopColor="#182030" />
            <stop offset="100%" stopColor="#0f1420" />
          </linearGradient>
          <linearGradient id="tbVisor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#080c14" />
            <stop offset="100%" stopColor="#04060a" />
          </linearGradient>
          <linearGradient id="tbGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Antenna */}
        <line x1="75" y1="20" x2="75" y2="40" stroke="url(#tbGold)" strokeWidth="4.5" strokeLinecap="round" />
        <circle
          cx="75"
          cy="16"
          r={isKnocking ? '8.5' : isThinking ? '9' : '7'}
          fill={isKnocking ? '#06b6d4' : isThinking ? '#eab308' : isHappy ? '#10b981' : '#f59e0b'}
          className={isThinking ? 'animate-ping' : ''}
        />

        {/* Head Chassis */}
        <rect
          x="25"
          y="38"
          width="100"
          height="66"
          rx="18"
          fill="url(#tbChassis)"
          stroke="url(#tbGold)"
          strokeWidth="3.5"
        />

        {/* Ears / Sound Sensors */}
        <rect x="18" y="55" width="7" height="26" rx="3.5" fill="#475569" stroke="#64748b" strokeWidth="1" />
        <rect x="125" y="55" width="7" height="26" rx="3.5" fill="#475569" stroke="#64748b" strokeWidth="1" />

        {/* Screen Visor */}
        <rect x="35" y="48" width="80" height="46" rx="12" fill="url(#tbVisor)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Eyes Expression */}
        {isSleeping ? (
          <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 48 71 Q 57 77 66 71" />
            <path d="M 84 71 Q 93 77 102 71" />
          </g>
        ) : isHappy ? (
          <g stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 48 73 Q 57 63 66 73" />
            <path d="M 84 73 Q 93 63 102 73" />
          </g>
        ) : isKnocking ? (
          <g fill="#06b6d4">
            <circle cx="56" cy="71" r="7.5" />
            <circle cx="94" cy="71" r="5" />
          </g>
        ) : isBlinking ? (
          <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
            <line x1="49" y1="71" x2="63" y2="71" />
            <line x1="87" y1="71" x2="101" y2="71" />
          </g>
        ) : (
          <g fill={isKombiActive ? '#f97316' : '#38bdf8'}>
            <circle cx="56" cy="71" r="6.5" />
            <circle cx="94" cy="71" r="6.5" />
            <circle cx="58" cy="69" r="2" fill="#ffffff" />
            <circle cx="96" cy="69" r="2" fill="#ffffff" />
          </g>
        )}

        {/* Neck Servo */}
        <rect x="67" y="104" width="16" height="8" rx="3" fill="#475569" />

        {/* Torso */}
        <rect
          x="36"
          y="111"
          width="78"
          height="48"
          rx="14"
          fill="url(#tbChassis)"
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Chest Display (Digital Matrix) */}
        <rect x="47" y="119" width="56" height="24" rx="7" fill="#070a10" stroke="#1e293b" strokeWidth="1" />
        <text
          x="75"
          y="135"
          textAnchor="middle"
          fill={isKombiActive ? '#f97316' : '#38bdf8'}
          fontSize="11"
          fontFamily="monospace"
          fontWeight="900"
        >
          {currentTemp.toFixed(1)}°C
        </text>

        {/* Left Arm (Knocking Glass or Resting) */}
        {isKnocking ? (
          <path
            d="M 36 122 Q 14 100 28 72"
            stroke="url(#tbGold)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        ) : isReading ? (
          <path d="M 36 124 Q 24 140 46 146" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M 36 122 Q 22 138 28 152" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* Right Arm */}
        {isReading ? (
          <path d="M 114 124 Q 126 140 104 146" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M 114 122 Q 128 138 122 152" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* Feet / Legs */}
        <rect x="52" y="158" width="11" height="9" rx="2" fill="#475569" />
        <rect x="87" y="158" width="11" height="9" rx="2" fill="#475569" />
        <rect x="47" y="164" width="21" height="6" rx="3" fill="url(#tbGold)" />
        <rect x="82" y="164" width="21" height="6" rx="3" fill="url(#tbGold)" />
      </svg>
    );
  };

  // --- B. MIRNAV (SICAK PETEK KEDİSİ - PROFESYONEL VEKTÖR) ---
  const renderCat = () => {
    return (
      <svg
        width={150 * scale}
        height={170 * scale}
        viewBox="0 0 150 170"
        className="filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        <defs>
          <linearGradient id="catFur" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="catScarf" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Swishing Tail */}
        <path
          d={isWalking ? 'M 115 130 Q 148 110 135 75' : 'M 115 130 Q 142 120 138 90'}
          stroke="url(#catFur)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />

        {/* Fluffy Body */}
        <ellipse cx="75" cy="120" rx="42" ry="32" fill="url(#catFur)" />

        {/* Knitted Winter Thermal Scarf */}
        <path
          d="M 45 94 Q 75 106 105 94 Q 108 108 75 112 Q 42 108 45 94 Z"
          fill="url(#catScarf)"
          stroke="#fee2e2"
          strokeWidth="1"
        />
        <rect x="84" y="104" width="10" height="20" rx="3" fill="#dc2626" />

        {/* Head */}
        <circle cx="75" cy="68" r="33" fill="url(#catFur)" />

        {/* Pointed Ears with Inner Pink */}
        <polygon points="46,38 62,64 36,64" fill="#ea580c" />
        <polygon points="46,42 58,62 39,62" fill="#fca5a5" />
        <polygon points="104,38 114,64 88,64" fill="#ea580c" />
        <polygon points="104,42 111,62 91,62" fill="#fca5a5" />

        {/* Cheeks with Warm Glow */}
        <circle cx="54" cy="76" r="6" fill="#fecaca" opacity="0.6" />
        <circle cx="96" cy="76" r="6" fill="#fecaca" opacity="0.6" />

        {/* Expressive Anime Eyes */}
        {isSleeping ? (
          <g stroke="#431407" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 56 68 Q 64 74 70 68" />
            <path d="M 80 68 Q 86 74 94 68" />
          </g>
        ) : isHappy ? (
          <g stroke="#047857" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 56 70 Q 63 60 70 70" />
            <path d="M 80 70 Q 87 60 94 70" />
          </g>
        ) : (
          <g fill="#15803d">
            <ellipse cx="63" cy="68" rx="6" ry="7" />
            <ellipse cx="87" cy="68" rx="6" ry="7" />
            <circle cx="61" cy="66" r="2.2" fill="#ffffff" />
            <circle cx="85" cy="66" r="2.2" fill="#ffffff" />
          </g>
        )}

        {/* Nose & Sweet Mouth */}
        <polygon points="75,76 72,73 78,73" fill="#f43f5e" />
        <path d="M 75 76 Q 70 81 67 78 M 75 76 Q 80 81 83 78" stroke="#431407" strokeWidth="1.8" fill="none" />

        {/* Whiskers */}
        <line x1="52" y1="74" x2="32" y2="70" stroke="#fef08a" strokeWidth="1.5" />
        <line x1="52" y1="78" x2="32" y2="79" stroke="#fef08a" strokeWidth="1.5" />
        <line x1="98" y1="74" x2="118" y2="70" stroke="#fef08a" strokeWidth="1.5" />
        <line x1="98" y1="78" x2="118" y2="79" stroke="#fef08a" strokeWidth="1.5" />

        {/* Front Paws (Knocking or Resting) */}
        {isKnocking ? (
          <path d="M 46 118 Q 28 90 38 68" stroke="url(#catFur)" strokeWidth="6" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <ellipse cx="62" cy="146" rx="9" ry="6" fill="#fed7aa" />
            <ellipse cx="88" cy="146" rx="9" ry="6" fill="#fed7aa" />
          </g>
        )}
      </svg>
    );
  };

  // --- C. PUKI (SEVİMLİ TAVŞAN - PROFESYONEL VEKTÖR) ---
  const renderRabbit = () => {
    return (
      <svg
        width={150 * scale}
        height={170 * scale}
        viewBox="0 0 150 170"
        className="filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        <defs>
          <linearGradient id="bunnyFur" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="bunnyVest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Long Soft Ears (One Floppy) */}
        <ellipse cx="58" cy="30" rx="11" ry="30" fill="url(#bunnyFur)" stroke="#cbd5e1" strokeWidth="1.5" transform="rotate(-10 58 30)" />
        <ellipse cx="58" cy="30" rx="5.5" ry="20" fill="#fbcfe8" transform="rotate(-10 58 30)" />

        <ellipse cx="94" cy="34" rx="11" ry="28" fill="url(#bunnyFur)" stroke="#cbd5e1" strokeWidth="1.5" transform="rotate(15 94 34)" />
        <ellipse cx="94" cy="34" rx="5.5" ry="18" fill="#fbcfe8" transform="rotate(15 94 34)" />

        {/* Fluffy Round Tail */}
        <circle cx="118" cy="132" r="13" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Body with Thermal Vest */}
        <ellipse cx="75" cy="122" rx="38" ry="30" fill="url(#bunnyFur)" />
        <path d="M 44 110 Q 75 106 106 110 L 102 144 Q 75 148 48 144 Z" fill="url(#bunnyVest)" />
        <circle cx="75" cy="126" r="6" fill="#f59e0b" />
        <path d="M 75 122 Q 77 125 75 128" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Head */}
        <circle cx="75" cy="74" r="31" fill="url(#bunnyFur)" stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Blush */}
        <circle cx="56" cy="82" r="6.5" fill="#fce7f3" />
        <circle cx="94" cy="82" r="6.5" fill="#fce7f3" />

        {/* Eyes */}
        {isSleeping ? (
          <g stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 58 74 Q 65 79 72 74" />
            <path d="M 78 74 Q 85 79 92 74" />
          </g>
        ) : isHappy ? (
          <g stroke="#db2777" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 58 76 Q 65 66 72 76" />
            <path d="M 78 76 Q 85 66 92 76" />
          </g>
        ) : (
          <g fill="#0f172a">
            <circle cx="65" cy="74" r="5.5" />
            <circle cx="85" cy="74" r="5.5" />
            <circle cx="63.5" cy="72" r="2" fill="#ffffff" />
            <circle cx="83.5" cy="72" r="2" fill="#ffffff" />
          </g>
        )}

        {/* Heart Nose */}
        <polygon points="75,81 72,78 78,78" fill="#f43f5e" />

        {/* Front Paws */}
        {isKnocking ? (
          <path d="M 46 116 Q 28 88 38 68" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <ellipse cx="60" cy="152" rx="12" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="90" cy="152" rx="12" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}
      </svg>
    );
  };

  // --- D. MERT (ERKEK ASİSTAN - MODERN AKILLI EV YÖNETİCİSİ) ---
  const renderHumanMale = () => {
    return (
      <svg
        width={150 * scale}
        height={170 * scale}
        viewBox="0 0 150 170"
        className="filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        <defs>
          <linearGradient id="maleHair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1c0a00" />
          </linearGradient>
          <linearGradient id="maleSweater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Stylish Hair */}
        <path d="M 44 54 Q 75 22 106 54 Q 112 36 75 28 Q 38 36 44 54 Z" fill="url(#maleHair)" />

        {/* Face */}
        <circle cx="75" cy="64" r="28" fill="#fed7aa" />

        {/* Smart Glowing Wireless Earbud (Right Ear) */}
        <circle cx="103" cy="65" r="3.5" fill="#38bdf8" />

        {/* Eyes */}
        {isSleeping ? (
          <g stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 60 65 Q 67 70 72 65" />
            <path d="M 78 65 Q 83 70 90 65" />
          </g>
        ) : isHappy ? (
          <g stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 60 67 Q 66 59 72 67" />
            <path d="M 78 67 Q 84 59 90 67" />
          </g>
        ) : (
          <g fill="#1e293b">
            <circle cx="66" cy="64" r="4" />
            <circle cx="84" cy="64" r="4" />
            <circle cx="65" cy="62.5" r="1.5" fill="#ffffff" />
            <circle cx="83" cy="62.5" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Smile */}
        <path d="M 70 74 Q 75 80 80 74" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Cozy Knit Sweater */}
        <path d="M 38 95 Q 75 90 112 95 L 118 152 Q 75 158 32 152 Z" fill="url(#maleSweater)" />
        <path d="M 60 93 Q 75 104 90 93" stroke="#f8fafc" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Hands */}
        {isKnocking ? (
          <path d="M 38 108 Q 18 84 28 64" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <rect x="52" y="152" width="16" height="18" rx="4" fill="#0f172a" />
            <rect x="82" y="152" width="16" height="18" rx="4" fill="#0f172a" />
          </g>
        )}
      </svg>
    );
  };

  // --- E. ELA (KADIN ASİSTAN - MODERN AKILLI EV MİMARI) ---
  const renderHumanFemale = () => {
    return (
      <svg
        width={150 * scale}
        height={170 * scale}
        viewBox="0 0 150 170"
        className="filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        <defs>
          <linearGradient id="femaleHair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#291003" />
          </linearGradient>
          <linearGradient id="femaleSweater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>
        </defs>

        {/* Bob Haircut with Soft Curls */}
        <path d="M 40 52 Q 75 20 110 52 Q 118 78 112 92 Q 104 70 102 55 Q 75 42 48 55 Q 46 70 38 92 Q 32 78 40 52 Z" fill="url(#femaleHair)" />

        {/* Face */}
        <circle cx="75" cy="64" r="27" fill="#fed7aa" />

        {/* Hair bangs */}
        <path d="M 50 48 Q 75 58 100 46" stroke="url(#femaleHair)" strokeWidth="6" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <circle cx="58" cy="72" r="5" fill="#fca5a5" opacity="0.6" />
        <circle cx="92" cy="72" r="5" fill="#fca5a5" opacity="0.6" />

        {/* Eyes */}
        {isSleeping ? (
          <g stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 60 65 Q 67 70 72 65" />
            <path d="M 78 65 Q 83 70 90 65" />
          </g>
        ) : isHappy ? (
          <g stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 60 67 Q 66 59 72 67" />
            <path d="M 78 67 Q 84 59 90 67" />
          </g>
        ) : (
          <g fill="#1e293b">
            <circle cx="66" cy="64" r="4" />
            <circle cx="84" cy="64" r="4" />
            <circle cx="64.5" cy="62" r="1.5" fill="#ffffff" />
            <circle cx="82.5" cy="62" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Confident Friendly Smile */}
        <path d="M 71 74 Q 75 79 79 74" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Oversized Cowl Neck Sweater */}
        <path d="M 38 95 Q 75 90 112 95 L 118 152 Q 75 158 32 152 Z" fill="url(#femaleSweater)" />
        <ellipse cx="75" cy="95" rx="20" ry="8" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1" />

        {/* Hands */}
        {isKnocking ? (
          <path d="M 38 108 Q 18 84 28 64" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <rect x="54" y="152" width="14" height="18" rx="4" fill="#1e1b4b" />
            <rect x="82" y="152" width="14" height="18" rx="4" fill="#1e1b4b" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      onClick={handleInteraction}
      className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-300 ${
        isKnocking ? 'scale-105' : ''
      } ${className}`}
    >
      {/* ── SPEECH BUBBLE ── */}
      {speechText && (
        <div className="absolute -top-14 z-40 max-w-[260px] px-3.5 py-2 rounded-2xl bg-black/90 backdrop-blur-md border border-white/20 text-white font-medium text-xs text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <p className="leading-snug">{speechText}</p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 border-r border-b border-white/20 rotate-45" />
        </div>
      )}

      {/* ── TOP ACTION OVERLAYS ── */}
      {renderThinkingCloud()}
      {renderGlassKnockEffect()}
      {renderSleepZzz()}

      {/* ── CHARACTER CONTAINER (WITH WALKING & BOBBING MOVEMENT) ── */}
      <div
        className={`relative flex flex-col items-center transition-all ${
          isWalking
            ? 'animate-[mascotWalk_4s_ease-in-out_infinite]'
            : isSleeping
            ? 'animate-[mascotBreathe_3.5s_ease-in-out_infinite]'
            : 'animate-[mascotFloat_4s_ease-in-out_infinite]'
        }`}
      >
        {type === 'cat'
          ? renderCat()
          : type === 'rabbit'
          ? renderRabbit()
          : type === 'human_male'
          ? renderHumanMale()
          : type === 'human_female'
          ? renderHumanFemale()
          : renderTermoBot()}

        {/* ── FRONT OPEN BOOK (IF READING) ── */}
        {renderNaturalBook()}
      </div>

      {/* Global Embedded Keyframes for Fluid Walking, Breathing & Knocking */}
      <style>{`
        @keyframes mascotWalk {
          0% { transform: translateX(-35px) rotate(-3deg) translateY(0); }
          25% { transform: translateX(-15px) rotate(2deg) translateY(-6px); }
          50% { transform: translateX(35px) rotate(3deg) translateY(0); }
          75% { transform: translateX(10px) rotate(-2deg) translateY(-6px); }
          100% { transform: translateX(-35px) rotate(-3deg) translateY(0); }
        }
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes mascotBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97) translateY(2px); }
        }
      `}</style>
    </div>
  );
};
