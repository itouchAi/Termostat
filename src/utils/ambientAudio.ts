// Ambient Audio Synthesizer using Web Audio API
// Runs 100% locally and offline without external asset dependencies

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: string = 'none';
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private isRunning: boolean = false;
  private isPausedState: boolean = false;
  private audioElement: HTMLAudioElement | null = null;
  private onEndedCallback: (() => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128; // Higher resolution frequency bins (64 bins)
        this.analyser.smoothingTimeConstant = 0.78; // Smooth, realistic bounce
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setOnEnded(cb: (() => void) | null) {
    this.onEndedCallback = cb;
    if (this.audioElement) {
      this.audioElement.onended = () => {
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      };
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
    }
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
  }

  public pause() {
    this.isPausedState = true;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume() {
    this.isPausedState = false;
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public isPlaying(): boolean {
    return this.isRunning && !this.isPausedState;
  }

  public getCurrentTrack(): string {
    return this.currentTrack;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (!this.isRunning || this.isPausedState) {
      array.fill(0);
      return;
    }

    // 1. Genuine Web Audio Analyser Data (Direct FFT of playing audio)
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as any);
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += array[i];
      }
      if (sum > 0) {
        return; // Genuine frequency spectrum active!
      }
    }

    // 2. Dynamic tempo-harmonic responder fallback if audio is playing without Web Audio hook (CORS fallback)
    if (this.audioElement && !this.audioElement.paused && this.audioElement.currentTime > 0) {
      const cur = this.audioElement.currentTime;
      const vol = this.audioElement.volume ?? 0.8;
      const beatBass = Math.sin(cur * 8.0) * 0.5 + 0.5;
      const beatMid = Math.sin(cur * 16.0 + 1.2) * 0.5 + 0.5;

      for (let i = 0; i < array.length; i++) {
        const factor = 1 - (i / array.length) * 0.55;
        const wave = Math.sin(cur * 10 + i * 0.5) * 0.5 + 0.5;
        const dynamicVal =
          (beatBass * 0.5 + beatMid * 0.3 + wave * 0.2) *
          240 *
          factor *
          vol;
        array[i] = Math.min(255, Math.max(12, Math.floor(dynamicVal + Math.random() * 20 * vol)));
      }
      return;
    }

    array.fill(0);
  }

  public playTrack(track: string, volume: number = 0.5, customUrl?: string) {
    this.stop();
    if (track === 'none') {
      this.currentTrack = 'none';
      return;
    }

    this.currentTrack = track;
    this.isRunning = true;
    this.isPausedState = false;

    this.initContext();

    // Custom audio track via external or uploaded MP3 URL
    if (track === 'custom' && customUrl && customUrl.trim()) {
      try {
        const audio = new Audio();
        if (!customUrl.startsWith('blob:') && !customUrl.startsWith('data:')) {
          audio.crossOrigin = 'anonymous';
        }
        audio.src = customUrl.trim();
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.preload = 'auto';

        audio.onended = () => {
          if (this.onEndedCallback) {
            this.onEndedCallback();
          } else {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        };

        // Wire to Web Audio graph for true frequency synchronization!
        if (this.ctx && this.masterGain) {
          try {
            const source = this.ctx.createMediaElementSource(audio);
            source.connect(this.masterGain);
            this.activeNodes.push(source);
          } catch (e) {
            console.warn('MediaElementSource connection note:', e);
          }
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Custom audio playback note:', err);
            // If CORS issue occurred due to crossOrigin, retry without crossOrigin
            if (audio.crossOrigin) {
              audio.crossOrigin = null;
              audio.src = customUrl.trim();
              audio.play().catch(() => {});
            }
          });
        }
        this.audioElement = audio;
      } catch (err) {
        console.warn('Failed to load custom audio URL:', err);
      }
      return;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.setVolume(volume);

    try {
      if (track === 'fireplace') {
        this.startFireplace();
      } else if (track === 'rain') {
        this.startRain();
      } else if (track === 'lofi') {
        this.startLofi();
      } else if (track === 'relax_piano' || track === 'nature') {
        this.startChimes();
      }
    } catch (e) {
      console.warn('Ambient audio error:', e);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.load();
      } catch {}
      this.audioElement = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node === 'number') {
          clearInterval(node);
        } else if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch {}
    });
    this.activeNodes = [];
    this.currentTrack = 'none';
  }

  // 1. Cozy Fireplace (Rumbling low noise + intermittent crackles)
  private startFireplace() {
    if (!this.ctx || !this.masterGain) return;

    // Continuous soft warm low-frequency roar
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;

    const fireGain = this.ctx.createGain();
    fireGain.gain.value = 0.35;

    whiteNoise.connect(filter);
    filter.connect(fireGain);
    fireGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, fireGain);

    // Random crackles / pops
    const interval = window.setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      if (Math.random() < 0.65) {
        try {
          const pop = this.ctx.createOscillator();
          const popGain = this.ctx.createGain();
          pop.type = 'triangle';
          pop.frequency.setValueAtTime(600 + Math.random() * 900, this.ctx.currentTime);
          pop.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

          popGain.gain.setValueAtTime(0.15 + Math.random() * 0.25, this.ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

          pop.connect(popGain);
          popGain.connect(this.masterGain);

          pop.start();
          pop.stop(this.ctx.currentTime + 0.07);
        } catch {}
      }
    }, 180);

    this.activeNodes.push(interval);
  }

  // 2. Soothing Rain (Filtered pink/white noise with soft spatters)
  private startRain() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    const rainGain = this.ctx.createGain();
    rainGain.gain.value = 0.4;

    rainSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSource.start();
    this.activeNodes.push(rainSource, filter, rainGain);
  }

  // 3. Relaxing Lofi Drone / Ambient Harmony
  private startLofi() {
    if (!this.ctx || !this.masterGain) return;

    // Gentle chord frequencies (e.g. Fmaj7: F3, A3, C4, E4)
    const freqs = [174.61, 220.0, 261.63, 329.63];
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.12;
    gainNode.connect(this.masterGain);

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      // Gentle LFO detune
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.1 + idx * 0.05;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      lfo.start();
      oscGain.gain.value = 0.25;
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();

      this.activeNodes.push(osc, oscGain, lfo, lfoGain);
    });

    this.activeNodes.push(gainNode);
  }

  // 4. Soft Wind Chimes / Nature Echoes
  private startChimes() {
    if (!this.ctx || !this.masterGain) return;

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.value = 0.2;
    chimeGain.connect(this.masterGain);
    this.activeNodes.push(chimeGain);

    const interval = window.setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      if (Math.random() < 0.45) {
        try {
          const note = scale[Math.floor(Math.random() * scale.length)];
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = note;

          noteGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.2);

          osc.connect(noteGain);
          noteGain.connect(chimeGain);

          osc.start();
          osc.stop(this.ctx.currentTime + 3.3);
        } catch {}
      }
    }, 1400);

    this.activeNodes.push(interval);
  }
}

export const ambientAudio = new AmbientAudioEngine();
