import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Server,
  Zap,
  ChevronDown,
} from 'lucide-react';
import type { EspEventLog, EspHardwareStatus } from '../../types/espDiagnostics.ts';
import { INITIAL_ESP_STATUS, INITIAL_ESP_LOGS } from '../../types/espDiagnostics.ts';
import type { ThemeMode } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface EspDiagnosticsSectionProps {
  themeMode?: ThemeMode;
  isConnected?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  headerPrefix?: React.ReactNode;
}

export const EspDiagnosticsSection: React.FC<EspDiagnosticsSectionProps> = ({
  themeMode = 'glass',
  isConnected = true,
  isOpen = false,
  onToggleOpen,
  headerPrefix,
}) => {
  const isTactile = themeMode === 'tactile_deck';
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';

  const [espStatus, setEspStatus] = useState<EspHardwareStatus>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('esp_hardware_status');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_ESP_STATUS;
  });

  const [logs, setLogs] = useState<EspEventLog[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('esp_event_logs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_ESP_LOGS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Restart modal state
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(3);

  // Sync logs from ESP Flash memory
  const handleSyncLogs = () => {
    triggerHaptic('medium');
    setIsSyncing(true);
    setSyncFeedback(null);

    setTimeout(() => {
      setIsSyncing(false);

      if (!isConnected) {
        // ESP is offline: cannot fetch data!
        setSyncFeedback({
          type: 'error',
          message: '⚠️ ESP Çevrimdışı: Donanıma ulaşılamadığı için yeni log çekilemedi. Son yerel kayıtlar gösteriliyor.',
        });
        triggerHaptic('heavy');
        setTimeout(() => setSyncFeedback(null), 4500);
        return;
      }

      // Simulated fresh offline events fetched from ESP LittleFS
      const newEvent: EspEventLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now() - 12000,
        type: 'offline_sync',
        title: 'ESP LittleFS Bellek Senkronizasyonu',
        details: 'ESP flaş belleğindeki çevrimdışı telemetri başarıyla uygulamaya aktarıldı.',
        wdtStatus: 'ok',
      };

      setLogs((prev) => {
        const updated = [newEvent, ...prev];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('esp_event_logs', JSON.stringify(updated));
        }
        return updated;
      });

      setEspStatus((prev) => ({
        ...prev,
        lastHeartbeat: Date.now(),
        offlineRecordedEventsCount: 0,
      }));

      setSyncFeedback({
        type: 'success',
        message: 'ESP flaş belleğindeki veriler başarıyla eşitlendi ✓',
      });
      setTimeout(() => setSyncFeedback(null), 3500);
      triggerHaptic('success');
    }, 1000);
  };

  // Trigger remote ESP restart
  const handleExecuteRestart = () => {
    if (!isConnected) {
      setSyncFeedback({
        type: 'error',
        message: '⚠️ ESP Çevrimdışı olduğu için uzaktan sıfırlama komutu iletilemedi.',
      });
      return;
    }

    triggerHaptic('heavy');
    setIsRestarting(true);
    setRestartCountdown(3);

    const timer = setInterval(() => {
      setRestartCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          finishRestart();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const finishRestart = () => {
    const rebootLog: EspEventLog = {
      id: `reboot-${Date.now()}`,
      timestamp: Date.now(),
      type: 'reboot',
      title: 'Donanımsal Reset Tamamlandı',
      details: 'Kullanıcı isteğiyle ESP.restart() komutu gönderildi. Watchdog WDT sıfırlandı.',
      wdtStatus: 'recovered',
    };

    setLogs((prev) => {
      const updated = [rebootLog, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('esp_event_logs', JSON.stringify(updated));
      }
      return updated;
    });

    setEspStatus((prev) => ({
      ...prev,
      lastHeartbeat: Date.now(),
      uptimeSeconds: 4,
      wdtResetCount: prev.wdtResetCount + 1,
    }));

    setIsRestarting(false);
    setShowRestartConfirm(false);
    setSyncFeedback({
      type: 'success',
      message: 'ESP cihazı başarıyla sıfırlandı ve yeniden bağlandı ✓',
    });
    setTimeout(() => setSyncFeedback(null), 4000);
    triggerHaptic('success');
  };

  // Clear logs completely
  const handleClearLogs = () => {
    triggerHaptic('medium');
    setLogs([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('esp_event_logs');
    }
    setSyncFeedback({
      type: 'success',
      message: 'ESP geçmiş olay kayıtları ve log hafızası temizlendi ✓',
    });
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Download logs as JSON
  const handleDownloadLogs = () => {
    triggerHaptic('light');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `esp-diagnostics-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
            ? 'bg-[#1c1929] border-amber-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
            : 'bg-[#181523] border-t border-l border-white/[0.14] border-r border-black/70 border-b border-black/90 hover:border-white/25'
          : isOpen
          ? 'bg-white/10 border-white/25 backdrop-blur-md shadow-lg'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      {/* ── HEADER ── */}
      <div
        onClick={onToggleOpen}
        className="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {headerPrefix}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isTactile
                ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-400 border border-amber-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-cyan-500/30'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
              <span>ESP Donanım Günlüğü & Çevrimdışı Raporlama</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isTactile
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                ESP32 / WDT
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
              Uygulama kapalıyken kaydedilen yanma süreleri, sıcaklık döngüleri ve kilitlenme logları
            </p>
          </div>
        </div>

        {/* Live ESP Online/Offline Status Beacon & Chevron */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canlı Bağlantı</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Çevrimdışı</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleOpen}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3 border-t border-white/[0.08]">
          {/* ── STATUS STATS GRID ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Kart 1: Bağlantı & Heartbeat */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                isTactile
                  ? 'bg-[#151320] border-amber-500/20'
                  : 'bg-slate-900/40 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span>ESP Durumu</span>
                <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <div className={`font-black text-xs ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isConnected ? 'ESP32 Çevrimiçi' : 'ESP32 Çevrimdışı'}
              </div>
              <span className="text-[9px] text-white/60 font-mono">
                {isConnected ? 'Sinyal: -62 dBm' : 'Bağlantı bekleniyor'}
              </span>
            </div>

            {/* Kart 2: Watchdog Kilitlenme Sayacı */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                isTactile
                  ? 'bg-[#151320] border-amber-500/20'
                  : 'bg-slate-900/40 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span>WDT Kilitlenme</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-black text-xs text-cyan-300">
                {espStatus.wdtResetCount} Donanım Reset
              </div>
              <span className="text-[9px] text-white/60 font-mono">Task Watchdog Aktif</span>
            </div>

            {/* Kart 3: Bellek (LittleFS) */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                isTactile
                  ? 'bg-[#151320] border-amber-500/20'
                  : 'bg-slate-900/40 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span>Flaş Depolama</span>
                <Server className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="font-black text-xs text-amber-300">
                {logs.length} Kayıtlı Olay
              </div>
              <span className="text-[9px] text-white/60 font-mono">
                LittleFS %{espStatus.flashStorageUsedPercent} dolu
              </span>
            </div>

            {/* Kart 4: Çalışma Süresi (Uptime) */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                isTactile
                  ? 'bg-[#151320] border-amber-500/20'
                  : 'bg-slate-900/40 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span>Uptime (Kesintisiz)</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="font-black text-xs text-indigo-300">
                {Math.floor(espStatus.uptimeSeconds / 3600)}s {Math.floor((espStatus.uptimeSeconds % 3600) / 60)}d
              </div>
              <span className="text-[9px] text-white/60 font-mono">
                {isConnected ? 'Heartbeat: 4s önce' : 'Bağlantı koptu'}
              </span>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.08]">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSyncLogs}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isTactile
                  ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_2px_0_#0c0b10,0_4px_8px_rgba(0,0,0,0.7)]'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xs'
              }`}
              title="ESP'den hafızaya alınan yanma ve sıcaklık verilerini çek"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Loglar Çekiliyor...' : "ESP'den Güncel Logları Çek"}</span>
            </button>

            {/* Restart ESP Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowRestartConfirm(true);
              }}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/40 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="ESP donarsa uzaktan yazılımsal sıfırlama gönder"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Uzaktan ESP Reset Gönder</span>
            </button>

            {/* Logları Sil Butonu (Belirgin ve Kullanışlı) */}
            <button
              type="button"
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Tüm geçmiş ESP loglarını temizle"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Logları Sil</span>
            </button>

            {/* JSON Olarak İndir */}
            <button
              type="button"
              onClick={handleDownloadLogs}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer ml-auto"
              title="Logları JSON olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feedback Message */}
          {syncFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center animate-in fade-in ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
            >
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {/* ── OFFLINE LOGS TABLE / LIST ── */}
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>Kayıtlı Çevrimdışı Olaylar ({logs.length})</span>
              <span className="text-[10px] font-mono">LittleFS flash günlüğü</span>
            </div>

            {logs.length === 0 ? (
              <div className="py-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                Kayıtlı olay bulunmuyor. Loglar temizlendi.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  let icon = <Clock className="w-3 h-3 text-blue-400" />;

                  if (log.type === 'reboot') {
                    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    icon = <RotateCcw className="w-3 h-3 text-rose-400" />;
                  } else if (log.type === 'wdt_timeout') {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
                  } else if (log.type === 'ignition_on' || log.type === 'ignition_off') {
                    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
                    icon = <Flame className="w-3 h-3 text-orange-400" />;
                  }

                  return (
                    <div
                      key={log.id}
                      className={`p-2 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        isTactile
                          ? 'bg-[#151221] border-white/[0.08] hover:border-white/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="p-1 rounded-lg bg-black/40 shrink-0 mt-0.5">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-white truncate">{log.title}</span>
                          <span className="text-[10px] text-white/50 font-mono shrink-0">{dateStr}</span>
                        </div>
                        <p className="text-[10px] text-white/70 mt-0.5 leading-snug">{log.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── MODAL: RESTART CONFIRMATION ── */}
          {showRestartConfirm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className={`w-full max-w-sm rounded-2xl p-4 border flex flex-col gap-3 shadow-2xl ${
                  isTactile
                    ? 'bg-[#1e1a2b] border-amber-500/40 text-white'
                    : 'bg-slate-900 border-rose-500/40 text-white'
                }`}
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>ESP32 Uzaktan Yeniden Başlatılsın mı?</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Bu işlem ESP32 mikrokontrolcüsüne yazılımsal donanım reset sinyali (ESP.restart())
                  gönderir. Kombi rölesi emniyet moduna geçer ve 3 saniye içinde yeniden bağlanır.
                </p>

                {isRestarting ? (
                  <div className="py-3 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
                    <span className="text-xs font-bold text-rose-300">
                      Reset sinyali iletiliyor... ({restartCountdown})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowRestartConfirm(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRestart}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md"
                    >
                      Evet, Reset Gönder
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
