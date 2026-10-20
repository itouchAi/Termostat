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
  | 'relax_piano'
  | 'nature'
  | 'custom';

export type SlideTransition = 'fade' | 'slide' | 'zoom';

export type ImageFitMode = 'cover' | 'contain' | 'fill';

export type EqualizerStyle = 'bars' | 'wave' | 'pulse';

export type PresetVisualTheme =
  | 'fireplace'
  | 'rainy_window'
  | 'winter_snow'
  | 'sunset_forest'
  | 'aurora'
  | 'minimal_black'
  | 'custom';

export interface MediaPlaylistItem {
  id: string;
  name: string;
  url: string;
}

export interface SmartDisplayConfig {
  enabled: boolean; // Kullanıcının Ayarlar'dan açıp kapattığı onay tiki
  mode: SmartDisplayMode;
  presetTheme: PresetVisualTheme;
  customImageUrl?: string; // Dışarıdan girilen tekli özel görsel
  customVideoUrl?: string; // Dışarıdan girilen tekli özel video
  customImages: MediaPlaylistItem[]; // Çoklu slayt görselleri listesi
  customVideos: MediaPlaylistItem[]; // Çoklu video oynatma listesi
  customAudioTracks: MediaPlaylistItem[]; // Çoklu MP3 müzik listesi
  imageFitMode: ImageFitMode; // 'cover' (Oto/Doldur) | 'contain' (Sığdır/Fit) | 'fill' (Uzat/Stretch)
  slideshowIntervalSec: number; // 5, 10, 15, 30
  slideTransition: SlideTransition;
  audioTrack: AmbientAudioTrack;
  customAudioUrl?: string; // Dışarıdan girilen özel MP3 / ses akış URL
  audioVolume: number; // 0.0 - 1.0
  brightnessPercent: number; // 10 - 100
  sleepTimeoutMin: number; // 0 = Hiçbir zaman, 1, 5, 15, 30 dk
  burnInProtection: boolean; // OLED piksel kaydırma
  showMarqueeTrackTitle: boolean; // Üstte kayan yazı şarkı ismi barı
  equalizerEnabled: boolean; // Müzik ekolayzır modu (ekranı hafif blur yaparak ön plana çıkar)
  equalizerStyle: EqualizerStyle; // 'bars' | 'wave' | 'pulse'
}

export const DEFAULT_SMART_DISPLAY_CONFIG: SmartDisplayConfig = {
  enabled: false,
  mode: 'aod',
  presetTheme: 'fireplace',
  customImageUrl: '',
  customVideoUrl: '',
  customImages: [],
  customVideos: [],
  customAudioTracks: [],
  imageFitMode: 'cover',
  slideshowIntervalSec: 10,
  slideTransition: 'fade',
  audioTrack: 'none',
  customAudioUrl: '',
  audioVolume: 0.5,
  brightnessPercent: 85,
  sleepTimeoutMin: 0,
  burnInProtection: true,
  showMarqueeTrackTitle: true,
  equalizerEnabled: false,
  equalizerStyle: 'bars',
};
