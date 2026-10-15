import React, { useState } from 'react';
import { MapPin, Plus, Wind, Droplets, Compass, ChevronDown, Check, X } from 'lucide-react';
import type { LocationItem, CurrentWeather } from '../../utils/weather.ts';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon.tsx';

interface ForecastSectionProps {
  weather: CurrentWeather;
  locations: LocationItem[];
  activeLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  onAddLocation: (name: string, cityName: string) => void;
  isLoading?: boolean;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  weather,
  locations,
  activeLocation,
  onSelectLocation,
  onAddLocation,
  isLoading = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newCityName, setNewCityName] = useState('İstanbul');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !newCityName.trim()) return;
    onAddLocation(newLocName.trim(), newCityName.trim());
    setNewLocName('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full bg-slate-50/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 transition-all">
      {/* Top Bar: Location Switcher & Current Conditions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Location Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="Konum Seç"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-400 transition-all text-xs font-bold text-slate-800 dark:text-white"
          >
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">
              {activeLocation.name} ({activeLocation.district || activeLocation.cityName})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Location Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 text-xs">
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

        {/* Current Outside Weather Status Badge */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
            <span className="text-sm">{weather.temp}°C</span>
            <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
              {weather.conditionText}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-0.5">
              <Droplets className="w-3 h-3 text-sky-500" />
              %{weather.humidity}
            </span>
            <span className="flex items-center gap-0.5">
              <Wind className="w-3 h-3 text-indigo-400" />
              {weather.windSpeedKmH} km/s
            </span>
          </div>
        </div>
      </div>

      {/* 5-Day Weather Cards Grid (Embossed & Tactile with warm glow) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {weather.forecast.slice(0, 5).map((day, idx) => (
          <div
            key={day.date}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-1 ${
              idx === 0
                ? 'bg-gradient-to-b from-blue-50/95 via-sky-50/80 to-slate-100/90 dark:bg-gradient-to-b dark:from-slate-800/95 dark:via-slate-850 dark:to-slate-900 border-2 border-blue-400/60 dark:border-orange-500/50 shadow-[0_8px_24px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_8px_26px_rgba(249,115,22,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'bg-gradient-to-b from-white via-slate-50 to-slate-100/90 dark:bg-gradient-to-b dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-900 border border-slate-200/90 dark:border-orange-500/25 shadow-[0_6px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_6px_22px_rgba(249,115,22,0.12),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_10px_26px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_10px_30px_rgba(249,115,22,0.22)]'
            }`}
          >
            {/* Day Title */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
              <span>{day.dayName}</span>
              {idx === 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-orange-500 animate-pulse"></span>
              )}
            </div>

            {/* 2D Animated Weather Icon with soft ambient aura */}
            <div className="my-1.5 p-1 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-center">
              <AnimatedWeatherIcon condition={day.condition} size={36} />
            </div>

            {/* Condition label */}
            <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium truncate max-w-[95px] mb-1">
              {day.conditionText}
            </span>

            {/* High / Low Degree */}
            <div className="flex items-center gap-1.5 font-mono text-xs font-black">
              <span className="text-slate-900 dark:text-white">{day.maxTemp}°</span>
              <span className="text-slate-400 dark:text-slate-400 font-semibold text-[10px]">{day.minTemp}°</span>
            </div>

            {/* Rain chance */}
            {day.rainChancePct > 20 && (
              <span className="text-[9px] font-bold text-sky-600 dark:text-amber-400 mt-1 bg-sky-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                %{day.rainChancePct} yağış
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Add New Location Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Yeni Konum & Cihaz Tanımla
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
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
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Konumu Ekle & Bağla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
