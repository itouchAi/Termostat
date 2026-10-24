import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock, Bell, Check } from 'lucide-react';
import { SecurityVaultWidget } from './Widgets/SecurityVaultWidget.tsx';
import { TelegramConfigWidget } from './Widgets/TelegramConfigWidget.tsx';
import type { ThemeMode } from '../types.ts';

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
  themeMode?: ThemeMode;
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
  themeMode = 'glass',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vault' | 'telegram'>('vault');
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.18] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl'
            : isGlass
            ? 'bg-slate-950/75 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 sm:pb-4 border-b shrink-0 ${
            isObsidian
              ? 'border-white/[0.08]'
              : isGlass
              ? 'border-white/15'
              : 'border-slate-100 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="vault-modal-title"
                className={`text-sm sm:text-base font-bold ${
                  isObsidian || isGlass ? 'text-white' : 'text-slate-800 dark:text-white'
                }`}
              >
                Şifreli Kasa & Bildirim Yönetimi
              </h2>
              <p
                className={`text-[11px] sm:text-xs ${
                  isObsidian ? 'text-[#c3b6e8]' : isGlass ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                AES-256 yerel şifreleme, PIN güvenliği ve Telegram bot bildirimleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pencereyi Kapat"
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all ${
              isObsidian
                ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                : isGlass
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
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
                : isObsidian
                ? 'bg-[#1e1930] text-slate-300 hover:bg-[#282142] border border-white/[0.08]'
                : isGlass
                ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'
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
                : isObsidian
                ? 'bg-[#1e1930] text-slate-300 hover:bg-[#282142] border border-white/[0.08]'
                : isGlass
                ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/15'
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
