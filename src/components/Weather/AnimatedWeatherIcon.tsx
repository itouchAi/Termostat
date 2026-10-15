import React from 'react';
import type { WeatherCondition } from '../../utils/weather.ts';

interface AnimatedWeatherIconProps {
  condition: WeatherCondition;
  className?: string;
  size?: number;
}

export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
  condition,
  className = 'w-10 h-10',
  size = 40,
}) => {
  switch (condition) {
    case 'sunny':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Güneşli"
        >
          {/* Animated Sun Rays */}
          <g className="animate-[spin_12s_linear_infinite] origin-center">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="32"
                y1="10"
                x2="32"
                y2="4"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 32 32)`}
              />
            ))}
          </g>
          {/* Center Glowing Sun Disk with breathing pulse */}
          <circle
            cx="32"
            cy="32"
            r="14"
            fill="url(#sunGrad)"
            className="animate-pulse"
          />
          <defs>
            <radialGradient id="sunGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'partly_cloudy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Parçalı Bulutlu"
        >
          <defs>
            <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <radialGradient id="sunGradSmall" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
          </defs>
          {/* Sun peeking from top-right */}
          <g className="animate-[spin_16s_linear_infinite] origin-[42px_22px]">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={angle}
                x1="42"
                y1="8"
                x2="42"
                y2="4"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 42 22)`}
              />
            ))}
            <circle cx="42" cy="22" r="10" fill="url(#sunGradSmall)" />
          </g>
          {/* Drifting Front Cloud */}
          <path
            d="M 18 48 A 12 12 0 0 1 30 36 A 14 14 0 0 1 52 40 A 10 10 0 0 1 48 52 L 18 52 A 4 4 0 0 1 18 48 Z"
            fill="url(#cloudGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            className="animate-[bounce_4s_ease-in-out_infinite]"
          />
        </svg>
      );

    case 'cloudy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Bulutlu"
        >
          <defs>
            <linearGradient id="cloudDarkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          {/* Back Cloud */}
          <path
            d="M 24 38 A 10 10 0 0 1 36 28 A 12 12 0 0 1 54 32 A 8 8 0 0 1 50 42 L 24 42 Z"
            fill="#cbd5e1"
            opacity="0.8"
            className="animate-[pulse_3s_ease-in-out_infinite]"
          />
          {/* Front Cloud */}
          <path
            d="M 14 48 A 11 11 0 0 1 26 36 A 14 14 0 0 1 48 40 A 10 10 0 0 1 44 52 L 14 52 Z"
            fill="url(#cloudDarkGrad)"
            stroke="#64748b"
            strokeWidth="1.5"
            className="animate-[bounce_3s_ease-in-out_infinite]"
          />
        </svg>
      );

    case 'rainy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Yağmurlu"
        >
          <defs>
            <linearGradient id="rainCloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Cloud */}
          <path
            d="M 16 38 A 10 10 0 0 1 28 26 A 13 13 0 0 1 48 30 A 9 9 0 0 1 44 42 L 16 42 Z"
            fill="url(#rainCloud)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Raindrops with falling keyframe animation */}
          <g stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="46" x2="19" y2="54" className="animate-[pulse_1s_infinite]" />
            <line x1="32" y1="46" x2="29" y2="56" className="animate-[pulse_1.2s_infinite_200ms]" />
            <line x1="42" y1="46" x2="39" y2="54" className="animate-[pulse_0.9s_infinite_400ms]" />
          </g>
        </svg>
      );

    case 'snowy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Karlı"
        >
          <defs>
            <linearGradient id="snowCloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path
            d="M 16 36 A 10 10 0 0 1 28 24 A 13 13 0 0 1 48 28 A 9 9 0 0 1 44 40 L 16 40 Z"
            fill="url(#snowCloud)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Animated Snowflakes */}
          <g fill="#38bdf8" className="animate-spin origin-[32px_50px]">
            <circle cx="22" cy="48" r="2" />
            <circle cx="32" cy="54" r="2.5" />
            <circle cx="42" cy="48" r="2" />
          </g>
        </svg>
      );

    case 'fog':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Sisli"
        >
          <g stroke="#94a3b8" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="24" x2="52" y2="24" className="animate-[pulse_2s_ease-in-out_infinite]" />
            <line x1="18" y1="32" x2="46" y2="32" className="animate-[pulse_2.5s_ease-in-out_infinite_300ms]" />
            <line x1="14" y1="40" x2="50" y2="40" className="animate-[pulse_2.2s_ease-in-out_infinite_600ms]" />
          </g>
        </svg>
      );

    case 'thunder':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className={`${className} overflow-visible`}
          aria-label="Fırtına"
        >
          <defs>
            <linearGradient id="stormCloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <path
            d="M 16 36 A 10 10 0 0 1 28 24 A 13 13 0 0 1 48 28 A 9 9 0 0 1 44 40 L 16 40 Z"
            fill="url(#stormCloud)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          {/* Flashing Lightning bolt */}
          <polygon
            points="32,38 24,50 31,50 28,60 40,46 33,46"
            fill="#eab308"
            className="animate-pulse"
          />
        </svg>
      );
  }
};
