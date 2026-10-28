export type MascotType = 'termobot' | 'flamebot' | 'pixelcat';

export type MascotState = 'idle' | 'reading' | 'sleeping' | 'happy';

export type MascotScreenSaverBg =
  | 'black'             // Saf OLED Siyah
  | 'cyber_station'     // Siber Termo İstasyonu (Mavi-mor fütüristik grid)
  | 'warm_hearth'       // Sıcak Kombi Köşesi (Köz, şömine ve kehribar bokeh)
  | 'midnight_purple'   // Gece Ambiyansı (Derin obsidyen nebula)
  | 'custom';           // Özel Duvar Kağıdı / Cihazdan Görsel

export interface MascotConfig {
  enabled: boolean;                 // Ekran Koruyucu Açık / Kapalı
  type: MascotType;                 // 'termobot'
  screensaverTimeoutSec: number;    // 15, 30, 60, 120, 300 (0 = Kapalı)
  backgroundMode: MascotScreenSaverBg;
  customWallpaperUrl?: string;
  isBackgroundBlurred: boolean;     // Arka planı blur göster
  showOnSmartDisplay?: boolean;
  showOnMainScreen?: boolean;
}

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  enabled: true,
  type: 'termobot',
  screensaverTimeoutSec: 30,         // Varsayılan 30 saniye işlem yapılmadığında
  backgroundMode: 'black',          // Varsayılan saf siyah ekran koruyucu
  customWallpaperUrl: '',
  isBackgroundBlurred: false,
  showOnSmartDisplay: false,
  showOnMainScreen: false,
};
