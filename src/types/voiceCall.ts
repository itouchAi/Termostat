export type CallState = 'idle' | 'ringing' | 'in_call' | 'ended' | 'missed';

export interface VoiceCallConfig {
  enabled: boolean;
  userName: string;
  ringDurationSec: number;              // Varsayılan: 10 saniye çalma
  autoCallOnIgnition: boolean;          // Kombi ateşlendiğinde otomatik ara
  autoCallOnLowTemp: boolean;           // Sıcaklık eşik altına düştüğünde ara
  lowTempThreshold: number;             // Örn: 19.5 °C
  soundRingtoneEnabled: boolean;        // Zil sesi
  vibrationEnabled: boolean;            // Titreşim
  speechSynthesisEnabled: boolean;      // Türkçe sesli konuşma (TTS)
  speechRecognitionEnabled: boolean;    // Kullanıcıyı dinleme (STT)
  androidLiveNotificationWidget: boolean; // Android üst perde kalıcı canlı kumanda bildirimi
}

export const DEFAULT_VOICE_CALL_CONFIG: VoiceCallConfig = {
  enabled: true,
  userName: 'Aytaç',
  ringDurationSec: 10,
  autoCallOnIgnition: true,
  autoCallOnLowTemp: true,
  lowTempThreshold: 19.5,
  soundRingtoneEnabled: true,
  vibrationEnabled: true,
  speechSynthesisEnabled: true,
  speechRecognitionEnabled: true,
  androidLiveNotificationWidget: true,
};
