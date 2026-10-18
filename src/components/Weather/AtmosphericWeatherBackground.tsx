import React, { useEffect, useRef } from 'react';
import type { WeatherCondition } from '../../utils/weather.ts';

interface AtmosphericWeatherBackgroundProps {
  condition: WeatherCondition;
  isNight?: boolean;
  performanceMode: 'ultra' | 'eco';
  ambientTemp?: number;
  cityName?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  length?: number;
  phase?: number;
  color?: string;
}

interface DetailedCloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  puffs: Array<{ ox: number; oy: number; r: number; shade: number }>;
}

export const AtmosphericWeatherBackground: React.FC<AtmosphericWeatherBackgroundProps> = ({
  condition,
  isNight = false,
  performanceMode = 'ultra',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Keep state refs for animation loop
  const configRef = useRef({
    condition,
    isNight,
    performanceMode,
  });

  const reinitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    configRef.current = { condition, isNight, performanceMode };
    if (reinitRef.current) {
      reinitRef.current();
    }
  }, [condition, isNight, performanceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ── Generate Distinct Volumetric Fluffy Clouds with 3D Shading ──
    let clouds: DetailedCloud[] = [];
    const initClouds = () => {
      clouds = [];
      const isUltra = configRef.current.performanceMode === 'ultra';
      const cond = configRef.current.condition;

      // Realistic count: sunny has few graceful clouds, partly has 5-6 fluffy ones, cloudy has 8+
      let count = 2;
      if (cond === 'partly_cloudy') count = isUltra ? 6 : 4;
      else if (cond === 'cloudy' || cond === 'rainy' || cond === 'thunder') count = isUltra ? 8 : 5;
      else if (cond === 'snowy' || cond === 'fog') count = isUltra ? 5 : 3;

      for (let i = 0; i < count; i++) {
        const puffs: Array<{ ox: number; oy: number; r: number; shade: number }> = [];
        const puffCount = 9 + Math.floor(Math.random() * 6);
        const cloudBaseWidth = 240 + Math.random() * 160;

        // Create dense organic cumulus shape with high puff density
        for (let p = 0; p < puffCount; p++) {
          const normX = p / (puffCount - 1) - 0.5; // -0.5 to 0.5
          const ox = normX * cloudBaseWidth + (Math.random() * 30 - 15);
          // Upper puffs create billowing domes, lower puffs form flat base
          const isTopPuff = Math.random() > 0.35;
          const oy = isTopPuff ? -Math.random() * 50 - 15 : Math.random() * 25;
          const r = 55 + Math.random() * 45 * (1 - Math.abs(normX) * 0.4);
          // shade: 0 = bright sunlit white top, 1 = shaded bottom
          const shade = (oy + 50) / 100;
          puffs.push({ ox, oy, r, shade: Math.max(0, Math.min(1, shade)) });
        }

        // Sort puffs so deeper/shaded ones render first, bright crests on top
        puffs.sort((a, b) => b.oy - a.oy);

        clouds.push({
          x: (i * (width / count)) + (Math.random() * 120 - 60),
          y: height * 0.05 + Math.random() * (height * 0.45),
          speed: 0.25 + Math.random() * 0.35 * (i % 2 === 0 ? 1 : 1.25),
          scale: 0.85 + Math.random() * 0.5,
          puffs,
        });
      }
    };

    // ── Particles (Rain, Snow, Stars, Splash) ──
    let particles: Particle[] = [];
    const initParticles = () => {
      particles = [];
      const isUltra = configRef.current.performanceMode === 'ultra';
      const cond = configRef.current.condition;
      const night = configRef.current.isNight;

      // Vivid Twinkling Stars (Night)
      if (night) {
        const starCount = isUltra ? 140 : 60;
        for (let i = 0; i < starCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.85),
            vx: 0,
            vy: 0,
            size: 0.9 + Math.random() * 2.2,
            alpha: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
            color: Math.random() > 0.4 ? '#ffffff' : Math.random() > 0.5 ? '#93c5fd' : '#fef08a',
          });
        }
      }

      // Crisp Angled Rain (Rain & Thunder)
      if (cond === 'rainy' || cond === 'thunder') {
        const dropCount = isUltra ? 220 : 90;
        for (let i = 0; i < dropCount; i++) {
          particles.push({
            x: Math.random() * (width + 300) - 150,
            y: Math.random() * height,
            vx: -3.5 - Math.random() * 2.5,
            vy: 18 + Math.random() * 14,
            length: 28 + Math.random() * 26,
            size: 1.4 + Math.random() * 1.2,
            alpha: 0.6 + Math.random() * 0.4,
            color: Math.random() > 0.3 ? 'rgba(224, 242, 254, 0.95)' : 'rgba(125, 211, 252, 0.85)',
          });
        }
      }

      // Distinct Fluttering Snowflakes
      if (cond === 'snowy') {
        const flakeCount = isUltra ? 130 : 55;
        for (let i = 0; i < flakeCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.4,
            vy: 1.2 + Math.random() * 2.4,
            size: 2.2 + Math.random() * 4.5,
            alpha: 0.7 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
            color: '#ffffff',
          });
        }
      }
    };

    reinitRef.current = () => {
      initClouds();
      initParticles();
    };

    initClouds();
    initParticles();

    // Thunder lightning flash control
    let lightningTimer = 0;
    let lightningOpacity = 0;

    let lastTime = performance.now();

    const render = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(render);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const curCond = configRef.current.condition;
      const curNight = configRef.current.isNight;
      const isUltra = configRef.current.performanceMode === 'ultra';

      // ── 1. Clear & Draw Crisp Natural Sky Gradient ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);

      if (curNight) {
        // Deep obsidian midnight sky
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(0.35, '#0b1329');
        skyGrad.addColorStop(0.7, '#0f172a');
        skyGrad.addColorStop(1, '#1e1b4b');
      } else {
        // Daytime: Vibrant azure sky with golden horizon
        if (curCond === 'sunny') {
          skyGrad.addColorStop(0, '#0284c7'); // Deep vivid sky blue
          skyGrad.addColorStop(0.35, '#38bdf8'); // Radiant cerulean
          skyGrad.addColorStop(0.75, '#bae6fd'); // Soft atmospheric blue
          skyGrad.addColorStop(1, '#ffedd5'); // Warm golden sunset horizon hint
        } else if (curCond === 'partly_cloudy') {
          skyGrad.addColorStop(0, '#0369a1');
          skyGrad.addColorStop(0.38, '#0284c7');
          skyGrad.addColorStop(0.75, '#7dd3fc');
          skyGrad.addColorStop(1, '#e0f2fe');
        } else if (curCond === 'rainy' || curCond === 'thunder') {
          skyGrad.addColorStop(0, '#0f172a');
          skyGrad.addColorStop(0.4, '#1e293b');
          skyGrad.addColorStop(0.75, '#334155');
          skyGrad.addColorStop(1, '#1e293b');
        } else if (curCond === 'snowy') {
          skyGrad.addColorStop(0, '#1e293b');
          skyGrad.addColorStop(0.4, '#334155');
          skyGrad.addColorStop(0.75, '#64748b');
          skyGrad.addColorStop(1, '#cbd5e1');
        } else if (curCond === 'fog') {
          skyGrad.addColorStop(0, '#334155');
          skyGrad.addColorStop(0.45, '#475569');
          skyGrad.addColorStop(0.75, '#64748b');
          skyGrad.addColorStop(1, '#94a3b8');
        } else {
          // Cloudy
          skyGrad.addColorStop(0, '#1e293b');
          skyGrad.addColorStop(0.4, '#334155');
          skyGrad.addColorStop(0.75, '#64748b');
          skyGrad.addColorStop(1, '#94a3b8');
        }
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. Radiant Sun & God Rays (Sunny & Partly Cloudy) ──
      if (!curNight && (curCond === 'sunny' || curCond === 'partly_cloudy')) {
        const sunX = width * 0.76;
        const sunY = height * 0.16;

        ctx.save();

        // Animated Golden God Rays streaming downwards
        const rayCount = 8;
        for (let r = 0; r < rayCount; r++) {
          const rayAngle = (r / rayCount) * (Math.PI * 0.7) + Math.PI * 0.35 + Math.sin(time * 0.0008 + r) * 0.08;
          const rayLength = height * 0.85;
          const rx = sunX + Math.cos(rayAngle) * rayLength;
          const ry = sunY + Math.sin(rayAngle) * rayLength;

          const rayGrad = ctx.createLinearGradient(sunX, sunY, rx, ry);
          rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          rayGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.12)');
          rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.lineTo(rx - 60, ry);
          ctx.lineTo(rx + 60, ry);
          ctx.closePath();
          ctx.fill();
        }

        // Broad atmospheric outer warm halo
        const outerHalo = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 320);
        outerHalo.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
        outerHalo.addColorStop(0.25, 'rgba(251, 146, 60, 0.4)');
        outerHalo.addColorStop(0.6, 'rgba(251, 146, 60, 0.1)');
        outerHalo.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
        ctx.fill();

        // Brilliant Sun Core Disk (Unmistakable pure glowing sun)
        const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 48);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.65, '#fef08a');
        coreGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 45;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // ── 3. Luminous Moon & Stars (Night) ──
      if (curNight) {
        // Moon
        const moonX = width * 0.80;
        const moonY = height * 0.15;

        ctx.save();
        // Moon Outer Aura
        const moonAura = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 220);
        moonAura.addColorStop(0, 'rgba(224, 242, 254, 0.6)');
        moonAura.addColorStop(0.4, 'rgba(186, 230, 253, 0.2)');
        moonAura.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = moonAura;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 220, 0, Math.PI * 2);
        ctx.fill();

        // Moon Disk (Crisp Crescent with Crater Depth)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(186, 230, 253, 0.95)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Crescent Cutout for realistic 3D moon
        ctx.fillStyle = '#0b1329';
        ctx.beginPath();
        ctx.arc(moonX - 12, moonY - 7, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Twinkling Star Canopy
        particles.forEach((p) => {
          if (p.phase !== undefined && p.length === undefined && p.size < 4) {
            p.phase += dt * 2.5;
            const alpha = p.alpha * (0.4 + 0.6 * Math.abs(Math.sin(p.phase)));
            ctx.fillStyle = p.color || '#ffffff';
            ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Lens flare cross on brighter stars
            if (p.size > 2.0 && isUltra) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p.x - p.size * 2.2, p.y);
              ctx.lineTo(p.x + p.size * 2.2, p.y);
              ctx.moveTo(p.x, p.y - p.size * 2.2);
              ctx.lineTo(p.x, p.y + p.size * 2.2);
              ctx.stroke();
            }
          }
        });
        ctx.globalAlpha = 1;
      }

      // ── 4. Unmistakable Volumetric 3D Cumulus Clouds ──
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed * (isUltra ? 1.0 : 0.65);
        if (cloud.x - 450 > width) {
          cloud.x = -500;
          cloud.y = height * 0.05 + Math.random() * (height * 0.45);
        }

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);

        // Draw each dense cumulus puff with directional volumetric shading
        cloud.puffs.forEach((puff) => {
          const puffGrad = ctx.createRadialGradient(
            puff.ox,
            puff.oy - puff.r * 0.3,
            puff.r * 0.1,
            puff.ox,
            puff.oy,
            puff.r
          );

          if (curNight) {
            // Dark night clouds drifting across the stars
            puffGrad.addColorStop(0, 'rgba(30, 41, 59, 0.88)');
            puffGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.75)');
            puffGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
          } else if (curCond === 'rainy' || curCond === 'thunder') {
            // Dark brooding storm clouds
            puffGrad.addColorStop(0, 'rgba(71, 85, 105, 0.95)');
            puffGrad.addColorStop(0.65, 'rgba(51, 65, 85, 0.90)');
            puffGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
          } else {
            // Day cumulus: Brilliant white sunlit tops with soft shaded blue-gray bellies
            if (puff.shade < 0.4) {
              // High crest: pure white cumulus highlight
              puffGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
              puffGrad.addColorStop(0.7, 'rgba(248, 250, 252, 0.92)');
              puffGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
            } else {
              // Shaded base: realistic volume
              puffGrad.addColorStop(0, 'rgba(241, 245, 249, 0.95)');
              puffGrad.addColorStop(0.65, 'rgba(203, 213, 225, 0.85)');
              puffGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
            }
          }

          ctx.fillStyle = puffGrad;
          ctx.beginPath();
          ctx.arc(puff.ox, puff.oy, puff.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      });

      // ── 5. Distinct Rain Streaks (Rain & Thunder) ──
      if (curCond === 'rainy' || curCond === 'thunder') {
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';

        particles.forEach((p) => {
          if (p.length !== undefined) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.y > height) {
              p.y = -p.length;
              p.x = Math.random() * (width + 250);
            }
            if (p.x < -100) p.x = width + 100;

            ctx.strokeStyle = p.color || 'rgba(224, 242, 254, 0.9)';
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 1.5, p.y + p.length);
            ctx.stroke();
          }
        });
        ctx.globalAlpha = 1;

        // Thunder sheet lightning
        if (curCond === 'thunder') {
          lightningTimer += dt;
          if (lightningTimer > 4.5 && Math.random() < 0.08) {
            lightningOpacity = 0.85;
            lightningTimer = 0;
          }
          if (lightningOpacity > 0.01) {
            ctx.fillStyle = `rgba(238, 242, 255, ${lightningOpacity})`;
            ctx.fillRect(0, 0, width, height);
            lightningOpacity *= 0.82;
          }
        }
      }

      // ── 6. Crystalline Snowflakes (Snowy) ──
      if (curCond === 'snowy') {
        particles.forEach((p) => {
          if (p.phase !== undefined && p.length === undefined && p.size >= 2) {
            p.phase += dt * 1.8;
            p.y += p.vy;
            p.x += Math.sin(p.phase) * 1.2;

            if (p.y > height + 20) {
              p.y = -20;
              p.x = Math.random() * width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#ffffff';

            // Snowflake core
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // 6-pointed crystalline arms on larger flakes
            if (p.size > 3.2 && isUltra) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
              ctx.lineWidth = 1.0;
              for (let a = 0; a < 3; a++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(-p.size * 1.8, 0);
                ctx.lineTo(p.size * 1.8, 0);
                ctx.stroke();
              }
            }

            ctx.restore();
          }
        });
        ctx.globalAlpha = 1;
      }

      // ── 7. Rolling Mist Layers (Fog) ──
      if (curCond === 'fog') {
        ctx.save();
        const mistCount = 4;
        for (let m = 0; m < mistCount; m++) {
          const my = height * (0.25 + m * 0.2);
          const offset = Math.sin(time * 0.0006 + m) * 80;
          const mistGrad = ctx.createLinearGradient(0, my - 60, 0, my + 60);
          mistGrad.addColorStop(0, 'rgba(203, 213, 225, 0)');
          mistGrad.addColorStop(0.5, 'rgba(226, 232, 240, 0.35)');
          mistGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');

          ctx.fillStyle = mistGrad;
          ctx.fillRect(offset - 100, my - 60, width + 200, 120);
        }
        ctx.restore();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initClouds();
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
