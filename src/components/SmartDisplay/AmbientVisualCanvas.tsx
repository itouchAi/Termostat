import React, { useEffect, useRef } from 'react';
import type { PresetVisualTheme, SmartDisplayMode, SlideTransition } from '../../types/smartDisplay.ts';

interface AmbientVisualCanvasProps {
  mode: SmartDisplayMode;
  theme: PresetVisualTheme;
  slideIntervalSec: number;
  slideTransition: SlideTransition;
  slideIndex: number;
}

// Curated ambient photos for image/slideshow mode
export const AMBIENT_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
    title: 'Şömineli Kış Evi',
  },
  {
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80',
    title: 'Yağmurlu Orman & Sis',
  },
  {
    url: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1920&q=80',
    title: 'Karlı Çam Ormanı',
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    title: 'Altın Saat Gün Batımı',
  },
  {
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1920&q=80',
    title: 'Kuzey Işıkları & Aurora',
  },
];

export const AmbientVisualCanvas: React.FC<AmbientVisualCanvasProps> = ({
  mode,
  theme,
  slideTransition,
  slideIndex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas animation for Fireplace, Rain, Snow, Aurora
  useEffect(() => {
    if (mode === 'aod' || mode === 'image' || mode === 'slideshow') return;

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

    // Particle system setup based on theme
    const particles: any[] = [];
    const count = theme === 'fireplace' ? 70 : theme === 'winter_snow' ? 120 : 60;

    for (let i = 0; i < count; i++) {
      if (theme === 'fireplace') {
        particles.push({
          x: width * 0.5 + (Math.random() - 0.5) * width * 0.4,
          y: height + Math.random() * 50,
          size: Math.random() * 24 + 10,
          speedY: -(Math.random() * 3 + 2),
          speedX: (Math.random() - 0.5) * 1.5,
          life: 1.0,
          decay: Math.random() * 0.012 + 0.008,
          hue: Math.random() * 35 + 10, // red to warm amber
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
        // Aurora waves
        particles.push({
          x: (i / count) * width,
          y: height * 0.4,
          waveOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.02;

      // Dark atmospheric background
      if (theme === 'fireplace') {
        // Warm hearth background
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

        // Render rising fire embers and flames
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
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
        // Deep winter night gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#060d19');
        grad.addColorStop(1, '#0c1a2d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.y += p.speedY;
          p.x += Math.sin(time + i * 0.5) * 0.6;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 235, 255, ${p.opacity})`;
          ctx.fill();
        }
      } else if (theme === 'rainy_window') {
        // Stormy evening background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a111a');
        grad.addColorStop(1, '#111b27');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Rain streak lines
        ctx.strokeStyle = 'rgba(160, 200, 255, 0.35)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.y += p.speedY;
          p.x -= 1.2;
          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * (width + 100);
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
          const color1 = i === 0 ? 'rgba(16, 185, 129, 0.25)' : i === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)';
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
  }, [mode, theme]);

  // AOD Mode: Pure black screen
  if (mode === 'aod') {
    return <div className="absolute inset-0 bg-black" />;
  }

  // Image & Slideshow mode
  if (mode === 'image' || mode === 'slideshow') {
    const currentPhoto = AMBIENT_PHOTOS[slideIndex % AMBIENT_PHOTOS.length];
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        <div
          key={slideIndex}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
            slideTransition === 'zoom'
              ? 'animate-in zoom-in-105 duration-1000'
              : slideTransition === 'slide'
              ? 'animate-in slide-in-from-right duration-700'
              : 'animate-in fade-in duration-1000'
          }`}
          style={{ backgroundImage: `url(${currentPhoto.url})` }}
        >
          {/* Subtle dark vignette overlay for readability */}
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
        </div>
      </div>
    );
  }

  // Canvas visual background
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};
