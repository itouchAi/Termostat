import React, { useEffect, useRef } from 'react';
import type { EqualizerStyle } from '../../types/smartDisplay.ts';
import { ambientAudio } from '../../utils/ambientAudio.ts';

interface MusicEqualizerProps {
  enabled: boolean;
  style: EqualizerStyle;
  isPlaying: boolean;
}

export const MusicEqualizer: React.FC<MusicEqualizerProps> = ({
  enabled,
  style,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = 32;
    const dataArray = new Uint8Array(bufferLength);
    const peakBars = new Array(bufferLength).fill(0);

    const updateSize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 120;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        ambientAudio.getFrequencyData(dataArray);
        phase += 0.04;
      } else {
        dataArray.fill(0);
      }

      if (style === 'bars') {
        // 1. Neon Spectrum Bars with Peak Caps
        const barCount = bufferLength;
        const totalGap = (barCount - 1) * 3;
        const barWidth = Math.max(3, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i] / 255;
          const barHeight = Math.max(4, val * (height * 0.85));

          // Peak fall-down physics
          if (val * height > peakBars[i]) {
            peakBars[i] = val * height;
          } else {
            peakBars[i] = Math.max(0, peakBars[i] - 1.5);
          }

          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Vibrant neon gradient: cyan -> emerald -> amber -> rose
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.7)');
          grad.addColorStop(1, 'rgba(244, 63, 94, 0.95)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak cap
          if (peakBars[i] > 4) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x, height - peakBars[i] - 2, barWidth, 2);
          }
        }
      } else if (style === 'wave') {
        // 2. Liquid Sine Wave Stream
        ctx.beginPath();
        ctx.moveTo(0, height * 0.5);

        for (let x = 0; x <= width; x += 6) {
          const normX = x / width;
          const index = Math.floor(normX * bufferLength);
          const freqVal = (dataArray[index] || 0) / 255;
          const amp = freqVal * (height * 0.4) + 6;
          const y =
            height * 0.5 +
            Math.sin(normX * Math.PI * 4 + phase) * amp +
            Math.cos(normX * Math.PI * 2 - phase * 0.7) * (amp * 0.5);

          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Second subtle counter wave
        ctx.beginPath();
        ctx.moveTo(0, height * 0.5);
        for (let x = 0; x <= width; x += 6) {
          const normX = x / width;
          const index = Math.floor(normX * bufferLength);
          const freqVal = (dataArray[index] || 0) / 255;
          const amp = freqVal * (height * 0.3) + 4;
          const y =
            height * 0.5 + Math.sin(normX * Math.PI * 6 - phase * 1.2) * amp;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        // 3. Pulse / Concentric Radial Beats
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const avg =
          dataArray.reduce((acc, curr) => acc + curr, 0) / (dataArray.length || 1);
        const radius = (avg / 255) * (height * 0.4) + 14;

        for (let ring = 3; ring >= 1; ring--) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * (ring * 0.55), 0, Math.PI * 2);
          ctx.strokeStyle =
            ring === 1
              ? 'rgba(251, 146, 60, 0.9)'
              : ring === 2
              ? 'rgba(244, 63, 94, 0.55)'
              : 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [enabled, style, isPlaying]);

  if (!enabled) return null;

  return (
    <div className="w-full max-w-sm sm:max-w-md h-16 sm:h-20 flex items-center justify-center pointer-events-none transition-all">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
