import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Flame,
  Radio,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { translations, type Language } from '../../utils/i18n.ts';
import type { ThemeMode } from '../../types.ts';

interface GoogleHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  firebaseUrl: string;
  currentTemp: number;
  targetTemp: number;
  isKombiActive: boolean;
  onSetTargetTemp: (temp: number) => void;
  themeMode?: ThemeMode;
}

export const GoogleHomeModal: React.FC<GoogleHomeModalProps> = ({
  isOpen,
  onClose,
  lang = 'tr',
  firebaseUrl,
  currentTemp,
  targetTemp,
  isKombiActive,
  onSetTargetTemp,
  themeMode = 'glass',
}) => {
  const t = translations[lang] || translations.tr;
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const sampleFunctionsCode = `// Firebase Cloud Functions - Google Smart Home Fulfillment
const functions = require('firebase-functions');
const { smarthome } = require('actions-on-google');

const app = smarthome();

// 1. SYNC: Cihaz Tanımlama
app.onSync((body) => ({
  requestId: body.requestId,
  payload: {
    agentUserId: 'kombi-user-01',
    devices: [{
      id: 'kombi_termostat_01',
      type: 'action.devices.types.THERMOSTAT',
      traits: ['action.devices.traits.TemperatureSetting'],
      name: { name: 'Kombi Termostatı', defaultNames: ['Kombi'], nicknames: ['Termostat'] },
      willReportState: true,
      attributes: {
        availableThermostatModes: ['off', 'heat', 'eco'],
        thermostatTemperatureUnit: 'C'
      }
    }]
  }
}));

// 2. QUERY: Canlı Durum Sorgulama
app.onQuery((body) => ({
  requestId: body.requestId,
  payload: {
    devices: {
      kombi_termostat_01: {
        thermostatMode: '${isKombiActive ? 'heat' : 'off'}',
        thermostatTemperatureAmbient: ${currentTemp},
        thermostatTemperatureSetpoint: ${targetTemp}
      }
    }
  }
}));

// 3. EXECUTE: Google Home'dan Sıcaklık Ayarlama Komutu
app.onExecute(async (body) => {
  const command = body.inputs[0].payload.commands[0];
  const execution = command.execution[0];
  if (execution.command === 'action.devices.commands.ThermostatTemperatureSetpoint') {
    const target = execution.params.thermostatTemperatureSetpoint;
    // Firebase Realtime DB'ye yazar
    await admin.database().ref('/kombi').update({ hedefSicaklik: target });
  }
  return { requestId: body.requestId, payload: { commands: [{ ids: ['kombi_termostat_01'], status: 'SUCCESS' }] } };
});

exports.smarthome = functions.https.onRequest(app);

// 4. OAuth Uç Noktaları (Google Home Hesap Eşleme için)
exports.fakeauth = functions.https.onRequest((req, res) => {
  const redirectUri = String(req.query.redirect_uri) + '?code=kombi_code_123&state=' + String(req.query.state);
  res.redirect(redirectUri);
});

exports.faketoken = functions.https.onRequest((req, res) => {
  res.status(200).json({
    token_type: 'bearer',
    access_token: 'kombi_access_token',
    refresh_token: 'kombi_refresh_token',
    expires_in: 3600
  });
});`;

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(sampleFunctionsCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSimulateCommand = (cmd: string, newTarget?: number) => {
    if (newTarget !== undefined) {
      onSetTargetTemp(newTarget);
    }
    setSimulationMsg(`🗣️ "${cmd}" ➔ Google Asistan emri başarıyla Firebase'e iletti!`);
    setTimeout(() => setSimulationMsg(null), 3500);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.18] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl'
            : isGlass
            ? 'bg-slate-950/75 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white'
            : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isObsidian
              ? 'border-white/[0.08] bg-[#161324]/80'
              : isGlass
              ? 'border-white/15 bg-white/[0.06]'
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-amber-500 to-emerald-500 p-0.5 shadow-md">
              <div
                className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isObsidian ? 'bg-[#181427]' : isGlass ? 'bg-slate-900/60' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <span className="text-base">🏠</span>
              </div>
            </div>
            <div>
              <h3
                className={`font-black text-sm flex items-center gap-2 ${
                  isObsidian || isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}
              >
                <span>Google Home & Asistan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t.googleHomeBadge}
                </span>
              </h3>
              <p
                className={`text-[11px] ${
                  isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.googleHomeSub}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isObsidian
                ? 'text-[#c3b6e8] hover:text-white hover:bg-white/[0.08]'
                : isGlass
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
          {/* Status Box */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Firebase Realtime DB Köprüsü Devrede
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {t.googleHomeDesc}
              </p>
              <div className="mt-2 text-[10px] font-mono text-blue-700 dark:text-blue-300 truncate bg-white/70 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                URL: {firebaseUrl || 'https://kombi-kontrol-babd5-default-rtdb.firebaseio.com'}
              </div>
            </div>
          </div>

          {/* Device Profile in Google Home */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Google Home Cihaz Profili (Akıllı Termostat)
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Cihaz Tipi</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">THERMOSTAT</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Canlı Oda Sıcaklığı</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{currentTemp}°C</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Hedef Sıcaklık</span>
                <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{targetTemp}°C</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Kombi Yanma Durumu</span>
                <span className="font-bold font-mono text-orange-500">
                  {isKombiActive ? 'Aktif Ateşleme 🔥' : 'Beklemede ❄️'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Simulator Test Buttons */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300/60 dark:border-amber-800/60">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Google Asistan Komut Simülatörü
            </h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2.5">
              Google Home cihazınızdan söylenmiş gibi aşağıdaki komutları test edebilirsiniz:
            </p>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateCommand('Hey Google, oturma odasını 23.5 derece yap', 23.5)}
                className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between font-medium transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <span>🗣️ "Hey Google, oturma odasını 23.5 derece yap"</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px]">Test Et</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateCommand('Hey Google, kombiyi Eko moda al', 20.0)}
                className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between font-medium transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <span>🗣️ "Hey Google, kombiyi Eko moda al"</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">Test Et</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateCommand(`Hey Google, oda sıcaklığı kaç? (${currentTemp}°C)`)}
                className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between font-medium transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <span>🗣️ "Hey Google, oda sıcaklığı kaç?"</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px]">Test Et</span>
              </button>
            </div>

            {simulationMsg && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] animate-in fade-in flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{simulationMsg}</span>
              </div>
            )}
          </div>

          {/* 3 Step Setup Guide */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2.5">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs">
              Google Home'a Bağlama Adımları (3 Basit Adım)
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Google Actions Console:</strong> console.actions.google.com adresinden yeni bir "Smart Home" projesi oluşturun.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Fulfillment Webhook (Haberleşme Köprüsü):</strong> Google Asistan'ın duyduğu sesli komutları Firebase'inize ileteceği internet adresidir. Aşağıdaki hazır Cloud Function kodunu Firebase'e yüklediğinizde oluşan linki bu kutuya yapıştırırsınız.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Google Home Uygulaması:</strong> Telefonunuzda Google Home uygulamasını açın, <em>"Cihaz Ekle &gt; Google ile Çalışır"</em> menüsünden projenizi seçin.
              </li>
            </ol>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <span className="text-[10px] text-slate-400">Hazır Firebase Cloud Functions Kodu:</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
