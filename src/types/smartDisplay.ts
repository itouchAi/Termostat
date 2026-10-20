export type SmartDisplayMode =
  | 'aod'
  | 'video'
  | 'video_audio_muted_mp3'
  | 'image'
  | 'slideshow';

export type AmbientAudioTrack =
  | 'none'
  | 'fireplace'
  | 'rain'
  | 'lofi'
  | 'relax_piano';

export type SlideTransition = 'fade' | 'slide' | 'zoom';

export type PresetVisualTheme =
  | 'fireplace'
  | 'rainy_window'
  | 'winter_snow'
  | 'sunset_forest'
  | 'aurora'
  | 'minimal_black';

export interface SmartDisplayConfig {
  enabled: boolean; // Kullanıcının Ayarlar'dan açıp kapattığı onay tiki
  mode: SmartDisplayMode;
  presetTheme: PresetVisualTheme;
  slideshowIntervalSec: number; // 5, 10, 15, 30
  slideTransition: SlideTransition;
  audioTrack: AmbientAudioTrack;
  audioVolume: number; // 0.0 - 1.0
  brightnessPercent: number; // 10 - 100
  sleepTimeoutMin: number; // 0 = Hiçbir zaman, 1, 5, 15, 30 dk
  burnInProtection: boolean; // OLED piksel kaydırma
}

export const DEFAULT_SMART_DISPLAY_CONFIG: SmartDisplayConfig = {
  enabled: false, // Varsayılan olarak kapalı (kullanıcı onayı gerektirir)
  mode: 'aod',
  presetTheme: 'minimal_black',
  slideshowIntervalSec: 10,
  slideTransition: 'fade',
  audioTrack: 'none',
  audioVolume: 0.5,
  brightnessPercent: 85,
  sleepTimeoutMin: 0, // Sürekli Açık
  burnInProtection: true,
};
