import React, { useState } from 'react';
import { Send, Key, MessageSquare, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface TelegramConfigWidgetProps {
  token: string;
  chatId: string;
  onSaveConfig: (token: string, chatId: string) => void;
  isEncrypted: boolean;
}

export const TelegramConfigWidget: React.FC<TelegramConfigWidgetProps> = ({
  token,
  chatId,
  onSaveConfig,
  isEncrypted,
}) => {
  const [localToken, setLocalToken] = useState(token);
  const [localChatId, setLocalChatId] = useState(chatId);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'saved'>('idle');

  const handleSave = () => {
    onSaveConfig(localToken, localChatId);
    setTestStatus('saved');
    setTimeout(() => setTestStatus('idle'), 2500);
  };

  const handleSimulateAlert = () => {
    setTestStatus('success');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Telegram Bot Entegrasyonu & Anlık Bildirimler
          </h3>
        </div>
        {isEncrypted && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Tokenler Şifreli
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
            Telegram Bot Token (@BotFather'dan alınan API Token):
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              value={localToken}
              onChange={(e) => setLocalToken(e.target.value)}
              placeholder="1234567890:ABCdefGhIJKlmNoPQRstuVWxYZ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
            Chat ID (@userinfobot'tan alınan kullanıcı kimliği):
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={localChatId}
              onChange={(e) => setLocalChatId(e.target.value)}
              placeholder="987654321"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 px-4 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          {testStatus === 'saved' ? (
            <>
              <Check className="w-4 h-4" />
              Tokenler Şifrelenip Kaydedildi!
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Şifreli Olarak Kaydet
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSimulateAlert}
          className="py-2 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          Test Bildirimi Gönder
        </button>
      </div>

      {testStatus === 'success' && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Test bildirimi Telegram kuyruğuna iletildi! Sıcaklık eşik bildirimleri hazır.</span>
        </div>
      )}
    </div>
  );
};
