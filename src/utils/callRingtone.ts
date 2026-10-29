// Web Audio API Synthesizer for Android Incoming Call Ringtone & Call Tones
// No external mp3 files needed; works with zero latency and offline.

let audioCtx: AudioContext | null = null;
let ringtoneInterval: NodeJS.Timeout | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Play single ring cadence (like Android marimba / pulse ring)
const playRingCadence = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [
    { freq: 659.25, time: 0, dur: 0.14 },    // E5
    { freq: 783.99, time: 0.16, dur: 0.14 }, // G5
    { freq: 987.77, time: 0.32, dur: 0.2 },  // B5
    { freq: 1318.51, time: 0.54, dur: 0.3 }, // E6
    { freq: 987.77, time: 0.9, dur: 0.18 },  // B5
    { freq: 1174.66, time: 1.1, dur: 0.35 }, // D6
  ];

  notes.forEach((note) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.2, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur + 0.05);
    } catch {}
  });
};

export const startRingtone = (soundEnabled: boolean = true, vibrateEnabled: boolean = true) => {
  stopRingtone();

  if (soundEnabled) {
    playRingCadence();
    ringtoneInterval = setInterval(() => {
      playRingCadence();
    }, 2400);
  }

  if (vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([600, 300, 600, 300, 800]);
    } catch {}
  }
};

export const stopRingtone = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0); // stop vibration
    } catch {}
  }
};

export const playMissedCallSound = () => {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // 3 short downward beeps
  [0, 0.2, 0.4].forEach((t) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now + t);
      osc.frequency.exponentialRampToValueAtTime(220, now + t + 0.12);

      gain.gain.setValueAtTime(0.12, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.14);
    } catch {}
  });
};

export const playCallEndedSound = () => {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
};
