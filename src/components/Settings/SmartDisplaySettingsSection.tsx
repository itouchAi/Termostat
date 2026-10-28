import React, { useState } from 'react';
import {
  Monitor,
  Tv,
  Music,
  Image as ImageIcon,
  Sliders,
  Moon,
  Sun,
  Play,
  Upload,
  Link,
  FileVideo,
  Volume2,
  Layers,
  Activity,
  Maximize,
  Flame,
  Check,
  Sparkles,
  ChevronDown,
  Palette,
  BarChart3,
  Waves,
  HeartPulse,
} from 'lucide-react';
import type {
  SmartDisplayConfig,
  SmartDisplayMode,
  PresetVisualTheme,
  ImageFitMode,
  SlideTransition,
  AmbientAudioTrack,
  EqualizerStyle,
} from '../../types/smartDisplay.ts';
import type { ThemeMode } from '../../types.ts';
import type { ObsidianPalette } from '../../utils/obsidianPalettes.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface SmartDisplaySettingsSectionProps {
  smartDisplayConfig?: SmartDisplayConfig;
  onUpdateSmartDisplayConfig?: (cfg: Partial<SmartDisplayConfig>) => void;
  onLaunchSmartDisplay?: () => void;
  themeMode?: ThemeMode;
  obsidianPalette?: ObsidianPalette;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  headerPrefix?: React.ReactNode;
}

export const SmartDisplaySettingsSection: React.FC<SmartDisplaySettingsSectionProps> = ({
  smartDisplayConfig,
  onUpdateSmartDisplayConfig,
  onLaunchSmartDisplay,
  themeMode = 'glass',
  obsidianPalette,
  isOpen = false,
  onToggleOpen,
  headerPrefix,
}) => {
  const isObsidian = themeMode === 'obsidian_lavender';
  const isGlass = themeMode === 'glass';
  const isTactile = themeMode === 'tactile_deck';
  const palette = obsidianPalette;

  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  // Varsayılan Temalar ve Sesleri Göster / Gizle butonu
  const [showDefaultThemes, setShowDefaultThemes] = useState(false);

  if (!smartDisplayConfig) return null;

  const activeMode = smartDisplayConfig.mode;
  const currentBrightness = smartDisplayConfig.brightnessPercent ?? 85;

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
      {/* ── HEADER & MASTER TOGGLE ── */}
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
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/30'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs flex items-center gap-1.5 truncate text-white">
              <span>Smart Display & Ambiyans</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  isTactile
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                }`}
              >
                Tablet / PC
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate max-w-[220px] sm:max-w-md">
              Masaüstü veya duvarda canlı saat, ambiyans ve medya ekranı
            </p>
          </div>
        </div>

        {/* Master Opt-in Switch & Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onUpdateSmartDisplayConfig?.({
                enabled: !smartDisplayConfig.enabled,
              });
            }}
            style={
              smartDisplayConfig.enabled && isObsidian && palette
                ? {
                    background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.ringColor} 50%, ${palette.borderUnder} 100%)`,
                    borderColor: palette.borderUnder,
                    boxShadow: `0 2px 10px ${palette.glow}`,
                  }
                : smartDisplayConfig.enabled && isTactile
                ? {
                    background:
                      'linear-gradient(172deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.06) 40%, transparent 60%), radial-gradient(ellipse 80% 110% at 50% 50%, rgba(255,145,50,0.92) 0%, rgba(210,85,20,0.65) 55%, transparent 85%), #2f2520',
                    boxShadow:
                      '0 3px 0 #0c0b10, 0 6px 12px rgba(0,0,0,0.8), 0 0 12px rgba(255,145,50,0.5), inset 0 1.5px 2px rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255, 200, 150, 0.45)',
                    color: '#fff7ed',
                  }
                : undefined
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 active:translate-y-0.5 ${
              smartDisplayConfig.enabled
                ? isObsidian
                  ? 'text-white border-t border-l border-white/25 border-r border-b'
                  : isTactile
                  ? ''
                  : 'bg-purple-600 text-white shadow-purple-500/30'
                : isTactile
                ? 'bg-[#221f2f] text-slate-400 border border-white/10'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Smart Display özelliğini aç veya kapat"
          >
            <span>{smartDisplayConfig.enabled ? 'Açık ✓' : 'Kapalı'}</span>
          </button>

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
        <div className="p-3.5 sm:p-4 pt-1 flex flex-col gap-3.5 border-t border-white/[0.08]">
          {/* ── ŞİMDİ BAŞLAT (TAM EKRAN) BUTONU (Image 2) ── */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onLaunchSmartDisplay?.();
            }}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
              isTactile
                ? 'bg-gradient-to-b from-[#b3531b] via-[#8c3d11] to-[#5a2408] hover:from-[#c85e20] hover:to-[#6b2c0b] text-white border-t border-l border-white/30 border-r border-black/80 border-b border-black shadow-[0_4px_0_#2b1204,0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]'
                : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/25'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Smart Display'i Şimdi Başlat (Tam Ekran)</span>
          </button>

          {/* ── 1. EKRAN MODU SEÇİMİ (Image 9) ── */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" />
              <span>Ekran Modu:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'aod' as SmartDisplayMode,
                  label: '🌙 Always-On Display (AOD)',
                  desc: 'Siyah Ekran + Büyük Saat + Donma Koruması',
                },
                {
                  id: 'video_audio_muted_mp3' as SmartDisplayMode,
                  label: '🎬 Sessiz Video + MP3',
                  desc: 'Canlı arka plan + ortam müziği',
                },
                {
                  id: 'video' as SmartDisplayMode,
                  label: '🔥 Canlı Video / Doğa',
                  desc: 'Şömine & canlı doğa döngüsü',
                },
                {
                  id: 'slideshow' as SmartDisplayMode,
                  label: '🖼️ Slayt Gösterisi',
                  desc: 'Fotoğraflar arası otomatik geçiş',
                },
                {
                  id: 'image' as SmartDisplayMode,
                  label: '📷 Tekli Görsel',
                  desc: 'Sakin sabit fotoğraf',
                },
              ].map((m) => {
                const isSelected = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onUpdateSmartDisplayConfig?.({ mode: m.id });
                    }}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      isSelected
                        ? isTactile
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-400 text-white shadow-md'
                          : 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between text-white">
                      <span>{m.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[9.5px] text-white/60 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. SLAYT SÜRESİ & GEÇİŞ EFEKTİ (Image 10) ── */}
          {/* User: "9.gorsel slayt gosterıınse tıklanınca acılacak" */}
          {activeMode === 'slideshow' && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-[#1e1338] border border-purple-500/30 space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-purple-300 block">
                Slayt Süresi & Geçiş Efekti
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Slayt Değişim Süresi */}
                <div className="space-y-1">
                  <span className="text-[10px] text-purple-200">Slayt Değişim Süresi:</span>
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateSmartDisplayConfig?.({ slideshowIntervalSec: sec });
                        }}
                        className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                          smartDisplayConfig.slideshowIntervalSec === sec
                            ? 'bg-purple-600 border-purple-400 text-white shadow-xs'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geçiş Efekti */}
                <div className="space-y-1">
                  <span className="text-[10px] text-purple-200">
                    Geçiş Efekti (Fade / Kayma / Zoom):
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'fade' as SlideTransition, label: 'Fade' },
                      { id: 'slide' as SlideTransition, label: 'Kayma' },
                      { id: 'zoom' as SlideTransition, label: 'Zoom' },
                    ].map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateSmartDisplayConfig?.({ slideTransition: tr.id });
                        }}
                        className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                          smartDisplayConfig.slideTransition === tr.id
                            ? 'bg-purple-600 border-purple-400 text-white shadow-xs'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. GÖRSEL YERLEŞİM MODU & ÇOKLU GÖRSEL (Image 3 / 4) ── */}
          {/* User: "10 gorseller sessız vıdeo m3 slayt gosterısı ve teklı gorsel secılınce gelcek." */}
          {(activeMode === 'video_audio_muted_mp3' ||
            activeMode === 'slideshow' ||
            activeMode === 'image') && (
            <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Görsel Yerleşim Modu:</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cover' as ImageFitMode, label: '🖼️ Oto (Cover)', desc: 'Ekranı doldur' },
                  { id: 'contain' as ImageFitMode, label: '📐 Fit (Sığdır)', desc: 'Orantılı tam boy' },
                  { id: 'fill' as ImageFitMode, label: '↔️ Stretch', desc: 'Ekran boyu esnet' },
                ].map((fit) => (
                  <button
                    key={fit.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onUpdateSmartDisplayConfig?.({ imageFitMode: fit.id });
                    }}
                    className={`p-1.5 rounded-xl text-center border cursor-pointer transition-all ${
                      smartDisplayConfig.imageFitMode === fit.id
                        ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[10.5px]">{fit.label}</div>
                    <div className="text-[9px] text-slate-400">{fit.desc}</div>
                  </button>
                ))}
              </div>

              {/* Çoklu Görsel & Slayt Listesi */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Çoklu Görsel & Slayt Listesi</span>
                  <span className="text-[9.5px] text-white/50">
                    {smartDisplayConfig.customImages?.length || 0} Görsel Yüklendi
                  </span>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Çoklu Görsel Seç</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const newItems = Array.from(files).map((f) => ({
                        id: `local-${Date.now()}-${Math.random()}`,
                        name: f.name,
                        url: URL.createObjectURL(f),
                      }));
                      const updated = [...(smartDisplayConfig.customImages || []), ...newItems];
                      onUpdateSmartDisplayConfig?.({
                        customImages: updated,
                        presetTheme: 'custom',
                      });
                      triggerHaptic('success');
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── 4. ÖZEL GÖRSEL/VİDEO URL GİRİŞİ (Image 11) ── */}
          {/* User: "11 gorsel sessizvideo ya tıklanınca 10 gorselle beraver gelecek" */}
          {(activeMode === 'video_audio_muted_mp3' || activeMode === 'video') && (
            <div className="flex gap-1.5 animate-in fade-in">
              <input
                type="text"
                placeholder="Özel Görsel/Video URL (mp4, webm, jpg, png)..."
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (customImageUrl.trim()) {
                    triggerHaptic('selection');
                    const newItem = {
                      id: `img-${Date.now()}`,
                      name: 'Özel Görsel',
                      url: customImageUrl.trim(),
                    };
                    const updated = [...(smartDisplayConfig.customImages || []), newItem];
                    onUpdateSmartDisplayConfig?.({
                      customImages: updated,
                      customImageUrl: customImageUrl.trim(),
                      customVideoUrl: customImageUrl.trim(),
                      presetTheme: 'custom',
                    });
                    setCustomImageUrl('');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Ekle
              </button>
            </div>
          )}

          {/* ── 5. VARSAYILAN TEMALAR BUTONU (Images 6 & 7 & 8) ── */}
          {/* User: "6.7 cı gorseldekı menuler 8 gorsele bıt buton daha eklenecek varsayılan temalar seklınde. buna tıklanınca acılacaklar. yoksa ekranda gozukmelerıne gerek yok." */}
          <div className="space-y-2 pt-1 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowDefaultThemes(!showDefaultThemes);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Varsayılan Temalar & Ambiyans Sesleri</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  showDefaultThemes ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Genişletildiğinde açılan Varsayılan Görsel Temaları (Image 7) ve Sesler (Image 8) */}
            {showDefaultThemes && (
              <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-3 animate-in fade-in">
                {/* Image 7: Görsel / Video Teması */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Görsel / Video Teması:</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'fireplace' as PresetVisualTheme, label: '🔥 Şömine' },
                      { id: 'rainy_window' as PresetVisualTheme, label: '🌧️ Yağmurlu' },
                      { id: 'winter_snow' as PresetVisualTheme, label: '❄️ Kış & Kar' },
                      { id: 'sunset_forest' as PresetVisualTheme, label: '🌲 Gün Batımı' },
                      { id: 'aurora' as PresetVisualTheme, label: '🌌 Kutup Işıkları' },
                      { id: 'minimal_black' as PresetVisualTheme, label: '🌑 Minimalist' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateSmartDisplayConfig?.({ presetTheme: th.id });
                        }}
                        className={`p-2 rounded-xl text-center text-[10.5px] font-bold border transition-all cursor-pointer ${
                          smartDisplayConfig.presetTheme === th.id
                            ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-xs'
                            : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image 8: Ortam Sesi Parçaları (Tema Renginde / Amber) */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Ortam Sesi Çalma Listesi:</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'none' as AmbientAudioTrack, label: '🚫 Sessiz' },
                      { id: 'fireplace' as AmbientAudioTrack, label: '🔥 Şömine Çıtırtısı' },
                      { id: 'rain' as AmbientAudioTrack, label: '🌧️ Sakin Yağmur' },
                      { id: 'lofi' as AmbientAudioTrack, label: '🎧 Lofi Akustik' },
                      { id: 'relax_piano' as AmbientAudioTrack, label: '🎹 Relax Piyano' },
                      { id: 'nature' as AmbientAudioTrack, label: '🌲 Doğa & Kuşlar' },
                    ].map((trk) => {
                      const isSelected = (smartDisplayConfig.audioTrack || 'none') === trk.id;
                      return (
                        <button
                          key={trk.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            onUpdateSmartDisplayConfig?.({ audioTrack: trk.id });
                          }}
                          className={`p-2 rounded-xl text-center text-[10.5px] font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm border-amber-400'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                          }`}
                        >
                          {trk.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 6. SES SEVİYESİ & MP3 (TEMA RENGİNDE / AMBER) (Images 2, 3, 4, 12) ── */}
          {/* User: "buranın pembe oması da hos degıl temanın rengınde olması gerek hem o slayderın hemde altında kı butonların." */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Ortam Sesi Seviyesi & Dışarıdan MP3:</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                Ses: %{Math.round((smartDisplayConfig.audioVolume ?? 0.5) * 100)}
              </span>
            </div>

            {/* Ses Seviyesi Slider (Amber / Tema Rengi - Dragging Modal'ı Kaydırmasın Diye StopPropagation) */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={smartDisplayConfig.audioVolume ?? 0.5}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateSmartDisplayConfig?.({
                  audioVolume: Number(e.target.value),
                });
              }}
              className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-white/15"
            />

            {/* Image 12: Dışarıdan MP3 URL Ekle (Sessiz video / MP3 seçilince gelir) */}
            {activeMode === 'video_audio_muted_mp3' && (
              <div className="flex gap-1.5 mt-1 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Dışarıdan MP3 URL (https://...mp3)..."
                  value={customAudioUrl}
                  onChange={(e) => setCustomAudioUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAudioUrl.trim()) {
                      triggerHaptic('selection');
                      onUpdateSmartDisplayConfig?.({
                        audioTrack: 'custom',
                        customAudioUrl: customAudioUrl.trim(),
                      });
                      setCustomAudioUrl('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>

          {/* ── 7. ÜST KAYAN YAZI ŞARKI İSMİ (Image 5) ── */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-white block">Üst Kayan Yazı Şarkı İsmi</span>
              <span className="text-[9.5px] text-slate-400">Çalan parçayı ekranda kayan bant olarak gösterir</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onUpdateSmartDisplayConfig?.({
                  showMarqueeTrackTitle: !smartDisplayConfig.showMarqueeTrackTitle,
                });
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                smartDisplayConfig.showMarqueeTrackTitle
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {smartDisplayConfig.showMarqueeTrackTitle ? 'Açık' : 'Pasif'}
            </button>
          </div>

          {/* ── 8. CANLI MÜZİK EKOLAYZIR MODU VE EKOLAYZIR STİLLERİ (Image 5 & 6) ── */}
          {/* User: "5.gorselde ekolayzır seceneklerımız vardı onlar yok,?" */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Canlı Müzik Ekolayzır Modu</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  Açıkken arka plan hafif blur olur, ekolayzır parlar
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateSmartDisplayConfig?.({
                    equalizerEnabled: !smartDisplayConfig.equalizerEnabled,
                  });
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                  smartDisplayConfig.equalizerEnabled
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {smartDisplayConfig.equalizerEnabled ? 'Aktif' : 'Pasif'}
              </button>
            </div>

            {/* Ekolayzır Seçenekleri (Stilleri) */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <span className="text-[10px] text-white/70 font-semibold block">
                Ekolayzır Görsel Tipi:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'bars' as EqualizerStyle, label: '📊 Çubuklar', desc: 'Neon spektrum' },
                  { id: 'wave' as EqualizerStyle, label: '🌊 Dalga', desc: 'Siber dalga boyu' },
                  { id: 'pulse' as EqualizerStyle, label: '💓 Nabız', desc: 'Radyal vuruş' },
                ].map((eq) => {
                  const isSelected = (smartDisplayConfig.equalizerStyle || 'bars') === eq.id;
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onUpdateSmartDisplayConfig?.({
                          equalizerStyle: eq.id,
                          equalizerEnabled: true,
                        });
                      }}
                      className={`p-1.5 rounded-xl text-center border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-600/40 border-purple-400 text-white shadow-xs'
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-[10.5px]">{eq.label}</div>
                      <div className="text-[8.5px] text-slate-400">{eq.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 9. DAHİLİ EKRAN AYDINLIK AYARI & CANLI SİMÜLASYON (Images 5 & 13) ── */}
          {/* User: "13.gorseldekı aydınlatmaslayderı ve altındakı butonlar aydınlatmayı sımule etmıyor." */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Dahili Ekran Aydınlık Ayarı</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                %{currentBrightness}
              </span>
            </div>

            {/* CANLI AYDINLIK SİMÜLASYONLU ÖNİZLEME KUTUSU (Görsel 5 & 13 Birebir) */}
            <div
              className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between transition-all duration-200 select-none shadow-inner"
              style={{
                filter: `brightness(${Math.max(0.18, currentBrightness / 100) * 1.05})`,
                opacity: Math.max(0.35, currentBrightness / 100),
                boxShadow: `0 0 ${Math.round((currentBrightness / 100) * 20)}px rgba(251, 191, 36, ${
                  (currentBrightness / 100) * 0.3
                })`,
              }}
            >
              <div className="font-mono text-white text-lg font-black tracking-wider flex items-baseline gap-1">
                <span>22:45</span>
                <span className="text-[10px] text-white/50">00</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>18°C · <strong className="text-amber-400">22.5°C</strong></span>
                </div>
                <span className="text-[9px] text-amber-300/80 font-mono">
                  Canlı Aydınlık: %{currentBrightness}
                </span>
              </div>
            </div>

            {/* Aydınlık Slider'ı (StopPropagation ekli, modal kaymaz) */}
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={currentBrightness}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateSmartDisplayConfig?.({
                  brightnessPercent: Number(e.target.value),
                });
              }}
              className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-white/15"
            />

            {/* Hızlı Aydınlık Butonları (Gece %20, Loş %50, Normal %85, Tam %100) */}
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { val: 20, icon: '🌙', label: 'Gece (%20)' },
                { val: 50, icon: '🌇', label: 'Loş (%50)' },
                { val: 85, icon: '☀️', label: 'Normal (%85)' },
                { val: 100, icon: '⚡', label: 'Tam (%100)' },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onUpdateSmartDisplayConfig?.({
                      brightnessPercent: b.val,
                    });
                  }}
                  className={`py-1.5 px-1 rounded-xl font-bold text-[10.5px] border transition-all cursor-pointer text-center ${
                    currentBrightness === b.val
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div>{b.icon}</div>
                  <div className="text-[9px]">{b.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 10. EKRAN UYKU / KAPANMA SÜRESİ (Image 5) ── */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ekran Uyku / Kapanma Süresi</span>
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {[
                { val: 0, label: 'Sürekli Açık' },
                { val: 1, label: '1 Dk' },
                { val: 5, label: '5 Dk' },
                { val: 15, label: '15 Dk' },
                { val: 30, label: '30 Dk' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onUpdateSmartDisplayConfig?.({
                      sleepTimeoutMin: opt.val,
                    });
                  }}
                  className={`py-1.5 px-1 rounded-xl font-bold text-[10.5px] border transition-all cursor-pointer text-center ${
                    smartDisplayConfig.sleepTimeoutMin === opt.val
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 11. OLED PİKSEL KORUMA (Image 6) ── */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-white block">OLED Piksel Koruma</span>
              <span className="text-[9.5px] text-slate-400">
                Saati 60 saniyede bir hafif kaydırarak ekranı korur
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onUpdateSmartDisplayConfig?.({
                  burnInProtection: !smartDisplayConfig.burnInProtection,
                });
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                smartDisplayConfig.burnInProtection
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {smartDisplayConfig.burnInProtection ? 'Aktif' : 'Pasif'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
