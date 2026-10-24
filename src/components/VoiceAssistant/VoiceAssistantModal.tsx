import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Flame,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { translations, type Language } from '../../utils/i18n.ts';
import type { ThemeMode } from '../../types.ts';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  targetTemp: number;
  currentTemp: number;
  isKombiActive: boolean;
  flameLevelPercent: number;
  waterPressure?: number;
  todayActiveText: string;
  onSetTargetTemp: (temp: number) => void;
  onNavigateToTab: (tabIdx: number) => void;
  themeMode?: ThemeMode;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  lang = 'tr',
  targetTemp,
  currentTemp,
  isKombiActive,
  flameLevelPercent,
  waterPressure = 1.6,
  todayActiveText,
  onSetTargetTemp,
  onNavigateToTab,
  themeMode = 'glass',
}) => {
  const t = translations[lang] || translations.tr;
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');
  const [manualText, setManualText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'tr' ? 'tr-TR' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        if (event.results[0].isFinal) {
          executeCommand(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setFeedback('Mikrofon erişim izni verilmedi. Komutunuzu aşağıdaki kutudan yazabilirsiniz.');
          setFeedbackType('error');
        } else if (event.error !== 'no-speech') {
          setFeedback(`Ses algılanamadı: ${event.error}`);
          setFeedbackType('error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition init error:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [lang]);

  // Start listening automatically when modal opens
  useEffect(() => {
    if (isOpen && isSupported && recognitionRef.current) {
      setTranscript('');
      setFeedback(null);
      try {
        recognitionRef.current.start();
      } catch (_) {
        // already started or busy
      }
    } else if (!isOpen && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      setIsListening(false);
    }
  }, [isOpen, isSupported]);

  // Text-To-Speech function
  const speakResponse = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'tr' ? 'tr-TR' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setTranscript('');
      setFeedback(null);
      try {
        recognitionRef.current.start();
      } catch (_) {}
    }
  };

  // Command Execution Engine (Türkçe & English)
  const executeCommand = (cmd: string) => {
    const raw = cmd.toLowerCase().trim();
    if (!raw) return;

    // 1. Sıcaklık Sayısal Ayarı (Örn: "23 yap", "sıcaklığı 24.5 yap", "hedefi 22 dereceye ayarla", "21")
    const tempMatch = raw.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:derece|°c|°|c)?/i);
    const hasSetKeyword =
      raw.includes('yap') ||
      raw.includes('ayarla') ||
      raw.includes('olsun') ||
      raw.includes('set') ||
      raw.includes('make') ||
      raw.includes('derece');

    if (tempMatch && (hasSetKeyword || raw.includes('sıcaklık') || raw.includes('hedef'))) {
      const val = parseFloat(tempMatch[1].replace(',', '.'));
      if (val >= 10 && val <= 35) {
        onSetTargetTemp(val);
        const reply = lang === 'tr'
          ? `Hedef sıcaklık ${val}°C olarak ayarlandı.`
          : `Target temperature set to ${val}°C.`;
        setFeedback(`✓ ${reply}`);
        setFeedbackType('success');
        speakResponse(reply);
        return;
      }
    }

    // 2. Sıcaklık Bağıl Değişimi (Örn: "sıcaklığı artır", "1 derece yükselt", "daha sıcak yap", "soğut")
    if (raw.includes('artır') || raw.includes('yükselt') || raw.includes('daha sıcak') || raw.includes('increase') || raw.includes('warmer')) {
      const newTemp = Math.min(32, Math.round((targetTemp + 1) * 2) / 2);
      onSetTargetTemp(newTemp);
      const reply = lang === 'tr'
        ? `Sıcaklık 1 derece artırıldı, yeni hedef ${newTemp}°C.`
        : `Temperature increased, new target ${newTemp}°C.`;
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('düşür') || raw.includes('azalt') || raw.includes('daha soğuk') || raw.includes('soğut') || raw.includes('decrease') || raw.includes('cooler')) {
      const newTemp = Math.max(10, Math.round((targetTemp - 1) * 2) / 2);
      onSetTargetTemp(newTemp);
      const reply = lang === 'tr'
        ? `Sıcaklık 1 derece düşürüldü, yeni hedef ${newTemp}°C.`
        : `Temperature decreased, new target ${newTemp}°C.`;
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    // 3. Mod Komutları (Eko, Gece, Konfor, Dışarı, Boost)
    if (raw.includes('eko') || raw.includes('tasarruf') || raw.includes('ekonomi') || raw.includes('eco')) {
      onSetTargetTemp(20.0);
      const reply = lang === 'tr'
        ? 'Eko tasarruf modu aktif edildi, hedef 20°C.'
        : 'Eco saving mode activated, target 20°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('gece') || raw.includes('uyku') || raw.includes('night') || raw.includes('sleep')) {
      onSetTargetTemp(19.0);
      const reply = lang === 'tr'
        ? 'Gece modu aktif edildi, hedef 19°C.'
        : 'Night mode activated, target 19°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('konfor') || raw.includes('comfort')) {
      onSetTargetTemp(22.5);
      const reply = lang === 'tr'
        ? 'Konfor modu aktif edildi, hedef 22.5°C.'
        : 'Comfort mode activated, target 22.5°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('dışarı') || raw.includes('evde yokum') || raw.includes('away')) {
      onSetTargetTemp(17.0);
      const reply = lang === 'tr'
        ? 'Dışarı modu aktif edildi, hedef 17°C.'
        : 'Away mode activated, target 17°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('boost') || raw.includes('hızlı ısın') || raw.includes('hızlı')) {
      onSetTargetTemp(25.0);
      const reply = lang === 'tr'
        ? 'Boost hızlı ısınma devrede, hedef 25°C.'
        : 'Boost heating activated, target 25°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    // 4. Kombi Kapatma & Açma
    if (raw.includes('kapat') || raw.includes('söndür') || raw.includes('durdur') || raw.includes('turn off')) {
      onSetTargetTemp(15.0);
      const reply = lang === 'tr'
        ? 'Kombi kapatıldı ve donma koruma moduna (15°C) alındı.'
        : 'Boiler turned off, set to freeze protection (15°C).';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('aç') || raw.includes('çalıştır') || raw.includes('yak') || raw.includes('turn on')) {
      onSetTargetTemp(23.0);
      const reply = lang === 'tr'
        ? 'Kombi çalıştırıldı, hedef 23°C olarak ayarlandı.'
        : 'Boiler turned on, target set to 23°C.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    // 5. Sekme / Ekran Geçiş Komutları
    if (raw.includes('rapor') || raw.includes('fatura') || raw.includes('tüketim') || raw.includes('grafik') || raw.includes('report') || raw.includes('bill')) {
      onNavigateToTab(2);
      const reply = lang === 'tr' ? 'Tüketim ve Rapor ekranı açıldı.' : 'Opening Report & Billing screen.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('hava') || raw.includes('yağmur') || raw.includes('weather') || raw.includes('forecast')) {
      onNavigateToTab(1);
      const reply = lang === 'tr' ? 'Hava durumu ekranı açıldı.' : 'Opening Weather screen.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('program') || raw.includes('plan') || raw.includes('zaman') || raw.includes('schedule')) {
      onNavigateToTab(3);
      const reply = lang === 'tr' ? 'Haftalık program ekranı açıldı.' : 'Opening Schedule screen.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    if (raw.includes('termostat') || raw.includes('ana sayfa') || raw.includes('termo') || raw.includes('home')) {
      onNavigateToTab(0);
      const reply = lang === 'tr' ? 'Ana termostat ekranına dönüldü.' : 'Returning to Main Thermostat screen.';
      setFeedback(`✓ ${reply}`);
      setFeedbackType('success');
      speakResponse(reply);
      return;
    }

    // 6. Bilgi & Durum Sorguları
    if (raw.includes('kaç derece') || raw.includes('sıcaklık kaç') || raw.includes('oda nasıl') || raw.includes('what temperature')) {
      const reply = lang === 'tr'
        ? `Oda sıcaklığı ${currentTemp}°C, hedef ${targetTemp}°C.`
        : `Room temperature is ${currentTemp}°C, target is ${targetTemp}°C.`;
      setFeedback(`ℹ️ ${reply}`);
      setFeedbackType('info');
      speakResponse(reply);
      return;
    }

    if (raw.includes('yanıyor mu') || raw.includes('kombi durumu') || raw.includes('ateşleme') || raw.includes('is firing')) {
      const reply = isKombiActive
        ? (lang === 'tr' ? `Kombi şu an aktif yanıyor, modülasyon seviyesi %${flameLevelPercent}.` : `Boiler is actively firing at ${flameLevelPercent}% modulation.`)
        : (lang === 'tr' ? 'Kombi şu an beklemede, ateşleme yok.' : 'Boiler is currently in standby.');
      setFeedback(`ℹ️ ${reply}`);
      setFeedbackType('info');
      speakResponse(reply);
      return;
    }

    if (raw.includes('ne kadar yandı') || raw.includes('çalışma süresi') || raw.includes('kaç saat') || raw.includes('how long')) {
      const reply = lang === 'tr'
        ? `Kombi bugün ${todayActiveText} çalıştı.`
        : `Boiler has run for ${todayActiveText} today.`;
      setFeedback(`ℹ️ ${reply}`);
      setFeedbackType('info');
      speakResponse(reply);
      return;
    }

    if (raw.includes('basınç') || raw.includes('su basıncı') || raw.includes('bar') || raw.includes('pressure')) {
      const reply = lang === 'tr'
        ? `Kombi su basıncı ${waterPressure.toFixed(1)} bar, ideal aralıkta.`
        : `Water pressure is ${waterPressure.toFixed(1)} bar, in normal range.`;
      setFeedback(`ℹ️ ${reply}`);
      setFeedbackType('info');
      speakResponse(reply);
      return;
    }

    // Eşleşmeyen komut
    const notUnderstood = lang === 'tr'
      ? `"${cmd}" komutu anlaşılamadı. Sıcaklık (örn: "23 yap"), mod veya durum sorabilirsiniz.`
      : `Command "${cmd}" not recognized. Try "set 23", "eco mode", or "is boiler firing?".`;
    setFeedback(notUnderstood);
    setFeedbackType('error');
    speakResponse(notUnderstood);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    executeCommand(manualText);
    setManualText('');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.18] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl'
            : isGlass
            ? 'bg-slate-950/75 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white'
            : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isObsidian
              ? 'border-white/[0.08] bg-[#161324]/80'
              : isGlass
              ? 'border-white/15 bg-white/[0.06]'
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`font-black text-sm flex items-center gap-1.5 ${
                  isObsidian || isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}
              >
                <span>{t.voiceAssistantTitle}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  {lang === 'tr' ? 'Türkçe' : 'EN'}
                </span>
              </h3>
              <p
                className={`text-[11px] ${
                  isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.voiceAssistantSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                ttsEnabled
                  ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={ttsEnabled ? 'Sesli Yanıt Açık' : 'Sesli Yanıt Kapalı'}
              aria-label="Sesli Yanıt"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Listening Orb / Waveform Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="relative my-3 flex items-center justify-center">
            {/* Animated Pulsing Waves */}
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 animate-ping duration-1000" />
                <div className="absolute w-24 h-24 rounded-full bg-indigo-500/30 animate-pulse duration-700" />
              </>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-400/30'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:scale-105 shadow-blue-500/30 active:scale-95'
              }`}
              title={isListening ? 'Dinlemeyi durdur' : 'Dinlemeyi başlat'}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">
            {isListening ? (
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {t.voiceAssistantListening}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Mikrofona basarak konuşun veya aşağıdaki kutuyu kullanın
              </span>
            )}
          </p>

          {/* Real-time transcribed text */}
          <div className="min-h-[46px] w-full mt-3 px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-center">
            <span className={`text-xs font-semibold ${transcript ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
              {transcript ? `"${transcript}"` : t.voiceAssistantSpeakNow}
            </span>
          </div>

          {/* Feedback & Action Result */}
          {feedback && (
            <div
              className={`w-full mt-3 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 text-left animate-in slide-in-from-bottom-2 ${
                feedbackType === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : feedbackType === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              }`}
            >
              {feedbackType === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : feedbackType === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <Flame className="w-4 h-4 shrink-0 text-blue-600" />
              )}
              <span className="flex-1">{feedback}</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.voiceAssistantQuickPrompts}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              '23 derece yap',
              'Sıcaklığı 1 derece artır',
              'Eko mod',
              'Gece modu',
              'Kombi yanıyor mu?',
              'Kaç derece?',
              'Raporu aç',
              'Kombiyi kapat',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setTranscript(chip);
                  executeCommand(chip);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-all cursor-pointer active:scale-95 shadow-2xs hover:border-blue-300"
              >
                "{chip}"
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Manual Text Input */}
        <form
          onSubmit={handleManualSubmit}
          className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={t.voiceAssistantPlaceholder}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gönder</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
