export interface ScheduleItem {
  id: string;
  name: string;
  enabled: boolean;
  time: string; // "HH:MM"
  targetTemp: number;
}

export interface ThermostatState {
  currentTemp: number;
  humidity: number;
  targetTemp: number;
  waterPressureBar: number;
  isKombiActive: boolean;
  flameLevelPercent: number;
  pumpRpm: number;
  dailyRunMinutes: number;
  tempHistory: Array<{ time: string; temp: number; target: number; isActive: boolean }>;
}

export interface SecurityConfig {
  isVaultLocked: boolean;
  hasCustomPin: boolean;
  encryptedAt: string | null;
  encryptionAlgorithm: string;
}

export interface WidgetItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export type ThemeMode = 'light' | 'dark';
export type MorphMode = 'heat' | 'eco' | 'night' | 'boost' | 'standby';
