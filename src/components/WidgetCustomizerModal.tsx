import React from 'react';
import { X, ArrowUp, ArrowDown, RotateCcw, Check, SlidersHorizontal, Layers, ChevronRight } from 'lucide-react';
import type { ThemeMode } from '../types.ts';
import { type ObsidianPalette, getObsidianPalette } from '../utils/obsidianPalettes.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabsOrder: string[];
  onMoveTab: (tabId: string, direction: 'up' | 'down') => void;
  reportSubOrder: string[];
  onMoveReportSub: (subId: string, direction: 'up' | 'down') => void;
  progSubOrder: string[];
  onMoveProgSub: (subId: string, direction: 'up' | 'down') => void;
  onResetOrder: () => void;
  themeMode?: ThemeMode;
  obsidianPalette?: ObsidianPalette;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  tabsOrder,
  onMoveTab,
  reportSubOrder,
  onMoveReportSub,
  progSubOrder,
  onMoveProgSub,
  onResetOrder,
  themeMode = 'glass',
  obsidianPalette,
}) => {
  if (!isOpen) return null;

  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const isTactile = themeMode === 'tactile_deck';
  const palette = obsidianPalette || getObsidianPalette(3);

  const tabDefs: Record<string, { title: string; subtitle: string; icon: string }> = {
    genel: {
      title: 'Termo.',
      subtitle: 'Termostat & Kombi Ana Kontrol',
      icon: '🏠',
    },
    hava: {
      title: 'Hava',
      subtitle: 'Bölgesel Hava Durumu & 5 Günlük Tahmin',
      icon: '🌤️',
    },
    rapor: {
      title: 'Rapor',
      subtitle: '24s Sıcaklık & Tüketim Analitiği',
      icon: '📊',
    },
    program: {
      title: 'Prog.',
      subtitle: 'Haftalık Zaman Planı & Tüketim',
      icon: '⏰',
    },
  };

  const reportSubDefs: Record<string, { title: string; icon: string }> = {
    heatmap: { title: 'Sıcaklık Haritası', icon: '🌡️' },
    bill: { title: 'Tüketim & Fatura', icon: '💰' },
    sensors: { title: 'Kombi Sensörleri & Telemetri', icon: '🔥' },
  };

  const progSubDefs: Record<string, { title: string; icon: string }> = {
    schedule: { title: 'Akıllı Zaman Programı', icon: '⏰' },
    consumption: { title: 'Günlük Tüketim & Tasarruf', icon: '⚡' },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        style={
          isObsidian
            ? {
                boxShadow: `0 25px 70px rgba(0,0,0,0.95), 0 0 50px ${palette.cardGlow}`,
                borderColor: palette.cardBorder,
              }
            : isTactile
            ? {
                boxShadow: '0 25px 70px rgba(0,0,0,0.98), 0 0 35px rgba(255,140,50,0.18)',
              }
            : undefined
        }
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all ${
          isObsidian
            ? 'bg-[#12101b]/95 border-t border-l border-white/[0.16] border-r border-black/70 border-b-2 border-b-black/85 text-white'
            : isTactile
            ? 'bg-[#161422]/98 border-t border-l border-white/[0.18] border-r border-black/80 border-b-2 border-b-black/95 text-white'
            : isGlass
            ? 'bg-slate-950/65 border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.3)] text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isObsidian
              ? 'border-white/[0.08] bg-[#161324]/80'
              : isTactile
              ? 'border-white/[0.10] bg-[#1a1726]/90'
              : isGlass
              ? 'border-white/15 bg-white/[0.08]'
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={
                isObsidian
                  ? {
                      borderColor: palette.borderUnder,
                      color: palette.textColor,
                      background: `linear-gradient(135deg, ${palette.hex}25, ${palette.ringColor}15)`,
                    }
                  : undefined
              }
              className={`p-2 rounded-xl ${
                isObsidian
                  ? 'border shadow-xs'
                  : isTactile
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : isGlass
                  ? 'bg-white/10 text-sky-300 border border-white/15'
                  : 'bg-blue-50 dark:bg-blue-900/40 text-blue-500'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 id="widget-modal-title" className="text-sm sm:text-base font-bold">
                Ekran & Menü Sıralaması
              </h2>
              <p
                className={`text-[11px] ${
                  isObsidian ? 'text-[#a89dc7]' : isTactile ? 'text-slate-300' : isGlass ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Ekranları ve alt menüleri yukarı/aşağı butonlarıyla dilediğiniz gibi sıralayın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
              isObsidian
                ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                : isTactile
                ? 'bg-[#221f2f] hover:bg-[#2c283c] text-amber-300 border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                : isGlass
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable List of Main Tabs */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isObsidian ? 'text-[#c8b7f8]' : isTactile ? 'text-amber-400' : isGlass ? 'text-slate-300' : 'text-slate-400 dark:text-slate-400'
              }`}
            >
              Ana Ekran Sıralaması (Karusel & Alt Çubuk)
            </span>
          </div>

          {tabsOrder.map((tabId, index) => {
            const def = tabDefs[tabId];
            if (!def) return null;

            const isFirst = index === 0;
            const isLast = index === tabsOrder.length - 1;
            const isRapor = tabId === 'rapor';
            const isProg = tabId === 'program';

            return (
              <div
                key={tabId}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isObsidian
                    ? 'bg-[#181524] border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.4)]'
                    : isTactile
                    ? 'bg-[#1c1929] border-t border-l border-white/[0.16] border-r border-black/60 border-b border-black/80 text-white shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                    : isGlass
                    ? 'bg-white/[0.08] hover:bg-white/[0.12] border-white/15 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Main Tab Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl select-none shrink-0">{def.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold truncate">{def.title}</h4>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                            isObsidian
                              ? 'bg-[#241f38] text-[#c8b7f8]'
                              : isTactile
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : isGlass
                              ? 'bg-white/10 text-slate-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Sıra {index + 1}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate ${
                          isObsidian
                            ? 'text-[#a89dc7]'
                            : isTactile
                            ? 'text-slate-300'
                            : isGlass
                            ? 'text-slate-300'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {def.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Move Up / Down Buttons for Main Tab */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => {
                        triggerHaptic('selection');
                        onMoveTab(tabId, 'up');
                      }}
                      aria-label={`${def.title} yukarı taşı`}
                      className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                        isObsidian
                          ? 'bg-[#221c38] hover:bg-[#2f274d] text-[#c8b7f8] border border-white/[0.08]'
                          : isTactile
                          ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_3px_0_#0c0b10,0_4px_8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                          : isGlass
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => {
                        triggerHaptic('selection');
                        onMoveTab(tabId, 'down');
                      }}
                      aria-label={`${def.title} aşağı taşı`}
                      className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                        isObsidian
                          ? 'bg-[#221c38] hover:bg-[#2f274d] text-[#c8b7f8] border border-white/[0.08]'
                          : isTactile
                          ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_3px_0_#0c0b10,0_4px_8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                          : isGlass
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Sub-menu for Rapor: Sıcaklık Haritası, Tüketim Fatura, Kombi Sensörleri ── */}
                {isRapor && (
                  <div
                    className={`mt-3 pt-2.5 border-t space-y-1.5 ${
                      isObsidian
                        ? 'border-white/[0.06]'
                        : isTactile
                        ? 'border-white/[0.08]'
                        : isGlass
                        ? 'border-white/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div
                      style={isObsidian ? { color: palette.textColor } : undefined}
                      className={`flex items-center gap-1.5 text-[10px] font-bold mb-1 ${
                        isObsidian ? '' : isTactile ? 'text-amber-400' : isGlass ? 'text-sky-300' : 'text-sky-400'
                      }`}
                    >
                      <Layers
                        style={isObsidian ? { color: palette.ringColor } : undefined}
                        className={`w-3 h-3 ${isTactile ? 'text-amber-400' : ''}`}
                      />
                      <span>Rapor Alt Sekmeleri (İç Sıralama):</span>
                    </div>

                    <div className="space-y-1.5 pl-2 sm:pl-3">
                      {reportSubOrder.map((subId, subIdx) => {
                        const sub = reportSubDefs[subId];
                        if (!sub) return null;
                        const isSubFirst = subIdx === 0;
                        const isSubLast = subIdx === reportSubOrder.length - 1;

                        return (
                          <div
                            key={subId}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                              isObsidian
                                ? 'bg-[#1e1930] border-white/[0.08]'
                                : isTactile
                                ? 'bg-[#221e30] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                                : isGlass
                                ? 'bg-white/[0.06] border-white/10 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{sub.icon}</span>
                              <span className="font-semibold">{sub.title}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isSubFirst}
                                onClick={() => {
                                  triggerHaptic('light');
                                  onMoveReportSub(subId, 'up');
                                }}
                                aria-label={`${sub.title} yukarı taşı`}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                                  isObsidian
                                    ? 'bg-[#2b2542] hover:bg-[#393256] text-[#c8b7f8]'
                                    : isTactile
                                    ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_2px_0_#0c0b10,0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                                    : isGlass
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isSubLast}
                                onClick={() => {
                                  triggerHaptic('light');
                                  onMoveReportSub(subId, 'down');
                                }}
                                aria-label={`${sub.title} aşağı taşı`}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                                  isObsidian
                                    ? 'bg-[#2b2542] hover:bg-[#393256] text-[#c8b7f8]'
                                    : isTactile
                                    ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_2px_0_#0c0b10,0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                                    : isGlass
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Sub-menu for Prog: Akıllı Zaman Programı, Günlük Tüketim ── */}
                {isProg && (
                  <div
                    className={`mt-3 pt-2.5 border-t space-y-1.5 ${
                      isObsidian
                        ? 'border-white/[0.06]'
                        : isTactile
                        ? 'border-white/[0.08]'
                        : isGlass
                        ? 'border-white/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div
                      style={isObsidian ? { color: palette.textColor } : undefined}
                      className={`flex items-center gap-1.5 text-[10px] font-bold mb-1 ${
                        isObsidian ? '' : isTactile ? 'text-amber-400' : isGlass ? 'text-amber-300' : 'text-amber-400'
                      }`}
                    >
                      <Layers
                        style={isObsidian ? { color: palette.ringColor } : undefined}
                        className={`w-3 h-3 ${isTactile ? 'text-amber-400' : ''}`}
                      />
                      <span>Program Alt Sekmeleri (İç Sıralama):</span>
                    </div>

                    <div className="space-y-1.5 pl-2 sm:pl-3">
                      {progSubOrder.map((subId, subIdx) => {
                        const sub = progSubDefs[subId];
                        if (!sub) return null;
                        const isSubFirst = subIdx === 0;
                        const isSubLast = subIdx === progSubOrder.length - 1;

                        return (
                          <div
                            key={subId}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                              isObsidian
                                ? 'bg-[#1e1930] border-white/[0.08]'
                                : isTactile
                                ? 'bg-[#221e30] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                                : isGlass
                                ? 'bg-white/[0.06] border-white/10 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{sub.icon}</span>
                              <span className="font-semibold">{sub.title}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isSubFirst}
                                onClick={() => {
                                  triggerHaptic('light');
                                  onMoveProgSub(subId, 'up');
                                }}
                                aria-label={`${sub.title} yukarı taşı`}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                                  isObsidian
                                    ? 'bg-[#2b2542] hover:bg-[#393256] text-[#c8b7f8]'
                                    : isTactile
                                    ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_2px_0_#0c0b10,0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                                    : isGlass
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isSubLast}
                                onClick={() => {
                                  triggerHaptic('light');
                                  onMoveProgSub(subId, 'down');
                                }}
                                aria-label={`${sub.title} aşağı taşı`}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:translate-y-0.5 ${
                                  isObsidian
                                    ? 'bg-[#2b2542] hover:bg-[#393256] text-[#c8b7f8]'
                                    : isTactile
                                    ? 'bg-gradient-to-b from-[#2e2a3c] to-[#1c1a26] hover:from-[#373248] hover:to-[#222030] text-amber-300 border-t border-l border-white/20 border-r border-black/70 border-b border-black/90 shadow-[0_2px_0_#0c0b10,0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                                    : isGlass
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with Reset to Defaults button & Done button */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
            isObsidian
              ? 'border-white/[0.08] bg-[#161324]/80'
              : isTactile
              ? 'border-white/[0.1] bg-[#1c1928]/95'
              : isGlass
              ? 'border-white/15 bg-white/[0.08]'
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onResetOrder();
            }}
            className={`text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isObsidian
                ? 'text-[#c8b7f8] hover:text-white'
                : isTactile
                ? 'text-amber-400 hover:text-amber-300'
                : isGlass
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılan Düzene Dön</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={
              isObsidian
                ? {
                    background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                    boxShadow: `0 8px 22px rgba(0,0,0,0.6), 0 2px 14px ${palette.glow}`,
                    borderColor: palette.ringColor,
                  }
                : isTactile
                ? {
                    background: 'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                    boxShadow: '0 4px 0 #0c0b10, 0 8px 16px rgba(0,0,0,0.8), 0 0 16px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255, 200, 150, 0.45)',
                    color: '#fff7ed',
                  }
                : undefined
            }
            className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
              isObsidian
                ? 'text-white border'
                : isTactile
                ? ''
                : isGlass
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-md'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tamam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
