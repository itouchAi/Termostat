import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock, Bell, Check } from 'lucide-react';
import { SecurityVaultWidget } from './Widgets/SecurityVaultWidget.tsx';
import { TelegramConfigWidget } from './Widgets/TelegramConfigWidget.tsx';

interface VaultNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVaultLocked: boolean;
  vaultPin: string;
  onSetPin: (pin: string) => void;
  onUnlockVault: (pin: string) => boolean;
  onLockVault: () => void;
  onExportBackup: () => void;
  onResetVault: () => void;
  telegramToken: string;
  telegramChatId: string;
  onSaveTelegram: (token: string, chatId: string) => void;
}

export const VaultNotificationsModal: React.FC<VaultNotificationsModalProps> = ({
  isOpen,
  onClose,
  isVaultLocked,
  vaultPin,
  onSetPin,
  onUnlockVault,
  onLockVault,
  onExportBackup,
  onResetVault,
  telegramToken,
  telegramChatId,
  onSaveTelegram,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vault' | 'telegram'>('vault');

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vault-modal-title" className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                Şifreli Kasa & Bildirim Yönetimi
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                AES-256 yerel şifreleme, PIN güvenliği ve Telegram bot bildirimleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pencereyi Kapat"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs for switching between Vault and Telegram */}
        <div className="flex items-center gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('vault')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'vault'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Şifreli Güvenlik Kasası</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('telegram')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'telegram'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Telegram Bildirimleri</span>
          </button>
        </div>

        {/* Modal Body with internal scrolling */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4 pr-1">
          {activeSubTab === 'vault' ? (
            <SecurityVaultWidget
              isLocked={isVaultLocked}
              hasCustomPin={!!vaultPin}
              onSetPin={onSetPin}
              onUnlockVault={onUnlockVault}
              onLockVault={onLockVault}
              onExportEncryptedBackup={onExportBackup}
              onResetVault={onResetVault}
            />
          ) : (
            <TelegramConfigWidget
              token={telegramToken}
              chatId={telegramChatId}
              onSaveConfig={onSaveTelegram}
              isEncrypted={true}
            />
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            🔒 Tüm şifreler tarayıcınızda AES-GCM ile korunur.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Tamam & Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
