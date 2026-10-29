export type MascotType =
  | 'termobot'        // 1. TermoBot Retro Asistan Robot
  | 'cat'             // 2. Mırnav (Sıcak Petek Kedisi)
  | 'rabbit'          // 3. Puki (Sevimli Tavşan)
  | 'human_male'      // 4. Mert (Erkek Ev Yöneticisi)
  | 'human_female';   // 5. Ela (Kadın Ev Yöneticisi)

export type MascotState =
  | 'idle'            // Boşta duruş / canlı nefes alma
  | 'walking'         // Sağa sola adımlama
  | 'knocking'        // Ekrana tık tık vurma / canı sıkılma
  | 'thinking'        // Düşünme işareti / ampul
  | 'reading'         // Kitap okuma
  | 'light_sleep'     // Hafif uykuya dalma (Zzz)
  | 'brief_wake'      // Arada uyanıp etrafa bakınma
  | 'deep_sleep'      // 3 döngü sonrası derin uyku
  | 'sleeping'        // Genel uyku durumu (geriye dönük uyumlu)
  | 'happy';          // Dokununca sevinme / uyanma

export type MascotScreenSaverBg =
  | 'black'             // Saf OLED Siyah
  | 'cyber_station'     // Siber Termo İstasyonu (Mavi-mor fütüristik grid)
  | 'warm_hearth'       // Sıcak Kombi Köşesi (Köz, şömine ve kehribar bokeh)
  | 'midnight_purple'   // Gece Ambiyansı (Derin obsidyen nebula)
  | 'custom';           // Özel Duvar Kağıdı / Cihazdan Görsel

export interface MascotConfig {
  enabled: boolean;                 // Ekran Koruyucu Açık / Kapalı
  type: MascotType;                 // Aktif Maskot Karakteri
  screensaverTimeoutSec: number;    // 15, 30, 60, 120, 300 (0 = Kapalı)
  backgroundMode: MascotScreenSaverBg;
  customWallpaperUrl?: string;
  isBackgroundBlurred: boolean;     // Arka planı blur göster
  soundEffectsEnabled: boolean;     // Sevimli robot/karakter ses efektleri
  showOnSmartDisplay?: boolean;
  showOnMainScreen?: boolean;
}

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  enabled: true,
  type: 'termobot',
  screensaverTimeoutSec: 30,         // 30 saniye işlem yapılmadığında
  backgroundMode: 'black',          // Varsayılan saf siyah ekran koruyucu
  customWallpaperUrl: '',
  isBackgroundBlurred: false,
  soundEffectsEnabled: true,        // Varsayılan ses efektleri açık
  showOnSmartDisplay: false,
  showOnMainScreen: false,
};
