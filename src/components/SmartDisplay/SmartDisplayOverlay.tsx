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
  Music,
  Plus,
  Minus,
  Paintbrush,
} from 'lucide-react';
import type { SmartDisplayConfig } from '../../types/smartDisplay.ts';
import type { CurrentWeather } from '../../utils/weather.ts';
import type { ThemeMode } from '../../types.ts';
import { AmbientVisualCanvas } from './AmbientVisualCanvas.tsx';
import { ambientAudio } from '../../utils/ambientAudio.ts';
import { MusicEqualizer } from './MusicEqualizer.tsx';
import { LuxuryMediaBar } from './LuxuryMediaBar.tsx';
import { ThermostatTouchDialModal } from './ThermostatTouchDialModal.tsx';
import { SmartDisplayControlsPill } from './SmartDisplayControlsPill.tsx';
import { triggerHaptic } from '../../utils/haptics.ts';

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
  themeMode?: ThemeMode;
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
  themeMode = 'glass',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isThermostatWheelOpen, setIsThermostatWheelOpen] = useState(false);
  const [isThermostatClosing, setIsThermostatClosing] = useState(false);
  const [isCleanScreen, setIsCleanScreen] = useState(false);
  const [activeBottomPill, setActiveBottomPill] = useState<'none' | 'media' | 'controls'>('none');

  // Playlist navigation indices
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);

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

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isOpen || config.mode !== 'slideshow' || !isPlaying) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => prev + 1);
    }, config.slideshowIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isOpen, config.mode, config.slideshowIntervalSec, isPlaying]);

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

  // Ambient Audio Player & Multi-Track Playlist Auto-Next
  const currentAudioUrl = useMemo(() => {
    if (config.customAudioTracks && config.customAudioTracks.length > 0) {
      return config.customAudioTracks[activeAudioIndex % config.customAudioTracks.length]?.url;
    }
    return config.customAudioUrl;
  }, [config.customAudioTracks, activeAudioIndex, config.customAudioUrl]);

  useEffect(() => {
    if (!isOpen) {
      ambientAudio.stop();
      return;
    }

    if (config.audioTrack !== 'none' && !isMuted && isPlaying) {
      // Wire auto-advance to next audio track in playlist
      ambientAudio.setOnEnded(() => {
        if (config.customAudioTracks && config.customAudioTracks.length > 1) {
          setActiveAudioIndex((prev) => (prev + 1) % config.customAudioTracks.length);
        }
      });
      ambientAudio.playTrack(config.audioTrack, config.audioVolume, currentAudioUrl);
    } else if (!isPlaying) {
      ambientAudio.pause();
    } else {
      ambientAudio.stop();
    }

    return () => {
      ambientAudio.stop();
    };
  }, [isOpen, config.audioTrack, config.audioVolume, currentAudioUrl, isMuted, isPlaying]);

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
    }, 5500);
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

  // Current playing media metadata for Marquee and Media Bar
  const currentTrackTitle = useMemo(() => {
    if (config.customAudioTracks && config.customAudioTracks.length > 0) {
      const item = config.customAudioTracks[activeAudioIndex % config.customAudioTracks.length];
      return item?.name || 'Özel Parça';
    }
    if (config.audioTrack === 'fireplace') return 'Şömine Çıtırtısı & Sıcak Rezonans';
    if (config.audioTrack === 'rain') return 'Sakin Yağmur & Damla Akustiği';
    if (config.audioTrack === 'lofi') return 'Akustik Lofi Chill Beat';
    if (config.audioTrack === 'relax_piano') return 'Derin Relax Piyano';
    if (config.audioTrack === 'nature') return 'Doğa Kuşları & Dingin Orman';
    if (config.audioTrack === 'custom') return 'Harici MP3 / Radyo Yayını';
    return '';
  }, [config.audioTrack, config.customAudioTracks, activeAudioIndex]);

  const activeMediaInfo = useMemo(() => {
    const isVideo = config.mode === 'video' || config.mode === 'video_audio_muted_mp3';
    if (isVideo) {
      const count = config.customVideos.length;
      const title =
        count > 0
          ? config.customVideos[activeVideoIndex % count]?.name || 'Video'
          : 'Canlı Doğa Videosu';
      return {
        type: 'video' as const,
        title,
        counter: count > 0 ? `Video ${activeVideoIndex + 1} / ${count}` : 'Canlı Video',
      };
    }

    if (config.mode === 'slideshow' || config.mode === 'image') {
      const count = config.customImages.length;
      const title =
        count > 0
          ? config.customImages[slideIndex % count]?.name || 'Görsel'
          : config.presetTheme === 'fireplace'
          ? 'Şömineli Kış Evi'
          : config.presetTheme === 'rainy_window'
          ? 'Yağmurlu Pencere'
          : config.presetTheme === 'winter_snow'
          ? 'Karlı Çam Ormanı'
          : config.presetTheme === 'sunset_forest'
          ? 'Gün Batımı'
          : config.presetTheme === 'aurora'
          ? 'Kutup Işıkları'
          : 'Minimal Dokusu';
      return {
        type: 'image' as const,
        title,
        counter: count > 0 ? `Slayt ${ (slideIndex % count) + 1} / ${count}` : 'Slayt',
      };
    }

    // Default audio or ambient
    return {
      type: 'audio' as const,
      title: currentTrackTitle || 'Ambiyans Modu',
      counter:
        config.customAudioTracks.length > 0
          ? `Parça ${(activeAudioIndex % config.customAudioTracks.length) + 1} / ${
              config.customAudioTracks.length
            }`
          : 'Ortam Sesi',
    };
  }, [
    config.mode,
    config.presetTheme,
    config.customVideos,
    config.customImages,
    config.customAudioTracks,
    activeVideoIndex,
    slideIndex,
    activeAudioIndex,
    currentTrackTitle,
  ]);

  // Playlist Navigation Handlers
  const handlePreviousMedia = () => {
    const isVideo = config.mode === 'video' || config.mode === 'video_audio_muted_mp3';
    if (isVideo && config.customVideos.length > 0) {
      setActiveVideoIndex((prev) =>
        prev === 0 ? config.customVideos.length - 1 : prev - 1
      );
    } else if (
      (config.mode === 'slideshow' || config.mode === 'image') &&
      config.customImages.length > 0
    ) {
      setSlideIndex((prev) => (prev === 0 ? config.customImages.length - 1 : prev - 1));
    } else if (config.customAudioTracks.length > 0) {
      setActiveAudioIndex((prev) =>
        prev === 0 ? config.customAudioTracks.length - 1 : prev - 1
      );
    } else {
      setSlideIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNextMedia = () => {
    const isVideo = config.mode === 'video' || config.mode === 'video_audio_muted_mp3';
    if (isVideo && config.customVideos.length > 0) {
      setActiveVideoIndex((prev) => (prev + 1) % config.customVideos.length);
    } else if (
      (config.mode === 'slideshow' || config.mode === 'image') &&
      config.customImages.length > 0
    ) {
      setSlideIndex((prev) => (prev + 1) % config.customImages.length);
    } else if (config.customAudioTracks.length > 0) {
      setActiveAudioIndex((prev) => (prev + 1) % config.customAudioTracks.length);
    } else {
      setSlideIndex((prev) => prev + 1);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
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
          <CloudRain className="w-8 h-8 sm:w-9 sm:h-9 text-blue-400 animate-bounce duration-1000" />
        </div>
      );
    }
    if (condition.includes('snow')) {
      return (
        <div className="relative">
          <CloudSnow className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-200 animate-pulse duration-1000" />
        </div>
      );
    }
    if (condition.includes('cloud')) {
      return (
        <div className="relative">
          <Cloud className="w-8 h-8 sm:w-9 sm:h-9 text-slate-300 animate-pulse" />
        </div>
      );
    }
    return (
      <div className="relative">
        <Sun className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 animate-spin duration-[12000ms]" />
      </div>
    );
  };

  // Whether MP3 music or equalizer is active
  const isAudioPlaying = config.audioTrack !== 'none' && !isMuted && isPlaying;
  const isEqualizerActive = config.equalizerEnabled && isAudioPlaying;

  // Background blur active during equalizer mode OR when thermostat is actively opened & not closing.
  // When thermostat closes (reverse animation), background smoothly unblurs at the exact same time
  const isThermostatActive = isThermostatWheelOpen && !isThermostatClosing;
  const isBackgroundBlurred = isEqualizerActive || isThermostatActive;

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
        customImages={config.customImages}
        customVideos={config.customVideos}
        activeVideoIndex={activeVideoIndex}
        imageFitMode={config.imageFitMode || 'cover'}
        blurBackground={isBackgroundBlurred}
        slideIntervalSec={config.slideshowIntervalSec}
        slideTransition={config.slideTransition}
        slideIndex={slideIndex}
        isPlaying={isPlaying}
        isLoop={config.isLoop !== false}
        onVideoEnded={handleNextMedia}
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
        className="relative z-20 w-full h-full p-2.5 sm:p-8 md:p-10 flex flex-col justify-between text-white pointer-events-none"
        style={{
          transform: `translate(${pixelOffset.x}px, ${pixelOffset.y}px)`,
          transition: 'transform 1s ease-in-out',
        }}
      >
        {/* ── TOP BAR: Room details on Left, Marquee Now-Playing in Center, Weather on Right (Slides up in clean mode) ── */}
        <div
          className={`w-full flex items-center portrait:justify-center landscape:justify-between gap-2 transition-all duration-700 ease-in-out ${
            isCleanScreen
              ? '-translate-y-36 opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Left: Device & Kombi status (Hidden in portrait dikey mod, visible in landscape yatay mod) */}
          <div className="portrait:hidden landscape:flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
              <Flame
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isKombiActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white drop-shadow-md">
                Kombi3D Akıllı Termostat
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-slate-300 drop-shadow">
                <span>Oturma Odası</span>
                <span>•</span>
                <span className={isKombiActive ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {isKombiActive ? `🔥 Aktif (${targetTemp}°C)` : '❄️ Bekleme'}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Kayan Yazı Şarkı İsmi Barı (Marquee Now-Playing) */}
          {config.showMarqueeTrackTitle && config.audioTrack !== 'none' && !isMuted && (
            <div className="pointer-events-auto hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/70 backdrop-blur-2xl border border-pink-400/30 shadow-[0_0_20px_rgba(244,63,94,0.25)] max-w-xs lg:max-w-md overflow-hidden">
              <div className="relative flex items-center justify-center shrink-0">
                <Music className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              </div>
              <div className="overflow-hidden whitespace-nowrap text-xs font-bold text-pink-100 flex-1 min-w-0">
                <span className="animate-marquee tracking-wide">
                  🎵 Şimdi Çalıyor: {currentTrackTitle || 'Ortam Melodisi'} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; Kombi3D Smart Display &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </div>
          )}

          {/* RIGHT (or CENTER in portrait): Dokun ve Kontrol Et Termostat Butonu + Hava Durumu Çerçevesi */}
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto portrait:mx-auto portrait:justify-center landscape:ml-auto shrink-0">
            {/* Dokun ve Kontrol Et: Termostat Görseli & Tekerlek Açma Butonu */}
            <button
              type="button"
              onPointerDown={() => triggerHaptic('medium')}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                setIsThermostatClosing(false);
                setIsThermostatWheelOpen(true);
              }}
              className="group flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-3xl bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-xl border border-white/15 hover:border-amber-400/50 shadow-2xl transition-all cursor-pointer"
              title="Dokun ve Kontrol Et (5 sn Otomatik Kapanan Termostat Tekerleği)"
            >
              {/* Termostat Dairesel Görsel & Alev Simülasyonu */}
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 p-0.5 shadow-[0_0_14px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                  <Flame
                    className={`w-4 h-4 ${
                      isKombiActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
              <div className="text-left pr-0.5">
                <div className="text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Termostat
                </div>
                <div className="text-sm sm:text-base font-black font-mono text-amber-400 tracking-tight leading-none">
                  {targetTemp.toFixed(1)}°C
                </div>
              </div>
            </button>

            {/* Sağ üstteki derece ve hava durumu çerçevemiz */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl">
              {renderWeatherIcon()}
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-tighter text-white">
                  {weather.temp ?? 14}°C
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300 capitalize truncate max-w-[100px] sm:max-w-[130px]">
                  {weather.cityName || 'Ankara'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER / MAIN: Digital Clock + Equalizer + Temp Capsule ── */}
        {/* Temiz Ekran modunda sağa veya sola uçmadan, yerinde sönerek kaybolur */}
        <div
          className={`my-auto flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out ${
            isCleanScreen
              ? 'opacity-0 scale-95 pointer-events-none'
              : 'opacity-100 scale-100'
          }`}
        >
          {/* Large Clock */}
          <div className="flex items-baseline font-mono tracking-tight font-black drop-shadow-2xl text-white">
            <span className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[11.5rem] leading-none">
              {hours}:{minutes}
            </span>
            <span className="text-xl sm:text-3xl md:text-4xl text-slate-400 font-bold ml-2 sm:ml-4">
              {seconds}
            </span>
          </div>

          <p className="mt-2 sm:mt-4 text-xs sm:text-base md:text-lg font-medium tracking-widest text-slate-300 uppercase drop-shadow-md">
            {dateStr}
          </p>

          {/* Reactive Music Equalizer Visualizer (User requested: no label text, blurs out in clean screen mode) */}
          {isEqualizerActive && (
            <div
              className={`mt-3 pointer-events-auto w-full flex flex-col items-center justify-center transition-all duration-700 ${
                isCleanScreen
                  ? 'opacity-0 blur-md pointer-events-none'
                  : 'opacity-100 blur-none'
              }`}
            >
              <MusicEqualizer
                enabled={config.equalizerEnabled}
                style={config.equalizerStyle || 'bars'}
                isPlaying={isPlaying}
              />
            </div>
          )}

          {/* Quick Temperature Capsule */}
          <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs text-slate-400">Oda:</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                {currentTemp}°C
              </span>
            </div>
            <div className="w-px h-4 sm:h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs text-slate-400">Hedef:</span>
              <button
                type="button"
                onPointerDown={() => triggerHaptic('selection')}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  onSetTargetTemp(Math.max(10, +(targetTemp - 0.5).toFixed(1)));
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                title="Hedef Sıcaklığı Azalt"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                {targetTemp}°C
              </span>
              <button
                type="button"
                onPointerDown={() => triggerHaptic('selection')}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  onSetTargetTemp(Math.min(32, +(targetTemp + 0.5).toFixed(1)));
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                title="Hedef Sıcaklığı Artır"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM HUD / FLOATING CONTROLS & CLEAN SCREEN BUTTON ── */}
        <div
          className={`flex items-center portrait:justify-center landscape:justify-between gap-1.5 sm:gap-3 w-full transition-all duration-500 ${
            isControlsVisible || isCleanScreen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* 1. Sol: Dokununca Genişleyen Lüks Medya Kontrol Barı (Sol Çerçeve) */}
          <div
            className={`shrink-0 flex items-center transition-all duration-300 ease-out ${
              isCleanScreen
                ? 'translate-y-36 opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <LuxuryMediaBar
              mediaType={activeMediaInfo.type}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onPrevious={handlePreviousMedia}
              onNext={handleNextMedia}
              isMuted={isMuted}
              onToggleMute={
                config.audioTrack !== 'none'
                  ? () => setIsMuted((prev) => !prev)
                  : undefined
              }
              volume={config.audioVolume ?? 0.8}
              onVolumeChange={(newVol) => {
                onUpdateConfig({ audioVolume: newVol });
                ambientAudio.setVolume(newVol);
              }}
              isLoop={config.isLoop !== false}
              onToggleLoop={() => {
                onUpdateConfig({ isLoop: !(config.isLoop !== false) });
              }}
              isExpanded={activeBottomPill === 'media'}
              onToggleExpand={(expanded) =>
                setActiveBottomPill(expanded ? 'media' : 'none')
              }
            />
          </div>

          {/* 2. Orta: Dokununca Ortalı Olarak Sağlı Sollu Uzayan Güneş/Tam Ekran/Kırmızı Çarpı Butonu */}
          <div
            className={`shrink-0 flex items-center landscape:ml-auto transition-all duration-300 ease-out ${
              isCleanScreen
                ? 'translate-y-36 opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <SmartDisplayControlsPill
              brightnessPercent={config.brightnessPercent || 85}
              onBrightnessChange={(val) => onUpdateConfig({ brightnessPercent: val })}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onClose={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onClose();
              }}
              isExpanded={activeBottomPill === 'controls'}
              onToggleExpand={(expanded) =>
                setActiveBottomPill(expanded ? 'controls' : 'none')
              }
            />
          </div>

          {/* 3. Sağ: Harici Temiz Ekran (Zen Modu) Butonu (Sağ Çerçeve) */}
          <div className="shrink-0 flex items-center transition-all duration-300 ease-out">
            <button
              type="button"
              onPointerDown={() => triggerHaptic('selection')}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('selection');
                setIsCleanScreen((prev) => !prev);
              }}
              className={`p-2 sm:p-2.5 md:p-3 rounded-full backdrop-blur-2xl border transition-all duration-500 cursor-pointer pointer-events-auto ${
                isCleanScreen
                  ? 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:bg-black/60 hover:border-amber-400/40 hover:scale-110 shadow-lg'
                  : 'bg-black/60 hover:bg-black/80 active:scale-95 border-white/20 hover:border-amber-400/40 text-white shadow-2xl'
              }`}
              title={
                isCleanScreen
                  ? 'Ekranı Geri Getir (Temiz Ekrandan Çık)'
                  : 'Temiz Ekran Modu (Tüm Bilgileri Gizle)'
              }
            >
              <Paintbrush
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                  isCleanScreen ? 'text-amber-400/50' : 'text-amber-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Dokun ve Kontrol Et: Termostat Tekerleği Modalı (5 sn Otomatik Kapanma & Senkronize Blur Animasyonu) */}
      <ThermostatTouchDialModal
        isOpen={isThermostatWheelOpen}
        onClosingChange={(closing) => setIsThermostatClosing(closing)}
        onClose={() => {
          setIsThermostatWheelOpen(false);
          setIsThermostatClosing(false);
        }}
        currentTemp={currentTemp}
        targetTemp={targetTemp}
        isKombiActive={isKombiActive}
        onSetTargetTemp={onSetTargetTemp}
        themeMode={themeMode}
      />
    </div>,
    document.body
  );
};
