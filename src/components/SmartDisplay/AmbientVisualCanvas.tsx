import React, { useEffect, useRef } from 'react';
import type {
  PresetVisualTheme,
  SmartDisplayMode,
  SlideTransition,
  ImageFitMode,
  MediaPlaylistItem,
} from '../../types/smartDisplay.ts';

interface AmbientVisualCanvasProps {
  mode: SmartDisplayMode;
  theme: PresetVisualTheme;
  customImageUrl?: string;
  customVideoUrl?: string;
  customImages?: MediaPlaylistItem[];
  customVideos?: MediaPlaylistItem[];
  activeVideoIndex?: number;
  imageFitMode?: ImageFitMode;
  blurBackground?: boolean;
  slideIntervalSec: number;
  slideTransition: SlideTransition;
  slideIndex: number;
  isPlaying?: boolean;
  isLoop?: boolean;
  onVideoEnded?: () => void;
}

// Distinct high-resolution ambient photos mapped to each preset theme
export const THEME_PHOTOS: Record<PresetVisualTheme, { url: string; title: string; desc: string }> = {
  fireplace: {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
    title: 'Şömineli Sıcak Dağ Evi',
    desc: 'Odun ateşi ve sıcacık şömine alevi',
  },
  rainy_window: {
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80',
    title: 'Yağmurlu Pencere & Gece Işıkları',
    desc: 'Camdan süzülen sakin yağmur damlaları',
  },
  winter_snow: {
    url: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1920&q=80',
    title: 'Karlı Çam Ormanı & Beyaz Kış',
    desc: 'Lapa lapa kar altındaki çam ağaçları',
  },
  sunset_forest: {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    title: 'Altın Saat Dağ & Gün Batımı',
    desc: 'Kızıl gün batımı ve dingin manzara',
  },
  aurora: {
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1920&q=80',
    title: 'Kutup Işıkları & Büyüleyici Aurora',
    desc: 'Gökyüzünde dans eden yeşil kuzey ışıkları',
  },
  minimal_black: {
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    title: 'Minimal Derin Siyah Dokusu',
    desc: 'Gözü yormayan saf gece modu',
  },
  custom: {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    title: 'Özel Görsel',
    desc: 'Kullanıcı tarafından yüklenen harici görsel',
  },
};

export const THEME_VIDEOS: Record<PresetVisualTheme, string> = {
  fireplace:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/04/Fireplace_1_2021-02-14.webm/Fireplace_1_2021-02-14.webm.480p.vp9.webm',
  rainy_window:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2e/Radevormwald_-_Raindrops_on_a_window_10_%281%29_ies.webm/Radevormwald_-_Raindrops_on_a_window_10_%281%29_ies.webm.480p.vp9.webm',
  winter_snow:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f3/Snow_falling_in_Tuntorp.webm/Snow_falling_in_Tuntorp.webm.480p.vp9.webm',
  sunset_forest:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e5/Sunset_timelapse_in_Funchal_-_2014.webm/Sunset_timelapse_in_Funchal_-_2014.webm.480p.vp9.webm',
  aurora:
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/df/Aurora_borealis_timelapse.webm/Aurora_borealis_timelapse.webm.480p.vp9.webm',
  minimal_black: '',
  custom: '',
};

export const ALL_THEME_KEYS: PresetVisualTheme[] = [
  'fireplace',
  'rainy_window',
  'winter_snow',
  'sunset_forest',
  'aurora',
  'minimal_black',
];

export const AmbientVisualCanvas: React.FC<AmbientVisualCanvasProps> = ({
  mode,
  theme,
  customImageUrl,
  customVideoUrl,
  customImages = [],
  customVideos = [],
  activeVideoIndex = 0,
  imageFitMode = 'cover',
  blurBackground = false,
  slideTransition,
  slideIndex,
  isPlaying = true,
  isLoop = true,
  onVideoEnded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideoMode = mode === 'video' || mode === 'video_audio_muted_mp3';
  const effectiveVideoUrl =
    customVideos.length > 0
      ? customVideos[activeVideoIndex % customVideos.length]?.url
      : customVideoUrl?.trim() || THEME_VIDEOS[theme] || THEME_VIDEOS.fireplace;

  // Robust HTML5 Video Playback Engine (Solves browser 1-second autoplay pause bug)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Browser audio/video security requires imperative DOM muted=true to prevent 1-second auto-pause
    v.defaultMuted = true;
    v.muted = true;
    v.volume = 0;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');

    const handleUnexpectedPause = () => {
      if (isPlaying && v && v.paused && !v.ended) {
        v.defaultMuted = true;
        v.muted = true;
        v.volume = 0;
        v.play().catch(() => {});
      }
    };

    const handleVideoEnded = () => {
      if (isLoop) {
        if (customVideos.length <= 1) {
          // Single video: seamlessly loop without stopping
          v.currentTime = 0;
          v.play().catch(() => {});
        } else {
          // Multi-video playlist: advance to next track
          onVideoEnded?.();
        }
      } else {
        v.pause();
      }
    };

    v.addEventListener('pause', handleUnexpectedPause);
    v.addEventListener('ended', handleVideoEnded);

    if (isPlaying) {
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          setTimeout(() => {
            if (videoRef.current && isPlaying) {
              videoRef.current.defaultMuted = true;
              videoRef.current.muted = true;
              videoRef.current.volume = 0;
              videoRef.current.play().catch(() => {});
            }
          }, 100);
        });
      }
    } else {
      v.pause();
    }

    return () => {
      v.removeEventListener('pause', handleUnexpectedPause);
      v.removeEventListener('ended', handleVideoEnded);
    };
  }, [isPlaying, effectiveVideoUrl, mode, customVideos.length, onVideoEnded]);

  // Determine CSS background-size from imageFitMode
  const bgSizeStyle =
    imageFitMode === 'contain'
      ? 'contain'
      : imageFitMode === 'fill'
      ? '100% 100%'
      : 'cover';

  // Determine CSS object-fit for video
  const videoFitClass =
    imageFitMode === 'contain'
      ? 'object-contain'
      : imageFitMode === 'fill'
      ? 'object-fill'
      : 'object-cover';

  // Background filter for equalizer mode blur & thermostat modal blur
  const blurFilterStyle: React.CSSProperties = {
    filter: blurBackground ? 'blur(16px) brightness(0.6)' : 'none',
    transform: blurBackground ? 'scale(1.06)' : 'scale(1)',
    transition: 'filter 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'filter, transform',
  };

  // 1. AOD Mode: Pure black screen
  if (mode === 'aod') {
    return <div className="absolute inset-0 bg-black" />;
  }

  // 2. Video Mode: Active video from playlist, customVideoUrl or default preset video
  if (isVideoMode && effectiveVideoUrl) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black" style={blurFilterStyle}>
        <video
          ref={(node) => {
            videoRef.current = node;
            if (node) {
              node.defaultMuted = true;
              node.muted = true;
              node.volume = 0;
              node.setAttribute('muted', '');
              node.setAttribute('playsinline', '');
              node.setAttribute('webkit-playsinline', '');
              if (isPlaying && node.paused) {
                node.play().catch(() => {});
              }
            }
          }}
          key={effectiveVideoUrl}
          src={effectiveVideoUrl}
          autoPlay
          loop={isLoop && customVideos.length <= 1}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            el.defaultMuted = true;
            el.muted = true;
            el.volume = 0;
            if (isPlaying) {
              el.play().catch(() => {});
            }
          }}
          onCanPlay={(e) => {
            const el = e.currentTarget;
            el.defaultMuted = true;
            el.muted = true;
            el.volume = 0;
            if (isPlaying) {
              el.play().catch(() => {});
            }
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (isPlaying && el.paused && !el.ended) {
              el.defaultMuted = true;
              el.muted = true;
              el.volume = 0;
              el.play().catch(() => {});
            }
          }}
          className={`w-full h-full ${videoFitClass}`}
        />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/75 pointer-events-none" />
      </div>
    );
  }

  // 3. Single Image Mode: Selected image from playlist, customImageUrl, or preset theme
  if (mode === 'image') {
    let photoUrl = '';
    if (customImages.length > 0) {
      photoUrl = customImages[slideIndex % customImages.length]?.url || customImages[0]?.url;
    } else if (theme === 'custom' && customImageUrl && customImageUrl.trim()) {
      photoUrl = customImageUrl.trim();
    } else {
      photoUrl = THEME_PHOTOS[theme]?.url || THEME_PHOTOS.fireplace.url;
    }

    return (
      <div className="absolute inset-0 overflow-hidden bg-black" style={blurFilterStyle}>
        <div
          key={photoUrl}
          className="absolute inset-0 bg-no-repeat bg-center transition-all duration-1000 animate-in fade-in"
          style={{
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: bgSizeStyle,
          }}
        >
          {/* Subtle dark vignette overlay for contrast and clock readability */}
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
        </div>
      </div>
    );
  }

  // 4. Slideshow Mode: Cycles through customImages playlist or built-in theme photos
  if (mode === 'slideshow') {
    let currentPhotoUrl = '';
    if (customImages.length > 0) {
      currentPhotoUrl = customImages[slideIndex % customImages.length]?.url;
    } else {
      const photoList = ALL_THEME_KEYS.map((k) => THEME_PHOTOS[k]);
      if (customImageUrl && customImageUrl.trim()) {
        photoList.unshift({
          url: customImageUrl.trim(),
          title: 'Özel Görselim',
          desc: 'Eklediğiniz fotoğraf',
        });
      }
      currentPhotoUrl = photoList[slideIndex % photoList.length]?.url;
    }

    return (
      <div className="absolute inset-0 overflow-hidden bg-black" style={blurFilterStyle}>
        <div
          key={`${currentPhotoUrl}_${slideIndex}`}
          className={`absolute inset-0 bg-no-repeat bg-center transition-all duration-1000 ${
            slideTransition === 'zoom'
              ? 'animate-in zoom-in-105 duration-1000'
              : slideTransition === 'slide'
              ? 'animate-in slide-in-from-right duration-700'
              : 'animate-in fade-in duration-1000'
          }`}
          style={{
            backgroundImage: `url(${currentPhotoUrl})`,
            backgroundSize: bgSizeStyle,
          }}
        >
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
        </div>
      </div>
    );
  }

  // 5. Canvas Particle Visualizer for Live Fireplace, Rain, Snow, Aurora
  return (
    <div className="absolute inset-0" style={blurFilterStyle}>
      <CanvasParticleVisualizer canvasRef={canvasRef} theme={theme} isPlaying={isPlaying} />
    </div>
  );
};

// Canvas Particle Visualizer
const CanvasParticleVisualizer: React.FC<{
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  theme: PresetVisualTheme;
  isPlaying?: boolean;
}> = ({ canvasRef, theme, isPlaying = true }) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: any[] = [];
    const count = theme === 'fireplace' ? 70 : theme === 'winter_snow' ? 120 : 60;

    for (let i = 0; i < count; i++) {
      if (theme === 'fireplace') {
        particles.push({
          x: width * 0.5 + (Math.random() - 0.5) * width * 0.45,
          y: height + Math.random() * 50,
          size: Math.random() * 24 + 10,
          speedY: -(Math.random() * 3 + 2),
          speedX: (Math.random() - 0.5) * 1.5,
          life: 1.0,
          decay: Math.random() * 0.012 + 0.008,
          hue: Math.random() * 35 + 10,
        });
      } else if (theme === 'winter_snow') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 3.5 + 1,
          speedY: Math.random() * 1.2 + 0.8,
          speedX: Math.sin(Math.random() * 5) * 0.5,
          opacity: Math.random() * 0.7 + 0.3,
        });
      } else if (theme === 'rainy_window') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 22 + 15,
          speedY: Math.random() * 8 + 12,
          opacity: Math.random() * 0.4 + 0.2,
        });
      } else {
        particles.push({
          x: (i / count) * width,
          y: height * 0.4,
          waveOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    const render = () => {
      if (isPlaying) {
        time += 0.02;
      }

      if (theme === 'fireplace') {
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.85,
          50,
          width * 0.5,
          height * 0.5,
          width * 0.7
        );
        grad.addColorStop(0, '#3f1107');
        grad.addColorStop(0.5, '#170604');
        grad.addColorStop(1, '#080202');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (isPlaying) {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(time + i) * 0.8;
            p.life -= p.decay;
            p.size *= 0.985;

            if (p.life <= 0 || p.size < 2 || p.y < height * 0.2) {
              p.x = width * 0.5 + (Math.random() - 0.5) * width * 0.45;
              p.y = height + 10;
              p.size = Math.random() * 28 + 12;
              p.speedY = -(Math.random() * 3.5 + 2);
              p.life = 1.0;
              p.hue = Math.random() * 40 + 10;
            }
          }

          const radial = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          radial.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${p.life * 0.7})`);
          radial.addColorStop(0.5, `hsla(${p.hue - 15}, 100%, 50%, ${p.life * 0.4})`);
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (theme === 'winter_snow') {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#060d19');
        grad.addColorStop(1, '#0c1a2d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (isPlaying) {
            p.y += p.speedY;
            p.x += Math.sin(time + i * 0.5) * 0.6;
            if (p.y > height) {
              p.y = -10;
              p.x = Math.random() * width;
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 235, 255, ${p.opacity})`;
          ctx.fill();
        }
      } else if (theme === 'rainy_window') {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a111a');
        grad.addColorStop(1, '#111b27');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(160, 200, 255, 0.35)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (isPlaying) {
            p.y += p.speedY;
            p.x -= 1.2;
            if (p.y > height) {
              p.y = -p.length;
              p.x = Math.random() * (width + 100);
            }
          }

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + p.length);
          ctx.stroke();
        }
      } else {
        // Aurora Borealis
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.6, '#061727');
        grad.addColorStop(1, '#0a101d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, height * 0.5);
          for (let x = 0; x <= width; x += 30) {
            const y =
              height * 0.45 +
              Math.sin(x * 0.003 + time * 0.8 + i) * 80 +
              Math.cos(x * 0.007 - time * 0.5) * 40;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          const auroraGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.7);
          const color1 =
            i === 0
              ? 'rgba(16, 185, 129, 0.25)'
              : i === 1
              ? 'rgba(59, 130, 246, 0.2)'
              : 'rgba(139, 92, 246, 0.15)';
          auroraGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          auroraGrad.addColorStop(0.5, color1);
          auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auroraGrad;
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, isPlaying]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};
