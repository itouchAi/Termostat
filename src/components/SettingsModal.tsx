import React, { useState } from 'react';
import { X, Cloud, Key, Check, ShieldCheck, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbUrl: string;
  apiKey: string;
  onSaveCloudSettings: (dbUrl: string, apiKey: string) => void;
  isConnected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dbUrl,
  apiKey,
  onSaveCloudSettings,
  isConnected,
}) => {
  const [localUrl, setLocalUrl] = useState(dbUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCloudSettings(localUrl.trim(), localKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-slate-800 dark:text-white">
                Bulut & Firebase Ayarları
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dünyanın her yerinden kombiye erişim için Firebase Realtime DB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Bulut Senkronizasyon Durumu:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {isConnected ? '● Bağlı & Aktif' : '○ Çevrimdışı / Yerel Mod'}
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Firebase Database URL:
            </label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="https://kombi-projeniz-rtdb.firebaseio.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Firebase Web API Key:
            </label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSyDMULZx..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Firebase yapılandırmanız tarayıcınızın yerel AES-256 kasasında saklanır. İster Firebase ister çevrimdışı yerel depolama ile termostat tam fonksiyonel çalışır.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Kaydedildi!
              </>
            ) : (
              'Ayarları Kaydet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
