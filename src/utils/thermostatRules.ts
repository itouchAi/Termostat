import type { ScheduleItem, ThemeMode } from '../types.ts';


/**
 * Determine if kombi relay should be ON or OFF based on temperature difference and hysteresis
 */
export function calculateRelayStatus(
  currentTemp: number,
  targetTemp: number,
  currentRelayState: boolean,
  hysteresis = 0.4
): boolean {
  if (currentTemp <= targetTemp - hysteresis) {
    return true; // Turn ON
  }
  if (currentTemp >= targetTemp + hysteresis) {
    return false; // Turn OFF
  }
  return currentRelayState; // Maintain state in deadband
}

/**
 * Calculate modulating burner flame power from 0% to 100%
 */
export function calculateFlameModulation(
  currentTemp: number,
  targetTemp: number,
  isRelayActive: boolean
): number {
  if (!isRelayActive) return 0;
  const delta = targetTemp - currentTemp;
  if (delta <= 0) return 15; // Minimum pilot flame modulation
  if (delta >= 2.5) return 100; // Full blast
  // Linear ramp between 20% and 100%
  const pct = 20 + (delta / 2.5) * 80;
  return Math.min(100, Math.max(20, Math.round(pct)));
}

/**
 * Calculate estimated gas consumption in m³
 * Typical 24kW boiler consumes ~2.4 m³/h at 100% modulation
 */
export function estimateGasConsumption(
  minutesRunning: number,
  averageFlamePct = 70,
  boilerKw = 24
): number {
  if (minutesRunning <= 0) return 0;
  const hours = minutesRunning / 60;
  const maxM3PerHour = (boilerKw / 10); // ~2.4 m3/h
  const consumption = hours * maxM3PerHour * (averageFlamePct / 100);
  return Math.round(consumption * 100) / 100;
}

/**
 * Calculate cost estimate in Turkish Lira (TL)
 * Current average natural gas unit price in TR: ~8.50 TL / m³
 */
export function calculateEstimatedCost(m3Consumed: number, pricePerM3 = 8.5): number {
  return Math.round(m3Consumed * pricePerM3 * 10) / 10;
}

/**
 * Check schedules and determine if a scheduled target temp should be applied at current time
 */
export function evaluateActiveSchedule(
  schedules: ScheduleItem[],
  currentHour: number,
  currentMinute: number
): ScheduleItem | null {
  const activeSchedules = schedules.filter(s => s.enabled);
  if (activeSchedules.length === 0) return null;

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  let bestMatch: ScheduleItem | null = null;
  let maxTime = -1;

  for (const item of activeSchedules) {
    const parts = item.time.split(':');
    if (parts.length !== 2) continue;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) continue;
    const schedTotalMinutes = h * 60 + m;

    if (schedTotalMinutes <= currentTotalMinutes) {
      if (schedTotalMinutes > maxTime) {
        maxTime = schedTotalMinutes;
        bestMatch = item;
      }
    }
  }

  // If none matched today before this hour, wrap to the latest schedule of the day
  if (!bestMatch) {
    let latestTime = -1;
    for (const item of activeSchedules) {
      const parts = item.time.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const schedTotalMinutes = h * 60 + m;
      if (schedTotalMinutes > latestTime) {
        latestTime = schedTotalMinutes;
        bestMatch = item;
      }
    }
  }

  return bestMatch;
}

/**
 * Determine whether system/auto theme should be dark based on hour and minute (night between 19:30 and 07:00)
 */
export function isSystemDarkMode(hour: number, minute = 0): boolean {
  const totalMinutes = hour * 60 + minute;
  // Day: 07:00 (420 min) to 19:30 (1170 min)
  return totalMinutes < 420 || totalMinutes >= 1170;
}

/**
 * Resolve effective visual theme ('light' | 'dark') given mode, time, and OS preference
 */
export function resolveEffectiveTheme(
  mode: ThemeMode,
  hour: number,
  minute = 0,
  osPrefersDark = false
): 'light' | 'dark' {
  if (mode === 'dark' || mode === 'obsidian_lavender') return 'dark';
  if (mode === 'light') return 'light';
  if (mode === 'glass') {
    // Glass mode uses translucent dark/contrast palette for maximum Apple visionOS clarity
    // or dark during evening/night hours
    return isSystemDarkMode(hour, minute) ? 'dark' : 'dark';
  }
  // 'system' mode: prioritize time of day, with fallback to OS preference
  return isSystemDarkMode(hour, minute) ? 'dark' : 'light';
}


/**
 * Comfort Index Assessment based on temperature and relative humidity
 */
export function calculateComfortIndex(temp: number, humidity: number): {
  score: number; // 0 to 100
  label: string;
  color: string;
} {
  // Ideal: 21°C - 23°C and 45% - 55% RH
  let score = 100;
  const tempDiff = Math.abs(temp - 22);
  score -= tempDiff * 15;

  const humDiff = Math.abs(humidity - 50);
  score -= humDiff * 0.8;

  score = Math.max(10, Math.min(100, Math.round(score)));

  if (score >= 85) return { score, label: 'Mükemmel Konfor', color: '#10b981' };
  if (score >= 65) return { score, label: 'İyi / Dengeli', color: '#3b82f6' };
  if (score >= 45) return { score, label: 'Orta Seviye', color: '#f59e0b' };
  return { score, label: 'Düşük Konfor', color: '#ef4444' };
}
