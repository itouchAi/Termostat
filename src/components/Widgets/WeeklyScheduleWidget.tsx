import React, { useState } from 'react';
import { Calendar, Save, Check, Clock, Plus, Trash2 } from 'lucide-react';
import type { ScheduleItem } from '../../types.ts';

interface WeeklyScheduleWidgetProps {
  schedules: ScheduleItem[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  isEncrypted: boolean;
}

export const WeeklyScheduleWidget: React.FC<WeeklyScheduleWidgetProps> = ({
  schedules,
  onSaveSchedules,
  isEncrypted,
}) => {
  const [localList, setLocalList] = useState<ScheduleItem[]>(schedules);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleItem = (id: string) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateTime = (id: string, time: string) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, time } : item))
    );
  };

  const updateTemp = (id: string, temp: number) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetTemp: temp } : item))
    );
  };

  const handleSave = () => {
    onSaveSchedules(localList);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Akıllı Zamanlama & Haftalık Program
          </h3>
        </div>
        {isEncrypted && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
            🔒 AES-GCM Şifreli
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-4">
        {localList.map((item) => (
          <div
            key={item.id}
            className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
              item.enabled
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-60'
            }`}
          >
            {/* Toggle switch and label */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-label={`${item.name} zamanlamasını ${item.enabled ? 'kapat' : 'aç'}`}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  item.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    item.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {item.name}
              </span>
            </div>

            {/* Time input */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={item.time}
                onChange={(e) => updateTime(item.id, e.target.value)}
                aria-label={`${item.name} başlangıç saati`}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-xs font-mono font-bold px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Target Temp input */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="32"
                step="0.5"
                value={item.targetTemp}
                onChange={(e) => updateTemp(item.id, parseFloat(e.target.value) || 20)}
                aria-label={`${item.name} hedef sıcaklığı`}
                className="w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-xs font-mono font-bold px-2 py-1.5 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-400">°C</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
          saveSuccess
            ? 'bg-emerald-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-blue-500/20'
        }`}
      >
        {saveSuccess ? (
          <>
            <Check className="w-4 h-4" />
            Program Yerel Olarak Şifrelendi & Kaydedildi!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Programı Şifreli Kaydet
          </>
        )}
      </button>
    </div>
  );
};
