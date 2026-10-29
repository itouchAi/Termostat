import React, { useState } from 'react';
import {
  PhoneCall,
  Phone,
  Clock,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Mic,
  ChevronDown,
  Bell,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { VoiceCallConfig } from '../../types/voiceCall.ts';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface VoiceCallSettingsSectionProps {
  themeMode?: ThemeMode;
  config: VoiceCallConfig;
  onUpdateConfig: (newConfig: Partial<VoiceCallConfig>) => void;
  onLaunchCallTest: (reason: 'manual_test' | 'ignition' | 'low_temp') => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  headerPrefix?: React.ReactNode;
}

export const VoiceCallSettingsSection: React.FC<VoiceCallSettingsSectionProps> = ({
  themeMode = 'glass',
  config,
  onUpdateConfig,
  onLaunchCallTest,
  isOpen = false,
  onToggleOpen,
  headerPrefix,
}) => {
  const isTactile = themeMode === 'tactile_deck';
  const isObsidian = themeMode === 'obsidian_lavender';
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        triggerHaptic('success');
      }
    } catch {}
  };

  return (
    <div
      className={`rounded-2xl flex flex-col shadow-xs border transition-all duration-300 overflow-hidden ${
        isObsidian
          ? isOpen
            ? 'bg-[#181427] border-purple-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-[#151221] border-white/[0.08] hover:border-white/[0.18]'
          : isTactile
          ? isOpen
            ? 'bg-[#1c1929] border-emerald-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
            : 'bg-[#181523] border-t border-l border-white/[0.14] border-r border-black/70 border-b border-black/90 hover:border-white/25'
          : isOpen
          ? 'bg-white/10 border-white/25 backdrop-blur-md shadow-lg'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      {/* ── HEADER & MASTER TOGGLE ── */}
      <div
        onClick={onToggleOpen}
        className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {headerPrefix}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isTactile
                ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
              <span>AI Sesli Telefon Araması (Asistan)</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                10 sn Çalma
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
              Kombi ateşlendiğinde arar, sesli konuşur, cevaplanmazsa bildirim atar
            </p>
          </div>
        </div>

        {/* Master Toggle & Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onUpdateConfig({ enabled: !config.enabled });
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 ${
              config.enabled
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-1 ring-emerald-400/50'
                : 'bg-white/10 text-slate-400'
            }`}
          >
            <span>{config.enabled ? 'Açık ✓' : 'Kapalı'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── EXPANDED ACCORDION CONTENT ── */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3.5 border-t border-white/[0.08]">
          {/* ── BÜYÜK TEST ET / ŞİMDİ ARA BUTONU ── */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              onLaunchCallTest('manual_test');
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all cursor-pointer shadow-lg active:scale-98"
          >
            <Phone className="w-4 h-4 animate-bounce" />
            <span>📞 Şimdi Sesli Telefon Araması Başlat (10 sn Test)</span>
          </button>

          {/* ── 1. ÇALMA SÜRESİ (10 SANİYE) ── */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Arama Çalma Süresi (Cevap Alınmazsa Bildirime Düşer):</span>
            </span>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { sec: 5, label: '5 sn' },
                { sec: 10, label: '10 sn (Önerilen)' },
                { sec: 15, label: '15 sn' },
                { sec: 20, label: '20 sn' },
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onUpdateConfig({ ringDurationSec: item.sec });
                  }}
                  className={`py-1.5 px-1 rounded-xl text-center text-[10.5px] font-bold transition-all cursor-pointer border ${
                    config.ringDurationSec === item.sec
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 2. TETİKLEME SENARYOLARI ── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 px-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Hangi Durumlarda Telefon Çalsın?</span>
            </span>

            <div className="flex flex-col gap-2">
              {/* Ateşleme Başladığında Ara */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Kombi Ateşlendiğinde Ara</span>
                  <span className="text-[10px] text-white/60">
                    Kombi otomatik yandığında sizi arayıp bilgi verir ve onay sorar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ autoCallOnIgnition: !config.autoCallOnIgnition })}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                    config.autoCallOnIgnition ? 'bg-orange-500 text-slate-950 shadow-sm' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {config.autoCallOnIgnition ? 'Aktif ✓' : 'Kapalı'}
                </button>
              </div>

              {/* Düşük Sıcaklık Uyarısı */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Oda Sıcaklığı 19.5°C Altına Düşünce Ara</span>
                  <span className="text-[10px] text-white/60">
                    Ev soğuduğunda arayıp kombiyi açayım mı diye sesli sorar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ autoCallOnLowTemp: !config.autoCallOnLowTemp })}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                    config.autoCallOnLowTemp ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {config.autoCallOnLowTemp ? 'Aktif ✓' : 'Kapalı'}
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. SES VE TİTREŞİM AYARLARI ── */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-white">Zil Sesi</span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ soundRingtoneEnabled: !config.soundRingtoneEnabled })}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white cursor-pointer"
              >
                {config.soundRingtoneEnabled ? 'Açık 🔊' : 'Sessiz 🔇'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-white">Titreşim</span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ vibrationEnabled: !config.vibrationEnabled })}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white cursor-pointer"
              >
                {config.vibrationEnabled ? 'Açık 📳' : 'Kapalı'}
              </button>
            </div>
          </div>

          {/* ── 4. ARKA PLAN VE KİLİT EKRANI BİLGİLENDİRME & İZİN KARTI ── */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block text-[11.5px]">
                  Kilit Ekranı & Arka Planda Nasıl Çalışır?
                </span>
                <p className="text-[10.5px] text-blue-200/80 leading-relaxed mt-0.5">
                  Uygulama kapalıyken veya telefon kilitliyken sesli çağrının düşmesi için Android tarayıcısında (Chrome vb.)
                  <b>"Bildirim İzni"</b> verilmesi ve uygulamanın <b>"Ana Ekrana Ekle"</b> (PWA) yapılması gerekir.
                  Cevap vermezseniz 10 sn sonra kilit ekranınıza titreşimli cevapsız arama bildirimi düşer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-blue-500/20">
              <span className="text-[10px] text-white/60">
                Bildirim Durumu:{' '}
                <b className={notificationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                  {notificationPermission === 'granted' ? 'İzin Verildi ✓' : 'İzin Bekleniyor'}
                </b>
              </span>
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10.5px] cursor-pointer shadow-sm"
                >
                  Bildirim İznini Aç
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
