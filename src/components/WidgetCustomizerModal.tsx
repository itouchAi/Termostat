import React from 'react';
import { X, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, Check } from 'lucide-react';
import type { WidgetItem } from '../types.ts';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetItem[];
  onToggleWidget: (id: string) => void;
  onMoveWidget: (id: string, direction: 'up' | 'down') => void;
  onResetWidgets: () => void;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onMoveWidget,
  onResetWidgets,
}) => {
  if (!isOpen) return null;

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="widget-modal-title" className="text-base font-bold text-slate-800 dark:text-white">
              Widget Düzenini Kişiselleştir
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İstediğiniz kartları açıp kapatabilir, sıralamasını değiştirebilirsiniz.
            </p>
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

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {sorted.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                item.enabled
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-100/50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl select-none">{item.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Move Up */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveWidget(item.id, 'up')}
                  aria-label={`${item.title} yukarı taşı`}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                {/* Move Down */}
                <button
                  type="button"
                  disabled={index === sorted.length - 1}
                  onClick={() => onMoveWidget(item.id, 'down')}
                  aria-label={`${item.title} aşağı taşı`}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                {/* Toggle Eye */}
                <button
                  type="button"
                  onClick={() => onToggleWidget(item.id)}
                  aria-label={`${item.title} ${item.enabled ? 'gizle' : 'göster'}`}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                    item.enabled
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetWidgets}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Varsayılan Düzen
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
