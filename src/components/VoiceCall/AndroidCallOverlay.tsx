import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { VoiceCallConfig, CallState } from '../../types/voiceCall.ts';
import { startRingtone, stopRingtone, playMissedCallSound, playCallEndedSound } from '../../utils/callRingtone.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface AndroidCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceCallConfig;
  currentTemp?: number;
  targetTemp?: number;
  isKombiActive?: boolean;
  onSetTargetTemp?: (temp: number) => void;
  reason?: 'ignition' | 'low_temp' | 'manual_test' | 'target_reached';
}

export const AndroidCallOverlay: React.FC<AndroidCallOverlayProps> = ({
  isOpen,
  onClose,
  config,
  currentTemp = 21.8,
  targetTemp = 22.5,
  isKombiActive = false,
  onSetTargetTemp,
  reason = 'manual_test',
}) => {
  const [callState, setCallState] = useState<CallState>('ringing');
  const [ringCountdown, setRingCountdown] = useState<number>(config.ringDurationSec || 10);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Subtitles & Speech
  const [assistantMessage, setAssistantMessage] = useState<string>('');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Determine initial spoken message based on trigger reason
  const getInitialMessage = () => {
    const name = config.userName || 'Aytaç';
    if (reason === 'ignition') {
      return `Merhaba ${name}, ev sıcaklığı ${currentTemp.toFixed(1)} dereceye düştü ve kombi ateşleme başlattı. Hedefi ${targetTemp.toFixed(1)} dereceye ayarladım. Kombi açık kalsın mı?`;
    }
    if (reason === 'low_temp') {
      return `Merhaba ${name}, oda sıcaklığı ${currentTemp.toFixed(1)} dereceye geriledi. Konforun için kombiyi çalıştırmamı ister misin?`;
    }
    if (reason === 'target_reached') {
      return `Merhaba ${name}, ev sıcaklığı istenen ${targetTemp.toFixed(1)} dereceye ulaştı. Kombi tasarruf moduna geçti, bilgin olsun!`;
    }
    // Manual test
    return `Merhaba ${name}, bu bir sesli arama testidir! Ev sıcaklığı ${currentTemp.toFixed(1)} derece, kombi ${isKombiActive ? 'aktif yanıyor' : 'beklemede'}. Bana "Teşekkürler kapat" diyebilirsin.`;
  };

  // 1. Text-to-Speech (TTS) Voice Synthesis
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !config.speechSynthesisEnabled) {
      setTimeout(() => onEnd?.(), 2500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Find Turkish voice if available
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find((v) => v.lang.startsWith('tr'));
      if (trVoice) {
        utterance.voice = trVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  };

  // 2. Speech-to-Text (STT) Microphone Recognition
  const startListening = () => {
    if (typeof window === 'undefined' || !config.speechRecognitionEnabled) return;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not supported on this browser');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'tr-TR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserTranscript(transcript);
        handleUserSpeech(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start failed', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // 3. Process User Voice Command
  const handleUserSpeech = (speech: string) => {
    const lower = speech.toLowerCase().trim();
    const name = config.userName || 'Aytaç';

    if (
      lower.includes('teşekkür') ||
      lower.includes('sagol') ||
      lower.includes('sağol') ||
      lower.includes('kapat') ||
      lower.includes('tamam') ||
      lower.includes('kalsın') ||
      lower.includes('eyvallah')
    ) {
      stopListening();
      const response = `Rica ederim ${name}, sıcaklığı kontrol altında tutuyorum. İyi günler!`;
      setAssistantMessage(response);
      speakText(response, () => {
        endCallCleanly();
      });
    } else if (lower.includes('23') || lower.includes('yirmi üç')) {
      onSetTargetTemp?.(23.0);
      const response = `Hedef sıcaklığı 23 dereceye ayarladım ${name}. Kombi buna göre çalışacak.`;
      setAssistantMessage(response);
      speakText(response);
    } else if (lower.includes('kombiyi kapat') || lower.includes('durdur')) {
      const response = `Anlaşıldı ${name}, kombiyi durdurma komutunu iletiyorum.`;
      setAssistantMessage(response);
      speakText(response, () => {
        endCallCleanly();
      });
    }
  };

  // 4. Quick Response Chip Click
  const handleQuickReply = (text: string) => {
    triggerHaptic('selection');
    setUserTranscript(text);
    handleUserSpeech(text);
  };

  // 5. Clean termination
  const endCallCleanly = () => {
    stopRingtone();
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    playCallEndedSound();
    setCallState('ended');

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // 6. Handle Ringing Timeout (10 seconds unanswered)
  const handleRingTimeout = () => {
    stopRingtone();
    playMissedCallSound();
    setCallState('missed');

    // Send persistent notification through Service Worker / Web Notification
    const title = `📞 Cevapsız Asistan Araması (${config.userName || 'Aytaç'})`;
    const body = `Oda sıcaklığı ${currentTemp.toFixed(1)}°C, kombi ${
      isKombiActive ? 'aktif ateşlemede' : 'tasarruf modunda'
    }. Aramaya yanıt verilemedi.`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_MISSED_CALL_NOTIFICATION',
        title,
        body,
      });
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
        });
      } catch {}
    }

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // 7. Answer the Call
  const handleAnswerCall = () => {
    triggerHaptic('success');
    stopRingtone();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setCallState('in_call');
    setCallDurationSec(0);

    // Start in-call duration timer
    durationIntervalRef.current = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);

    // Initial greeting
    const greeting = getInitialMessage();
    setAssistantMessage(greeting);

    // Speak initial greeting, then activate mic to listen to Aytaç
    speakText(greeting, () => {
      startListening();
    });
  };

  // 8. Lifecycle & Setup when opened
  useEffect(() => {
    if (!isOpen) {
      stopRingtone();
      stopListening();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      return;
    }

    // Reset state
    setCallState('ringing');
    setRingCountdown(config.ringDurationSec || 10);
    setCallDurationSec(0);
    setUserTranscript('');
    setAssistantMessage('');

    // Start Ringtone & Vibration
    startRingtone(config.soundRingtoneEnabled, config.vibrationEnabled);

    // 10-second Ringing Countdown
    countdownIntervalRef.current = setInterval(() => {
      setRingCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleRingTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      stopRingtone();
      stopListening();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, config.ringDurationSec]);

  if (!isOpen || typeof document === 'undefined') return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex flex-col justify-between items-center bg-gradient-to-b from-[#070913] via-[#0d1222] to-[#05060b] text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* ── TOP STATUS BAR ── */}
      <div className="relative z-10 w-full px-6 pt-6 flex flex-col items-center">
        {callState === 'ringing' ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold tracking-widest flex items-center gap-1.5 animate-pulse">
              <Phone className="w-3.5 h-3.5 animate-bounce" />
              <span>GELEN ASİSTAN ÇAĞRISI</span>
            </span>
            <div className="text-[11px] font-mono text-white/50 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>
                Cevaplanmazsa bildirim atılacak: <b className="text-amber-400 font-bold">{ringCountdown} sn</b>
              </span>
            </div>
          </div>
        ) : callState === 'in_call' ? (
          <div className="flex flex-col items-center gap-1">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] font-bold tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SESLİ GÖRÜŞME AKTİF</span>
            </span>
            <span className="font-mono text-lg font-bold text-white tracking-widest mt-1">
              {formatTimer(callDurationSec)}
            </span>
          </div>
        ) : callState === 'missed' ? (
          <div className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 font-mono text-xs font-bold animate-pulse">
            ✕ Cevapsız Çağrı · Bildirim Gönderildi
          </div>
        ) : (
          <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/60 font-mono text-xs">
            Görüşme Sonlandırıldı
          </div>
        )}
      </div>

      {/* ── CENTER: CALLER AVATAR & TELEMETRY ── */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4 max-w-sm w-full">
        {/* Pulsing Avatar Rings */}
        <div className="relative mb-5">
          {callState === 'ringing' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping duration-1000" />
              <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-pulse duration-700" />
            </>
          )}

          {/* Caller Photo / Mascot Avatar */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#141b2d] to-[#1f2b48] border-2 border-cyan-400/60 shadow-[0_10px_30px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden">
            <span className="text-5xl select-none">🤖</span>
          </div>

          {/* Online badge */}
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0d1222] flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-xl font-black text-white tracking-tight">TermoBot Asistan</h2>
        <p className="text-xs text-white/60 mt-0.5 font-medium">Akıllı Ev & Kombi Otomasyonu</p>

        {/* Telemetry pill */}
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs">
          <span className="text-white font-bold flex items-center gap-1">
            {isKombiActive ? (
              <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
            <span>{currentTemp.toFixed(1)}°C</span>
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/70 font-mono text-[11px]">Hedef: {targetTemp.toFixed(1)}°C</span>
        </div>

        {/* ── IN-CALL DIALOGUE / SUBTITLES ── */}
        {callState === 'in_call' && (
          <div className="mt-6 w-full flex flex-col gap-2.5 animate-in fade-in duration-300">
            {/* Assistant Voice Bubble */}
            {assistantMessage && (
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md text-cyan-200 text-xs shadow-lg">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>TermoBot Konuşuyor:</span>
                </div>
                <p className="leading-relaxed font-medium">{assistantMessage}</p>
              </div>
            )}

            {/* User Speech Recognition Bubble */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isListening ? 'bg-emerald-400 animate-ping' : 'bg-white/20'
                  }`}
                />
                <span className="text-white/80 truncate text-[11px]">
                  {userTranscript ? `Siz: "${userTranscript}"` : isListening ? 'Sizi dinliyor, cevap verin...' : 'Mikrofon hazır'}
                </span>
              </div>
              <Mic className={`w-3.5 h-3.5 shrink-0 ${isListening ? 'text-emerald-400' : 'text-white/40'}`} />
            </div>

            {/* Quick Response Chips */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {[
                'Teşekkürler, kapatabilirsin',
                'Kombi açık kalsın',
                'Hedefi 23°C yap',
                'Kombiyi durdur',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickReply(chip)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[10.5px] font-medium border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CALL CONTROLS (AUTHENTIC ANDROID UI) ── */}
      <div className="relative z-10 w-full px-8 pb-10 flex flex-col items-center">
        {callState === 'ringing' ? (
          /* Ringing Controls: Red Decline & Green Answer */
          <div className="w-full max-w-xs flex items-center justify-between">
            {/* Red Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  stopRingtone();
                  onClose();
                }}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(220,38,38,0.5)] cursor-pointer active:scale-90 transition-all"
                title="Aramayı Reddet"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-semibold text-white/70">Reddet</span>
            </div>

            {/* Middle Swipe/Tap Hint */}
            <div className="flex flex-col items-center text-center px-2">
              <span className="text-[10px] text-white/40 font-mono tracking-wider">CEVAPLA</span>
              <span className="text-xs text-emerald-400 animate-pulse">▲</span>
            </div>

            {/* Green Answer Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAnswerCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.6)] cursor-pointer active:scale-90 transition-all animate-bounce"
                title="Aramayı Cevapla"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-semibold text-emerald-400">Cevapla</span>
            </div>
          </div>
        ) : callState === 'in_call' ? (
          /* In-Call Controls: Mute, Speaker, Red End Call */
          <div className="w-full max-w-xs flex flex-col items-center gap-5">
            {/* Action buttons row */}
            <div className="flex items-center justify-center gap-6">
              {/* Mute Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  isMuted ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/10 text-white border-white/10'
                }`}
                title={isMuted ? 'Mikrofonu Aç' : 'Sesi Kapat'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Speaker Button */}
              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  isSpeakerOn ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-white/10 text-white border-white/10'
                }`}
                title="Hoparlör"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            {/* Red End Call Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={endCallCleanly}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(220,38,38,0.6)] cursor-pointer active:scale-90 transition-all"
                title="Görüşmeyi Kapat"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-semibold text-red-400">Görüşmeyi Kapat</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};
