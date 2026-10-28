import React, { useState, useEffect, useRef } from 'react';
import type { MascotState } from '../../types/mascot.ts';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface TermoBotMascotProps {
  state?: MascotState;
  themeMode?: ThemeMode;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onWakeScreen?: () => void;
  className?: string;
}

export const TermoBotMascot: React.FC<TermoBotMascotProps> = ({
  state: controlledState,
  themeMode = 'glass',
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
  size = 'md',
  interactive = true,
  onWakeScreen,
  className = '',
}) => {
  // Autonomous state machine if state prop is not controlled
  const [internalState, setInternalState] = useState<MascotState>('idle');
  const activeState = controlledState ?? internalState;

  const [speechText, setSpeechText] = useState<string | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Theme palettes for the robot
  const isTactile = themeMode === 'tactile_deck';
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';

  // Primary colors
  const primaryChassis = isTactile
    ? '#2a2436'
    : isObsidian
    ? '#1c172e'
    : isGlass
    ? '#1e293b'
    : '#1e293b';

  const secondaryAccent = isTactile
    ? '#f59e0b'
    : isObsidian
    ? '#a855f7'
    : isGlass
    ? '#38bdf8'
    : '#3b82f6';

  const eyeColor = isTactile
    ? '#fbbf24'
    : isObsidian
    ? '#c084fc'
    : isKombiActive
    ? '#f97316'
    : '#38bdf8';

  const visorBg = isTactile
    ? '#14111d'
    : isObsidian
    ? '#0c0a15'
    : '#090d16';

  // Dimensions based on size prop
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : 1.0;
  const baseWidth = Math.round(140 * scale);
  const baseHeight = Math.round(150 * scale);

  // Eye blinking cycle
  useEffect(() => {
    if (activeState === 'sleeping') return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [activeState]);

  // Autonomous state transitions if not controlled
  useEffect(() => {
    if (controlledState !== undefined) return;

    let timeout: NodeJS.Timeout;
    if (internalState === 'idle') {
      // After 20-30s idle, switch to reading
      timeout = setTimeout(() => {
        setInternalState('reading');
      }, 25000);
    } else if (internalState === 'reading') {
      // After 35-45s reading, fall asleep
      timeout = setTimeout(() => {
        setInternalState('sleeping');
      }, 35000);
    } else if (internalState === 'happy') {
      // Happy reaction decays back to idle in 4.5s
      timeout = setTimeout(() => {
        setInternalState('idle');
      }, 4500);
    }
    return () => clearTimeout(timeout);
  }, [controlledState, internalState]);

  // Handle interaction / click
  const handleBotClick = () => {
    if (!interactive) return;
    triggerHaptic('medium');

    if (activeState === 'sleeping' || activeState === 'reading') {
      // Wake up with joy
      setInternalState('happy');
      const messages = [
        `Uykum vardı ama sesini duydum! ☀️ Oda ${currentTemp.toFixed(1)}°C, hedef ${targetTemp.toFixed(1)}°C.`,
        isKombiActive
          ? `Kombi aktif alevde! Sıcacık yapıyorum, merak etme 🔥`
          : `Oda sıcaklığı çok dengeli (${currentTemp.toFixed(1)}°C), beklemedeyim! ❄️`,
        `Kitabımı bırakıp geldim! Termostat canavar modunda çalışıyor 🚀`,
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setSpeechText(randomMsg);
    } else {
      // Happy bump
      setInternalState('happy');
      const greetings = [
        `Merhaba! TermoBot senin için 24 saat nöbette 🤖✨`,
        `Gıdıkladın! Oda sıcaklığı tam ${currentTemp.toFixed(1)}°C 💛`,
        isKombiActive
          ? `Ateşleme süresi devam ediyor, petekler sıcacık! 🔥`
          : `Tasarruf modundayız, her şey kontrolüm altında! ⚡`,
      ];
      setSpeechText(greetings[Math.floor(Math.random() * greetings.length)]);
    }

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => {
      setSpeechText(null);
    }, 4500);

    onWakeScreen?.();
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={handleBotClick}
      title={interactive ? 'TermoBot ile etkileşime geçmek için dokunun!' : undefined}
    >
      {/* ── SPEECH BUBBLE ── */}
      {speechText && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 w-52 sm:w-60 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className={`px-3 py-2 rounded-2xl border text-[11px] font-semibold leading-tight shadow-xl flex items-center gap-2 backdrop-blur-xl ${
              isTactile
                ? 'bg-[#1e1a2c]/95 border-amber-500/50 text-amber-200 shadow-[0_8px_25px_rgba(0,0,0,0.8)]'
                : isObsidian
                ? 'bg-[#181329]/95 border-purple-500/50 text-purple-200 shadow-[0_8px_25px_rgba(0,0,0,0.8)]'
                : 'bg-slate-900/95 border-sky-400/50 text-sky-100 shadow-[0_8px_25px_rgba(0,0,0,0.7)]'
            }`}
          >
            <span>💬</span>
            <p className="flex-1">{speechText}</p>
          </div>
          {/* Bubble tail */}
          <div className="w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 border-r border-b border-inherit bg-inherit" />
        </div>
      )}

      {/* ── SLEEPING ZZZ ANIMATION ── */}
      {activeState === 'sleeping' && (
        <div className="absolute -top-6 right-2 flex flex-col items-end pointer-events-none">
          <span className="text-xs font-black text-sky-300 animate-bounce delay-100 font-mono">z</span>
          <span className="text-sm font-black text-indigo-300 animate-pulse delay-200 font-mono -mt-1 mr-2">Z</span>
          <span className="text-base font-black text-purple-300 animate-bounce delay-300 font-mono -mt-1 mr-4">Z</span>
        </div>
      )}

      {/* ── ROBOT SVG ILLUSTRATION ── */}
      <svg
        width={baseWidth}
        height={baseHeight}
        viewBox="0 0 140 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 ${
          activeState === 'happy'
            ? 'scale-110 -translate-y-2'
            : activeState === 'sleeping'
            ? 'scale-95 translate-y-1'
            : 'group-hover:scale-105'
        }`}
      >
        <defs>
          {/* Chassis Metallic Gradient */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isTactile ? '#3b334a' : isObsidian ? '#2a2245' : '#334155'} />
            <stop offset="60%" stopColor={primaryChassis} />
            <stop offset="100%" stopColor={isTactile ? '#1c1826' : isObsidian ? '#120e21' : '#0f172a'} />
          </linearGradient>

          {/* Visor Screen Gradient */}
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={visorBg} />
            <stop offset="100%" stopColor="#05070d" />
          </linearGradient>

          {/* Accent Neon Gradient */}
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={secondaryAccent} />
            <stop offset="100%" stopColor={isKombiActive ? '#ea580c' : eyeColor} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── BASE TRACKS / FEET ── */}
        <g id="feet">
          {/* Left Track */}
          <rect
            x="34"
            y="126"
            width="28"
            height="14"
            rx="7"
            fill={isTactile ? '#1f1a29' : '#0f172a'}
            stroke={secondaryAccent}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <circle cx="41" cy="133" r="3" fill="#64748b" opacity="0.6" />
          <circle cx="55" cy="133" r="3" fill="#64748b" opacity="0.6" />

          {/* Right Track */}
          <rect
            x="78"
            y="126"
            width="28"
            height="14"
            rx="7"
            fill={isTactile ? '#1f1a29' : '#0f172a'}
            stroke={secondaryAccent}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <circle cx="85" cy="133" r="3" fill="#64748b" opacity="0.6" />
          <circle cx="99" cy="133" r="3" fill="#64748b" opacity="0.6" />
        </g>

        {/* ── ROBOT BODY / TORSO ── */}
        <g id="torso">
          {/* Main Body Shell */}
          <rect
            x="36"
            y="76"
            width="68"
            height="52"
            rx="16"
            fill="url(#chassisGrad)"
            stroke={isTactile ? 'rgba(245,158,11,0.4)' : isObsidian ? 'rgba(168,85,247,0.4)' : 'rgba(56,189,248,0.4)'}
            strokeWidth="1.5"
          />

          {/* Torso Display Badge / Heart Indicator */}
          <rect
            x="48"
            y="88"
            width="44"
            height="26"
            rx="8"
            fill={visorBg}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Kombi Flame or Energy Pulse Core */}
          {isKombiActive ? (
            <path
              d="M70 94 C67 98 64 100 64 104 C64 108 67 110 70 110 C73 110 76 108 76 104 C76 100 73 98 70 94 Z"
              fill="#f97316"
              filter="url(#neonGlow)"
            />
          ) : (
            <g>
              {/* EKG / Power Sine Wave */}
              <path
                d="M52 101 L58 101 L62 94 L66 108 L70 98 L74 103 L80 101 L88 101"
                stroke={eyeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              />
            </g>
          )}

          {/* Rivets on Body Corners */}
          <circle cx="43" cy="83" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
          <circle cx="97" cy="83" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
          <circle cx="43" cy="121" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
          <circle cx="97" cy="121" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
        </g>

        {/* ── ROBOT ARMS ── */}
        <g id="arms">
          {activeState === 'reading' ? (
            /* Holding Book in Hands */
            <g id="readingArms">
              {/* Left Arm to Book */}
              <path d="M36 90 Q44 102 54 104" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />
              {/* Right Arm to Book */}
              <path d="M104 90 Q96 102 86 104" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />

              {/* The Tiny Book / Tablet */}
              <g transform="translate(50, 96)">
                {/* Book Cover */}
                <rect x="0" y="0" width="40" height="24" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                {/* Pages */}
                <rect x="2" y="2" width="17" height="20" rx="1" fill="#f8fafc" />
                <rect x="21" y="2" width="17" height="20" rx="1" fill="#f8fafc" />
                {/* Text lines */}
                <line x1="5" y1="6" x2="16" y2="6" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                <line x1="5" y1="10" x2="14" y2="10" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                <line x1="5" y1="14" x2="16" y2="14" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                <line x1="24" y1="6" x2="35" y2="6" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                <line x1="24" y1="10" x2="32" y2="10" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                <line x1="24" y1="14" x2="35" y2="14" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
                {/* Center fold */}
                <line x1="20" y1="2" x2="20" y2="22" stroke="#64748b" strokeWidth="1" />
              </g>
            </g>
          ) : activeState === 'happy' ? (
            /* Waving Arms Up in Joy */
            <g id="happyArms">
              {/* Left Arm Wave Up */}
              <path d="M36 86 Q20 72 24 58" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="24" cy="58" r="4.5" fill={secondaryAccent} />
              {/* Right Arm Wave Up */}
              <path d="M104 86 Q120 72 116 58" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="116" cy="58" r="4.5" fill={secondaryAccent} />
            </g>
          ) : (
            /* Normal Resting Arms */
            <g id="normalArms">
              {/* Left Arm */}
              <path d="M36 86 Q24 96 26 112" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="26" cy="112" r="4" fill={secondaryAccent} opacity="0.8" />
              {/* Right Arm */}
              <path d="M104 86 Q116 96 114 112" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="114" cy="112" r="4" fill={secondaryAccent} opacity="0.8" />
            </g>
          )}
        </g>

        {/* ── ROBOT HEAD & ANTENNA ── */}
        <g
          id="head"
          className="transition-transform duration-500"
          style={{
            transformOrigin: '70px 50px',
            transform:
              activeState === 'sleeping'
                ? 'rotate(-8deg) translate(-2px, 3px)'
                : activeState === 'reading'
                ? 'rotate(4deg) translate(0px, 2px)'
                : 'none',
          }}
        >
          {/* Antenna Stem */}
          <line x1="70" y1="22" x2="70" y2="10" stroke={secondaryAccent} strokeWidth="3" strokeLinecap="round" />
          {/* Antenna Glowing Orb */}
          <circle
            cx="70"
            cy="7"
            r="5.5"
            fill={isKombiActive ? '#ea580c' : secondaryAccent}
            filter="url(#neonGlow)"
          />

          {/* Left Ear Antenna Nub */}
          <rect x="22" y="38" width="6" height="12" rx="3" fill={secondaryAccent} opacity="0.7" />
          {/* Right Ear Antenna Nub */}
          <rect x="112" y="38" width="6" height="12" rx="3" fill={secondaryAccent} opacity="0.7" />

          {/* Neck Joint */}
          <rect x="62" y="68" width="16" height="10" rx="3" fill="#1e293b" />

          {/* Main Head Chassis Box */}
          <rect
            x="26"
            y="20"
            width="88"
            height="52"
            rx="18"
            fill="url(#chassisGrad)"
            stroke={isTactile ? 'rgba(245,158,11,0.5)' : isObsidian ? 'rgba(168,85,247,0.5)' : 'rgba(56,189,248,0.5)'}
            strokeWidth="1.8"
          />

          {/* Digital Visor OLED Screen */}
          <rect
            x="34"
            y="28"
            width="72"
            height="36"
            rx="12"
            fill="url(#visorGrad)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* ── VISOR DIGITAL EYES ── */}
          <g id="eyes">
            {activeState === 'sleeping' ? (
              /* Sleeping Calm Curves (— —) */
              <g>
                <path d="M48 48 Q55 52 62 48" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M78 48 Q85 52 92 48" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            ) : activeState === 'happy' ? (
              /* Joyful Smiling Eyes (^ ^) */
              <g>
                <path d="M48 49 Q55 41 62 49" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#neonGlow)" />
                <path d="M78 49 Q85 41 92 49" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#neonGlow)" />
                {/* Cheerful Blush Dots */}
                <circle cx="43" cy="52" r="3" fill="#f43f5e" opacity="0.65" />
                <circle cx="97" cy="52" r="3" fill="#f43f5e" opacity="0.65" />
              </g>
            ) : activeState === 'reading' ? (
              /* Focused Reading Eyes Looking Down */
              <g>
                <ellipse cx="55" cy="48" rx="6" ry="5" fill={eyeColor} filter="url(#neonGlow)" />
                <ellipse cx="85" cy="48" rx="6" ry="5" fill={eyeColor} filter="url(#neonGlow)" />
                <circle cx="56" cy="49" r="2" fill="#ffffff" />
                <circle cx="86" cy="49" r="2" fill="#ffffff" />
              </g>
            ) : isBlinking ? (
              /* Blinking Horizontal Slits */
              <g>
                <line x1="48" y1="46" x2="62" y2="46" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="78" y1="46" x2="92" y2="46" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              /* Normal Round Glowing Eyes */
              <g>
                <ellipse cx="55" cy="46" rx="7" ry="8" fill={eyeColor} filter="url(#neonGlow)" />
                <ellipse cx="85" cy="46" rx="7" ry="8" fill={eyeColor} filter="url(#neonGlow)" />
                {/* Specular Pupils */}
                <circle cx="57" cy="43" r="2.5" fill="#ffffff" />
                <circle cx="87" cy="43" r="2.5" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* Little Corner Rivets on Head */}
          <circle cx="33" cy="27" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
          <circle cx="107" cy="27" r="1.5" fill={isTactile ? '#f59e0b' : '#94a3b8'} opacity="0.5" />
        </g>
      </svg>

      {/* Mascot Name Pill Badge underneath */}
      <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] font-bold text-white/80 shadow-xs">
        <span
          className="w-1.5 h-1.5 rounded-full animate-ping"
          style={{ backgroundColor: eyeColor }}
        />
        <span>TermoBot</span>
        <span className="text-[9px] text-white/50 font-normal">
          {activeState === 'reading'
            ? '📖 Okuyor'
            : activeState === 'sleeping'
            ? '💤 Uyuyor'
            : activeState === 'happy'
            ? '✨ Neşeli'
            : '🟢 Hazır'}
        </span>
      </div>
    </div>
  );
};
