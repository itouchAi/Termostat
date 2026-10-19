import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Cloud,
  Key,
  Check,
  ShieldCheck,
  Database,
  Lock,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Bell,
  BellOff,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';
import { translations, type Language } from '../utils/i18n.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbUrl: string;
  apiKey: string;
  onSaveCloudSettings: (dbUrl: string, apiKey: string) => void;
  isConnected: boolean;
  onOpenVaultModal?: () => void;
  onOpenGoogleHomeModal?: () => void;
  onResetHistoricalData?: () => void;
  lang?: Language;
  isWeatherNotificationsEnabled?: boolean;
  onToggleWeatherNotifications?: (enabled: boolean) => void;
  onTriggerTestNotification?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dbUrl,
  apiKey,
  onSaveCloudSettings,
  isConnected,
  onOpenVaultModal,
  onOpenGoogleHomeModal,
  onResetHistoricalData,
  lang = 'tr',
  isWeatherNotificationsEnabled = true,
  onToggleWeatherNotifications,
  onTriggerTestNotification,
}) => {
  const t = translations[lang] || translations.tr;
  const [localUrl, setLocalUrl] = useState(dbUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  // Critical alerts toggle
  const [isCriticalAlertsEnabled, setIsCriticalAlertsEnabled] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedVal = localStorage.getItem('notifications_critical_alerts');
      return savedVal !== 'false';
    }
    return true;
  });

  const [testSent, setTestSent] = useState<boolean>(false);

  const handleToggleCritical = (enabled: boolean) => {
    setIsCriticalAlertsEnabled(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notifications_critical_alerts', String(enabled));
    }
  };

  const handleTriggerTest = () => {
    onTriggerTestNotification?.();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  // Reset confirmation state
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSave = () => {
    onSaveCloudSettings(localUrl.trim(), localKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleExecuteReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('smart_thermostat_historical_db_v2');
        localStorage.removeItem('daily_costs');
        localStorage.removeItem('gas_consumption_history');
        localStorage.removeItem('hourly_telemetry_logs');
        localStorage.setItem('live_daily_active_seconds', '0');
        localStorage.setItem('kombi_last_ignition_ts', String(Date.now()));
        localStorage.setItem('kombi_last_extinguish_ts', String(Date.now()));
        window.dispatchEvent(new Event('thermostat_history_reset'));
      } catch {}
    }
    onResetHistoricalData?.();
    setResetSuccess(true);
    setIsConfirmingReset(false);
    setTimeout(() => {
      setResetSuccess(false);
    }, 2800);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-slate-800 dark:text-white">
                {t.settingsModalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settingsModalSub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* ── ŞİFRELİ KASA & BİLDİRİMLER LİNKİ ── */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-indigo-950/40 rounded-2xl border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <span>{t.vaultCardTitle}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    AES-256
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {t.vaultCardSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVaultModal?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
              title="Şifreli kasa ve bildirim pop-up penceresini aç"
            >
              <span>{t.openVault}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── GOOGLE HOME & ASİSTAN ENTEGRASYONU ── */}
          <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-amber-500/10 dark:from-blue-950/40 dark:via-emerald-950/30 dark:to-amber-950/40 rounded-2xl border border-blue-400/40 dark:border-blue-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                <span className="text-sm">🏠</span>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 truncate">
                  <span>{t.googleHomeTitle}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    {t.googleHomeBadge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {t.googleHomeSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoogleHomeModal?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
              title="Google Home entegrasyonu ve simülatörünü aç"
            >
              <span>Yönet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── BİLDİRİM AYARLARI & OTOMASYON (3 Saatlik & Acil Emniyet Bildirimleri) ── */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {t.notifSectionTitle}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t.notifSectionSub}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Otomatik 3 Saatlik Bildirim Switch & Test Butonu */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-750 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWeatherNotificationsEnabled ? (
                    <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {t.notif3hTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleWeatherNotifications?.(!isWeatherNotificationsEnabled)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isWeatherNotificationsEnabled
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isWeatherNotificationsEnabled ? t.notifActive : t.notifInactive}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.notif3hDesc}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  ⏱️ Periyot: 3 Saatte Bir (Otomatik)
                </span>
                <button
                  type="button"
                  onClick={handleTriggerTest}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-amber-400/30"
                  title="Test bildirimi simülasyonu çalıştır"
                >
                  <Send className="w-3 h-3" />
                  <span>{testSent ? 'Bildirim Gönderildi!' : t.notifTestBtn}</span>
                </button>
              </div>
            </div>

            {/* 2. Acil & Kritik Güvenlik Bildirimleri Switch */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-750 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {t.notifCriticalTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCritical(!isCriticalAlertsEnabled)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isCriticalAlertsEnabled
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isCriticalAlertsEnabled ? t.notifActive : t.notifInactive}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.notifCriticalDesc}
              </p>

              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Basınç & Donma Koruma İzleyicisi Devrede</span>
              </div>
            </div>
          </div>

          {/* ── GEÇMİŞ VERİLERİ SIFIRLAMA BÖLÜMÜ (İstenen Özellik) ── */}
          <div className="p-3.5 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/60 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-rose-700 dark:text-rose-300 block">
                  {t.resetDataSectionTitle}
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                  {t.resetDataWarning}
                </p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 justify-center">
                <Check className="w-4 h-4" />
                <span>{t.resetDataSuccess}</span>
              </div>
            ) : isConfirmingReset ? (
              <div className="flex items-center gap-2 pt-1 border-t border-rose-200 dark:border-rose-900/60">
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  Evet, Tümünü Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full py-2 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-300 dark:border-rose-700/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.resetDataBtn}</span>
              </button>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Bulut Senkronizasyon Durumu:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {isConnected ? t.cloudSyncConnected : t.cloudSyncOffline}
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              {t.firebaseUrlLabel}
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
              {t.firebaseKeyLabel}
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
              Firebase yapılandırmanız ve sıcaklık programlarınız yerel AES-256 kasasında saklanır.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                {t.settingsSaved}
              </>
            ) : (
              t.saveSettings
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
