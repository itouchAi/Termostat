import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Download, RefreshCw, Check } from 'lucide-react';

interface SecurityVaultWidgetProps {
  isLocked: boolean;
  hasCustomPin: boolean;
  onSetPin: (pin: string) => void;
  onUnlockVault: (pin: string) => boolean;
  onLockVault: () => void;
  onExportEncryptedBackup: () => void;
  onResetVault: () => void;
}

export const SecurityVaultWidget: React.FC<SecurityVaultWidgetProps> = ({
  isLocked,
  hasCustomPin,
  onSetPin,
  onUnlockVault,
  onLockVault,
  onExportEncryptedBackup,
  onResetVault,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePinAction = () => {
    if (!pinInput || pinInput.length < 4) {
      setErrorMsg('PIN en az 4 haneli olmalıdır.');
      return;
    }
    setErrorMsg('');

    if (isLocked) {
      const ok = onUnlockVault(pinInput);
      if (ok) {
        setSuccessMsg('Kasa kilidi başarıyla açıldı!');
        setPinInput('');
        setTimeout(() => setSuccessMsg(''), 2500);
      } else {
        setErrorMsg('Hatalı PIN kodu!');
      }
    } else {
      onSetPin(pinInput);
      setSuccessMsg('Yeni PIN kodu kaydedildi ve kasa kilitlendi!');
      setPinInput('');
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Yerel Şifreleme Kasası & Maksimum Güvenlik
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
          <Lock className="w-3.5 h-3.5" />
          AES-GCM 256-bit Aktif
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">
              Sıfır Bilgi (Zero-Knowledge) Yerel Güvenlik
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Tüm hedef sıcaklıklar, haftalık zamanlama takvimleri, Telegram bot anahtarları ve telemetri geçmişi tarayıcınızda PBKDF2 + AES-256 ile şifrelenir. Sunucuya açık metin asla gönderilmez.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Setup or Unlock */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            maxLength={8}
            placeholder={isLocked ? 'Kasayı açmak için PIN girin' : 'Yeni Güvenlik PIN Kodu Belirle'}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handlePinAction}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Kilidi Aç
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                {hasCustomPin ? 'PIN Güncelle & Kilitle' : 'PIN Oluştur & Kilitle'}
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-500 flex items-center gap-1 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
            <Check className="w-3.5 h-3.5" />
            {successMsg}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={onExportEncryptedBackup}
          className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5 font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Şifreli Yedeği İndir (.json)
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('Yerel olarak şifrelenmiş tüm veriler sıfırlansın mı?')) {
              onResetVault();
            }
          }}
          className="text-red-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Kasayı Sıfırla
        </button>
      </div>
    </div>
  );
};
