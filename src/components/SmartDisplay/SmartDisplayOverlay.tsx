import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sun,
  CloudRain,
  CloudSnow,
  Cloud,
  Flame,
  Moon,
  Clock,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
} from 'lucide-react';
import type { SmartDisplayConfig } from '../../types/smartDisplay.ts';
import type { CurrentWeather, WeatherCondition } from '../../utils/weather.ts';
import { AmbientVisualCanvas } from './AmbientVisualCanvas.tsx';
import { ambientAudio } from '../../utils/ambientAudio.ts';

interface SmartDisplayOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: SmartDisplayConfig;
  onUpdateConfig: (newConfig: Partial<SmartDisplayConfig>) => void;
  currentTemp: number;
  targetTemp: number;
  isKombiActive: boolean;
  weather: CurrentWeather;
  onSetTargetTemp: (temp: number) => void;
}

export const SmartDisplayOverlay: React.FC<SmartDisplayOverlayProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  currentTemp,
  targetTemp,
  isKombiActive,
  weather,
  onSetTargetTemp,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSleeping, setIsSleeping] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [pixelOffset, setPixelOffset] = useState({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(config.audioTrack === 'none');

  const controlsTimeoutRef = useRef<any>(null);
  const sleepTimeoutRef = useRef<any>(null);

  // Live Clock (1 second interval)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Slideshow timer
  useEffect(() => {
    if (!isOpen || config.mode !== 'slideshow') return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => prev + 1);
    }, config.slideshowIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isOpen, config.mode, config.slideshowIntervalSec]);

  // OLED Burn-in pixel protection (shifts clock 2-4px every 60s)
  useEffect(() => {
    if (!isOpen || !config.burnInProtection) return;
    const interval = setInterval(() => {
      setPixelOffset({
        x: Math.floor(Math.random() * 8) - 4,
        y: Math.floor(Math.random() * 8) - 4,
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isOpen, config.burnInProtection]);

  // Ambient Audio Player
  useEffect(() => {
    if (!isOpen) {
      ambientAudio.stop();
      return;
    }

    if (config.audioTrack !== 'none' && !isMuted) {
      ambientAudio.playTrack(config.audioTrack, config.audioVolume, config.customAudioUrl);
    } else {
      ambientAudio.stop();
    }

    return () => {
      ambientAudio.stop();
    };
  }, [isOpen, config.audioTrack, config.audioVolume, config.customAudioUrl, isMuted]);

  // Screen Sleep Timer
  const resetSleepTimer = () => {
    setIsSleeping(false);
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (config.sleepTimeoutMin > 0) {
      sleepTimeoutRef.current = setTimeout(() => {
        setIsSleeping(true);
      }, config.sleepTimeoutMin * 60 * 1000);
    }
  };

  // Activity handler: show controls briefly, then hide
  const handleUserActivity = () => {
    resetSleepTimer();
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 4500);
  };

  useEffect(() => {
    if (!isOpen) return;
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
  }, [isOpen, config.sleepTimeoutMin]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // Format time (HH:MM:SS) and date
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const dateStr = currentTime.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Animated weather icon
  const renderWeatherIcon = () => {
    const condition = weather.condition || 'partly_cloudy';
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return (
        <div className="relative">
          <CloudRain className="w-9 h-9 text-blue-400 animate-bounce duration-1000" />
        </div>
      );
    }
    if (condition.includes('snow')) {
      return (
        <div className="relative">
          <CloudSnow className="w-9 h-9 text-cyan-200 animate-pulse duration-1000" />
        </div>
      );
    }
    if (condition.includes('cloud')) {
      return (
        <div className="relative">
          <Cloud className="w-9 h-9 text-slate-300 animate-pulse" />
        </div>
      );
    }
    return (
      <div className="relative">
        <Sun className="w-9 h-9 text-amber-400 animate-spin duration-[12000ms]" />
      </div>
    );
  };

  // Brightness overlay darkness (100% -> 0 overlay, 10% -> 0.9 overlay)
  const darknessOpacity = Math.max(0, Math.min(0.9, (100 - config.brightnessPercent) / 100));

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black select-none overflow-hidden cursor-pointer"
      onClick={handleUserActivity}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      style={{
        filter: `brightness(${Math.max(10, Math.min(100, config.brightnessPercent || 85))}%)`,
        transition: 'filter 0.25s ease-out',
      }}
    >
      {/* Visual Canvas / Background / Photos / Video */}
      <AmbientVisualCanvas
        mode={config.mode}
        theme={config.presetTheme}
        customImageUrl={config.customImageUrl}
        customVideoUrl={config.customVideoUrl}
        slideIntervalSec={config.slideshowIntervalSec}
        slideTransition={config.slideTransition}
        slideIndex={slideIndex}
      />

      {/* Screen Sleep Dark Layer (if inactive & timeout reached) */}
      {isSleeping && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-700">
          <Moon className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
          <p className="text-slate-500 text-xs font-mono tracking-wider">
            Uyku Modu • Ekrana Dokunarak Uyandırın
          </p>
        </div>
      )}

      {/* ── ALWAYS-ON DISPLAY & AMBIENT HUD LAYER ── */}
      <div
        className="relative z-20 w-full h-full p-6 sm:p-10 flex flex-col justify-between text-white pointer-events-none"
        style={{
          transform: `translate(${pixelOffset.x}px, ${pixelOffset.y}px)`,
          transition: 'transform 1s ease-in-out',
        }}
      >
        {/* TOP BAR: Room details on Left, Weather Badge on Right */}
        <div className="flex items-start justify-between">
          {/* Left: Device & Ambient status */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
              <Flame
                className={`w-6 h-6 ${
                  isKombiActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                }`}
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-md">
                Kombi3D Akıllı Termostat
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300 drop-shadow">
                <span>Oturma Odası</span>
                <span>•</span>
                <span
                  className={
                    isKombiActive
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {isKombiActive
                    ? `🔥 Aktif Ateşleme (${targetTemp}°C)`
                    : '❄️ Bekleme Modu'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Weather Animation & Temperature Badge (User requested) */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl">
            {renderWeatherIcon()}
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-white">
                {weather.temp ?? 14}°C
              </div>
              <div className="text-[11px] font-semibold text-slate-300 capitalize truncate max-w-[130px]">
                {weather.cityName || 'Ankara'} • {weather.conditionText || 'Parçalı Bulutlu'}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER / MAIN: Large Modern Digital Clock & Date */}
        <div className="my-auto flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline font-mono tracking-tight font-black drop-shadow-2xl text-white">
            <span className="text-7xl sm:text-9xl md:text-[11rem] leading-none">
              {hours}:{minutes}
            </span>
            <span className="text-2xl sm:text-4xl text-slate-400 font-bold ml-2 sm:ml-4">
              {seconds}
            </span>
          </div>

          <p className="mt-3 sm:mt-5 text-sm sm:text-xl font-medium tracking-widest text-slate-300 uppercase drop-shadow-md">
            {dateStr}
          </p>

          {/* Quick Temperature Capsule */}
          <div className="mt-6 flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Oda:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {currentTemp}°C
              </span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hedef:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetTargetTemp(Math.max(10, +(targetTemp - 0.5).toFixed(1)));
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                title="Hedef Sıcaklığı Azalt"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-bold font-mono text-amber-400">
                {targetTemp}°C
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetTargetTemp(Math.min(32, +(targetTemp + 0.5).toFixed(1)));
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                title="Hedef Sıcaklığı Artır"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM HUD / FLOATING CONTROLS (Fades away after 4s inactivity) */}
        <div
          className={`flex items-center justify-between transition-opacity duration-500 ${
            isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Left: Mode Badge & Quick Preset Switch */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {config.mode === 'aod'
                ? 'Always-On Display'
                : config.mode === 'slideshow'
                ? 'Slayt Gösterisi'
                : config.mode === 'video_audio_muted_mp3'
                ? 'Sessiz Video + Müzik'
                : 'Canlı Ambiyans'}
            </span>
          </div>

          {/* Right: Interactive Toolbar (Mute, Brightness, Fullscreen, Exit) */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl px-3 py-2 rounded-2xl border border-white/20 shadow-2xl">
            {/* Interactive Brightness Slider */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-white/5 rounded-xl border border-white/10"
              title={`Ekran Aydınlığı: %${config.brightnessPercent || 85}`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.brightnessPercent || 85}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateConfig({ brightnessPercent: Number(e.target.value) });
                }}
                className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1 rounded-lg"
              />
              <span className="font-mono text-[10px] w-7 text-right">%{config.brightnessPercent || 85}</span>
            </div>

            {/* Mute / Unmute Audio */}
            {config.audioTrack !== 'none' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap (Kiosk)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close / Return to Normal App */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Ambiyans modunu kapat ve termostata dön"
            >
              <X className="w-4 h-4" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
