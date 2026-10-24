import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Plus,
  Wind,
  Droplets,
  ChevronDown,
  Check,
  X,
  Bell,
  BellOff,
  AlertTriangle,
  Home,
  Footprints,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import type { ThemeMode } from '../../types.ts';
import { translations, type Language } from '../../utils/i18n.ts';
import type { LocationItem, CurrentWeather, DayForecast } from '../../utils/weather.ts';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon.tsx';

interface ForecastSectionProps {
  weather: CurrentWeather;
  locations: LocationItem[];
  activeLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  onAddLocation: (name: string, cityName: string) => void;
  isLoading?: boolean;
  notificationsEnabled?: boolean;
  onToggleNotifications?: (enabled: boolean) => void;
  onTriggerTestNotification?: () => void;
  themeMode?: ThemeMode;
  lang?: Language;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  weather,
  locations,
  activeLocation,
  onSelectLocation,
  onAddLocation,
  isLoading = false,
  notificationsEnabled = false,
  onToggleNotifications,
  onTriggerTestNotification,
  themeMode = 'glass',
  lang = 'tr',
}) => {
  const t = translations[lang] || translations.tr;
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayForHourly, setSelectedDayForHourly] = useState<DayForecast | null>(null);
  const [isPrecautionModalOpen, setIsPrecautionModalOpen] = useState(false);

  const [newLocName, setNewLocName] = useState('');
  const [newCityName, setNewCityName] = useState('İstanbul');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !newCityName.trim()) return;
    onAddLocation(newLocName.trim(), newCityName.trim());
    setNewLocName('');
    setIsAddModalOpen(false);
  };

  // Determine if there's severe weather or rain ahead
  const hasSevereWeather = weather.forecast.some(
    (d) => d.rainChancePct > 40 || d.condition === 'rainy' || d.condition === 'snowy' || d.condition === 'thunder'
  );

  return (
    <div className={`w-full flex flex-col justify-between h-full rounded-2xl p-3 sm:p-4 transition-all ${
      isObsidian
        ? 'bg-transparent text-slate-100'
        : isGlass
        ? 'bg-slate-950/35 border border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-lg text-slate-100'
        : 'bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100'
    }`}>
      {/* ── TOP BAR: Location Switcher & Current Conditions & Notification Toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        {/* Location Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="Konum Seç"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isObsidian
                ? 'bg-[#151322] hover:bg-[#1f1b2f] border-t border-l border-white/[0.14] border-r border-black/60 border-b border-black/80 text-white shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-400 text-slate-800 dark:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {activeLocation.name} ({activeLocation.district || activeLocation.cityName})
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Location Dropdown Menu */}
          {isDropdownOpen && (
            <div className={`absolute top-full left-0 mt-1.5 w-60 z-30 border rounded-2xl shadow-xl p-1.5 text-xs ${
              isObsidian
                ? 'bg-[#12101b] border-white/10 text-white shadow-2xl'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kayıtlı Konumlar (Cihaz Yönetimi)
              </div>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onSelectLocation(loc);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                    activeLocation.id === loc.id
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{loc.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({loc.district || loc.cityName})
                    </span>
                  </div>
                  {activeLocation.id === loc.id && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-100 dark:border-slate-700/80 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Yeni Konum Ekle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Info: Current Condition & Weather Notification Switch */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Weather Notification Toggle */}
          <button
            type="button"
            onClick={() => onToggleNotifications?.(!notificationsEnabled)}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
              notificationsEnabled
                ? isObsidian
                  ? 'bg-[#1e1930] border-amber-500/50 text-amber-300 shadow-md'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs'
                : isObsidian
                ? 'bg-[#151322] border-t border-l border-white/[0.12] border-r border-black/60 border-b border-black/80 text-[#9a93b5] hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="3 saatlik hava durumu bildirimleri ve ani yağmur/kar önlem uyarıları"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                <span className="hidden sm:inline">Hava Bildirimleri Açık</span>
                <span className="sm:hidden">Bildirim Açık</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hava Bildirimleri</span>
                <span className="sm:hidden">Bildirim</span>
              </>
            )}
          </button>

          {/* Current Temperature & Humidity */}
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <span className="text-sm font-mono">{weather.temp}°C</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              <span className="flex items-center gap-0.5">
                <Droplets className="w-3 h-3 text-sky-500" />
                %{weather.humidity}
              </span>
              <span className="hidden md:flex items-center gap-0.5">
                <Wind className="w-3 h-3 text-indigo-400" />
                {weather.windSpeedKmH} km/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5-DAY WEATHER CARDS GRID (Compact, No Vertical Scroll, Flat Dark Slate Lighter Shade, Clickable) ── */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 my-auto">
        {weather.forecast.slice(0, 5).map((day, idx) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setSelectedDayForHourly(day)}
            className={`p-2 sm:p-2.5 rounded-xl flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer text-left w-full ${
              isObsidian
                ? idx === 0
                  ? 'bg-gradient-to-tr from-[#7352d4] via-[#8563e8] to-[#9979f5] border-t border-l border-white/30 border-r border-[#3b1c8a] border-b-2 border-b-[#230e58] shadow-[0_10px_22px_-3px_rgba(0,0,0,0.8),0_4px_14px_rgba(133,99,232,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] scale-[1.03] text-white'
                  : 'bg-[#14121e]/90 hover:bg-[#1c1929] border-t border-l border-white/[0.12] border-r border-black/60 border-b-2 border-b-black/80 shadow-[0_8px_18px_-2px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)] text-slate-200'
                : idx === 0
                ? 'bg-white dark:bg-slate-800 border-2 border-blue-400/80 dark:border-orange-500/80 shadow-md shadow-blue-500/10 dark:shadow-orange-500/15'
                : 'bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-400 dark:hover:border-slate-600 hover:shadow-sm'
            }`}
          >
            {/* Day Title + Date Label (e.g. Bugün • 16 Eki) */}
            <div className="flex flex-col items-center w-full mb-0.5">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100">
                <span className="truncate max-w-[55px] sm:max-w-none">{day.dayName}</span>
                {idx === 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-orange-500 shrink-0"></span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-medium font-mono">
                {day.dateLabel || day.date.slice(5)}
              </span>
            </div>

            {/* 2D Animated Weather Icon */}
            <div className="my-1 p-0.5 rounded-lg flex items-center justify-center">
              <AnimatedWeatherIcon condition={day.condition} size={28} />
            </div>

            {/* Condition label */}
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300 font-medium truncate max-w-[65px] sm:max-w-[85px] leading-tight mb-1">
              {day.conditionText}
            </span>

            {/* High / Low Degree */}
            <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-black">
              <span className="text-slate-900 dark:text-white">{day.maxTemp}°</span>
              <span className="text-slate-400 font-normal text-[10px]">{day.minTemp}°</span>
            </div>

            {/* Rain chance badge */}
            {day.rainChancePct > 20 ? (
              <span className="text-[8px] sm:text-[9px] font-bold text-sky-600 dark:text-amber-300 mt-1 bg-sky-50 dark:bg-slate-750 px-1 py-0.2 rounded-md">
                %{day.rainChancePct}
              </span>
            ) : (
              <span className="text-[8px] text-slate-400 mt-1 opacity-60">Açık</span>
            )}
          </button>
        ))}
      </div>

      {/* ── NOTIFICATION & PRECAUTION ALERT BANNER (If Active or Severe Weather Ahead) ── */}
      {notificationsEnabled ? (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 dark:bg-slate-800 border border-amber-500/30 dark:border-amber-500/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px]">
                3 Saatlik Bildirim & Akıllı Tedbir Sistemi Devrede
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate block">
                {hasSevereWeather
                  ? '⚠️ Önümüzdeki günlerde yağış ve ani ısı düşüşü bekleniyor. Tedbirler hazır.'
                  : '🌤️ Hava stabil. 3 saatte bir periyodik durum özeti ve kombi önerisi iletilir.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPrecautionModalOpen(true)}
              className="px-2 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600 shadow-xs transition-all cursor-pointer"
            >
              Önlemleri Gör
            </button>
            <button
              type="button"
              onClick={onTriggerTestNotification}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-[10px] hover:bg-slate-100 transition-all cursor-pointer"
              title="Şimdi bir 3 saatlik hava bildirimi simüle et"
            >
              Test Bildirimi
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>3 saatlik periyodik hava durumu ve ani yağış önlem bildirimlerini açabilirsiniz.</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleNotifications?.(true)}
            className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 shrink-0 cursor-pointer shadow-xs"
          >
            Aktif Et
          </button>
        </div>
      )}

      {/* ── HOURLY FORECAST POPUP WINDOW (Güne tıklandığında açılan saatlik hava durumu) ── */}
      {selectedDayForHourly && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            className={`border rounded-3xl p-4 sm:p-5 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 transition-all ${
              isObsidian
                ? 'bg-[#12101b]/95 border-t border-l border-white/[0.16] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
                : isGlass
                ? 'bg-slate-950/60 border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.3)] backdrop-blur-2xl text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`shrink-0 flex items-center justify-between pb-3 border-b mb-2 ${
                isObsidian
                  ? 'border-white/[0.08]'
                  : isGlass
                  ? 'border-white/15'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    isObsidian
                      ? 'bg-[#1e1930] text-[#c8b7f8] border border-white/[0.08]'
                      : isGlass
                      ? 'bg-white/10 text-sky-300 border border-white/15'
                      : 'bg-blue-50 dark:bg-blue-900/40 text-blue-500'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold flex items-center gap-1.5 truncate">
                    <span>{selectedDayForHourly.dayName} ({selectedDayForHourly.dateLabel})</span>
                    <span
                      className={`text-xs font-normal ${
                        isObsidian ? 'text-[#a89dc7]' : 'text-slate-400'
                      }`}
                    >
                      Saatlik
                    </span>
                  </h3>
                  <span
                    className={`text-[10px] block truncate ${
                      isObsidian ? 'text-[#9a93b5]' : 'text-slate-400'
                    }`}
                  >
                    {activeLocation.name} • {selectedDayForHourly.conditionText} • {selectedDayForHourly.minTemp}° / {selectedDayForHourly.maxTemp}°C
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayForHourly(null)}
                aria-label="Pencereyi Kapat"
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all ${
                  isObsidian
                    ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                    : isGlass
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hourly Time Slots Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 my-1">
              {selectedDayForHourly.hourly?.map((slot) => (
                <div
                  key={slot.time}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    isObsidian
                      ? 'bg-[#181524] hover:bg-[#201c30] border-white/[0.08] shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                      : isGlass
                      ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/12 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono font-bold w-11 shrink-0 ${
                        isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {slot.time}
                    </span>
                    <AnimatedWeatherIcon condition={slot.condition} size={22} />
                    <div className="min-w-0">
                      <span
                        className={`font-semibold block text-[11px] truncate ${
                          isObsidian ? 'text-white' : isGlass ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {slot.conditionText}
                      </span>
                      <span
                        className={`text-[10px] line-clamp-1 ${
                          isObsidian ? 'text-[#a89dc7]' : 'text-slate-400'
                        }`}
                      >
                        {slot.kombiAdvice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono font-bold text-right shrink-0">
                    <span
                      className={`text-sm ${
                        isObsidian ? 'text-white' : isGlass ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {slot.temp}°C
                    </span>
                    {slot.rainChancePct > 20 && (
                      <span
                        className={`text-[10px] font-normal ${
                          isObsidian ? 'text-[#c8b7f8]' : 'text-sky-400'
                        }`}
                      >
                        %{slot.rainChancePct}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`shrink-0 pt-3 border-t flex items-center justify-between text-[11px] ${
                isObsidian
                  ? 'border-white/[0.08] text-[#a89dc7]'
                  : isGlass
                  ? 'border-white/15 text-slate-300'
                  : 'border-slate-100 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="truncate pr-2">💡 Saatlik verilere göre modülasyon tasarrufu.</span>
              <button
                type="button"
                onClick={() => setSelectedDayForHourly(null)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all ${
                  isObsidian
                    ? 'bg-gradient-to-r from-[#8261e6] to-[#b18cf8] text-white shadow-md'
                    : isGlass
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── PRECAUTION & SEVERE WEATHER ADVISORY MODAL (Ev & Dışarı Çıkış Önlemleri) ── */}
      {isPrecautionModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            className={`border rounded-3xl p-5 w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 transition-all ${
              isObsidian
                ? 'bg-[#12101b]/95 border-t border-l border-white/[0.16] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
                : isGlass
                ? 'bg-slate-950/60 border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.3)] backdrop-blur-2xl text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            <div
              className={`shrink-0 flex items-center justify-between pb-3 border-b mb-3 ${
                isObsidian ? 'border-white/[0.08]' : isGlass ? 'border-white/15' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Akıllı Hava Durumu & Önlem Hatırlatıcı</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrecautionModalOpen(false)}
                aria-label="Pencereyi Kapat"
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all ${
                  isObsidian
                    ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border border-white/[0.12]'
                    : isGlass
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 text-xs pr-1">
              {/* Home Precautions */}
              <div
                className={`p-3 rounded-xl border ${
                  isObsidian
                    ? 'bg-[#181524] border-blue-500/30'
                    : isGlass
                    ? 'bg-white/[0.08] border-white/15 text-white'
                    : 'bg-blue-50/70 dark:bg-slate-800 border-blue-100 dark:border-slate-700'
                }`}
              >
                <h4 className="font-bold text-blue-400 flex items-center gap-1.5 mb-1.5">
                  <Home className="w-4 h-4" />
                  🏠 Evde Alınması Gereken Önlemler:
                </h4>
                <ul
                  className={`space-y-1 list-disc list-inside text-[11px] ${
                    isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <li>Ani hava soğumalarında kombi hedef sıcaklığını 1°C artırarak duvarların soğumasını engelleyin.</li>
                  <li>Doğalgaz menfezlerini asla kapatmayın; havalandırmayı koruyun.</li>
                  <li>Radyatörlerin önünü mobilya ve perdeyle kapatmayarak ısı yayılımını %15 artırın.</li>
                  <li>Kritik donma riski saatlerinde (03:00-06:00) sirkülasyon pompasını aktif tutun.</li>
                </ul>
              </div>

              {/* Outdoor Precautions */}
              <div
                className={`p-3 rounded-xl border ${
                  isObsidian
                    ? 'bg-[#181524] border-amber-500/30'
                    : isGlass
                    ? 'bg-white/[0.08] border-white/15 text-white'
                    : 'bg-amber-50/70 dark:bg-slate-800 border-amber-100 dark:border-slate-700'
                }`}
              >
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <Footprints className="w-4 h-4" />
                  🚪 Dışarı Çıkarken Alınması Gereken Önlemler:
                </h4>
                <ul
                  className={`space-y-1 list-disc list-inside text-[11px] ${
                    isObsidian ? 'text-[#c8b7f8]' : isGlass ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <li>Sağanak yağış ve rüzgar ihtimaline karşı şemsiye ve rüzgar geçirmez mont tercih edin.</li>
                  <li>Islak ve kaygan zeminlerde kaydırmaz tabanlı ayakkabı kullanın.</li>
                  <li>Araçla seyahat edecekseniz fren mesafesini iki katına çıkarın, silecekleri kontrol edin.</li>
                  <li>Evden uzun süre ayrılacaksanız termostatı "Dışarıda" moduna (16.0°C) alın.</li>
                </ul>
              </div>
            </div>

            <div
              className={`shrink-0 mt-3 pt-3 border-t flex justify-end ${
                isObsidian ? 'border-white/[0.08]' : isGlass ? 'border-white/15' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsPrecautionModalOpen(false)}
                className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all ${
                  isObsidian
                    ? 'bg-gradient-to-r from-[#8261e6] to-[#b18cf8] text-white shadow-md'
                    : isGlass
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                Anladım & Kapat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add New Location Modal */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            className={`border rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 ${
              isObsidian
                ? 'bg-[#12101b]/95 border-t border-l border-white/[0.16] border-r border-black/70 border-b-2 border-b-black/85 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
                : isGlass
                ? 'bg-slate-950/60 border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.3)] backdrop-blur-2xl text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b mb-4 ${
                isObsidian ? 'border-white/[0.08]' : isGlass ? 'border-white/15' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Yeni Konum & Cihaz Tanımla
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer active:scale-95 transition-all ${
                  isObsidian
                    ? 'bg-[#1e1a2f] hover:bg-[#2b2542] text-[#d8caff] border-white/[0.12]'
                    : isGlass
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Konum Adı (Örn: Ev, Ofis, Yazlık):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Yazlık Ev"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Şehir / İlçe:
                </label>
                <select
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="İstanbul">İstanbul</option>
                  <option value="Ankara">Ankara</option>
                  <option value="İzmir">İzmir</option>
                  <option value="Bursa">Bursa</option>
                  <option value="Antalya">Antalya</option>
                  <option value="Eskişehir">Eskişehir</option>
                  <option value="Trabzon">Trabzon</option>
                  <option value="Gaziantep">Gaziantep</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Konumu Ekle & Bağla
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
