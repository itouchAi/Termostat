export type EspEventType =
  | 'combustion_start'
  | 'combustion_end'
  | 'wdt_check'
  | 'reboot'
  | 'offline_sync'
  | 'temp_alert';

export interface EspEventLog {
  id: string;
  timestamp: number;
  type: EspEventType;
  title: string;
  details: string;
  durationMinutes?: number;
  startTemp?: number;
  endTemp?: number;
  targetTemp?: number;
  wdtStatus: 'ok' | 'recovered' | 'triggered';
}

export interface EspHardwareStatus {
  isConnected: boolean;
  lastHeartbeat: number;
  ipAddress: string;
  macAddress: string;
  uptimeSeconds: number;
  freeHeapBytes: number;
  wifiRssi: number; // e.g. -58 dBm (Güçlü)
  wdtResetCount: number;
  offlineRecordedEventsCount: number;
  flashStorageUsedPercent: number;
}

export const INITIAL_ESP_STATUS: EspHardwareStatus = {
  isConnected: true,
  lastHeartbeat: Date.now() - 4000,
  ipAddress: '192.168.1.142',
  macAddress: '48:3F:DA:8A:2C:9E',
  uptimeSeconds: 84320, // ~23.4 saat kesintisiz
  freeHeapBytes: 198420,
  wifiRssi: -58,
  wdtResetCount: 0,
  offlineRecordedEventsCount: 6,
  flashStorageUsedPercent: 18,
};

export const INITIAL_ESP_LOGS: EspEventLog[] = [
  {
    id: 'log-1',
    timestamp: Date.now() - 32 * 60 * 1000, // 32 dk önce
    type: 'combustion_end',
    title: 'Çevrimdışı Ateşleme Tamamlandı',
    details: 'Hedef 22.5°C ulaşıldı. Kombi alevi başarıyla söndü.',
    durationMinutes: 26,
    startTemp: 20.3,
    endTemp: 22.6,
    targetTemp: 22.5,
    wdtStatus: 'ok',
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 58 * 60 * 1000,
    type: 'combustion_start',
    title: 'Otomatik Isıtma Başladı',
    details: 'Oda sıcaklığı 20.3°C altına indiğinde termostat rölesi tetiklendi.',
    startTemp: 20.3,
    targetTemp: 22.5,
    wdtStatus: 'ok',
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 3 * 3600 * 1000,
    type: 'wdt_check',
    title: 'Donanımsal WDT Sağlık Kontrolü',
    details: 'Döngü süresi 4ms. Bellek sızıntısı yok, Watchdog sıfırlandı.',
    wdtStatus: 'ok',
  },
  {
    id: 'log-4',
    timestamp: Date.now() - 6 * 3600 * 1000,
    type: 'combustion_end',
    title: 'Sabah Isınma Döngüsü',
    details: 'Konfor programı devrede. Süre: 34 dakika.',
    durationMinutes: 34,
    startTemp: 19.5,
    endTemp: 22.5,
    targetTemp: 22.5,
    wdtStatus: 'ok',
  },
  {
    id: 'log-5',
    timestamp: Date.now() - 11 * 3600 * 1000,
    type: 'offline_sync',
    title: 'Flaş Bellek (LittleFS) Senkronizasyonu',
    details: 'Uygulama kapalıyken 4 çevrimdışı telemetri paketi hafızaya kaydedildi.',
    wdtStatus: 'ok',
  },
  {
    id: 'log-6',
    timestamp: Date.now() - 24 * 3600 * 1000,
    type: 'reboot',
    title: 'Sistem Başlatıldı (Boot OK)',
    details: 'Donanım WDT devrede, Wi-Fi ağına bağlandı. Sürüm v2.4.1-ota.',
    wdtStatus: 'ok',
  },
];
