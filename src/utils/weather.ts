export interface LocationItem {
  id: string;
  name: string; // e.g., "Ev", "İş Yeri", "Yazlık"
  cityName: string; // e.g., "İstanbul", "Ankara"
  district?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'fog' | 'rainy' | 'snowy' | 'thunder';

export interface HourlyForecast {
  time: string; // '00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'
  temp: number;
  condition: WeatherCondition;
  conditionText: string;
  rainChancePct: number;
  windSpeedKmH: number;
  humidity: number;
  kombiAdvice: string;
}

export interface DayForecast {
  date: string;
  dayName: string; // 'Bugün', 'Yarın', 'Cumartesi'
  dateLabel: string; // '16 Eki', '17 Eki'
  maxTemp: number;
  minTemp: number;
  condition: WeatherCondition;
  conditionText: string;
  rainChancePct: number;
  hourly: HourlyForecast[];
}

export interface WeatherAlertItem {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  time: string;
  summary: string;
  homePrecautions: string[];
  outdoorPrecautions: string[];
}

export interface WeatherNotificationSettings {
  isEnabled: boolean;
  intervalHours: number; // e.g. 3
  notifySuddenChange: boolean;
  notifyPrecautionAlerts: boolean;
}

export interface CurrentWeather {
  temp: number;
  condition: WeatherCondition;
  conditionText: string;
  humidity: number;
  windSpeedKmH: number;
  cityName: string;
  forecast: DayForecast[];
}

export const DEFAULT_LOCATIONS: LocationItem[] = [
  {
    id: 'loc-home',
    name: 'Ev',
    cityName: 'İstanbul',
    district: 'Kadıköy',
    latitude: 40.99,
    longitude: 29.03,
    isDefault: true,
  },
  {
    id: 'loc-work',
    name: 'İş Yeri',
    cityName: 'İstanbul',
    district: 'Levent',
    latitude: 41.08,
    longitude: 29.01,
  },
  {
    id: 'loc-ankara',
    name: 'Ankara Şube',
    cityName: 'Ankara',
    district: 'Çankaya',
    latitude: 39.92,
    longitude: 32.85,
  },
];

/**
 * Maps WMO weather code from Open-Meteo to our weather conditions
 */
export function mapWmoCodeToCondition(code: number): { condition: WeatherCondition; text: string } {
  if (code === 0) return { condition: 'sunny', text: 'Açık & Güneşli' };
  if (code === 1 || code === 2) return { condition: 'partly_cloudy', text: 'Parçalı Bulutlu' };
  if (code === 3) return { condition: 'cloudy', text: 'Çok Bulutlu' };
  if (code === 45 || code === 48) return { condition: 'fog', text: 'Sisli & Puslu' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'rainy', text: 'Yağmurlu' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { condition: 'snowy', text: 'Kar Yağışlı' };
  if (code >= 95) return { condition: 'thunder', text: 'Gök Gürültülü Fırtına' };
  return { condition: 'partly_cloudy', text: 'Bulutlu' };
}

/**
 * Format day name in Turkish (e.g., Bugün, Yarın, Çarşamba)
 */
export function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Bugün';
  if (index === 1) return 'Yarın';

  const date = new Date(dateStr);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[date.getDay()] || dateStr;
}

export function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${months[mIdx] || ''}`.trim();
    }
    const d = new Date(dateStr);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${d.getDate()} ${months[d.getMonth()] || ''}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate 8 realistic 3-hour time-slot forecasts for a given day
 */
export function generateHourlyForecast(
  dateStr: string,
  minTemp: number,
  maxTemp: number,
  baseCondition: WeatherCondition,
  rainChance: number
): HourlyForecast[] {
  const times = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const tempDiff = Math.max(2, maxTemp - minTemp);

  return times.map((t, idx) => {
    let factor = 0;
    let kombiAdvice = '';
    let condition = baseCondition;
    let condText = 'Parçalı Bulutlu';

    switch (idx) {
      case 0:
        factor = 0.2;
        kombiAdvice = 'Gece serinliği: Gece moduna (18.5°C) geçilmesi önerilir.';
        condText = 'Açık / Gece';
        break;
      case 1:
        factor = 0.05;
        kombiAdvice = 'Günün en soğuk saati: Donma koruması & radyatör sirkülasyonu devrede.';
        condText = 'Soğuk & Berrak';
        break;
      case 2:
        factor = 0.15;
        kombiAdvice = 'Sabah uyanışı: Konfor moduna (22.5°C) geçiş tavsiye edilir.';
        condText = 'Sabah Sisi';
        break;
      case 3:
        factor = 0.45;
        kombiAdvice = 'Güneş etkisi başlıyor: Modülasyon %40 seviyesine çekilebilir.';
        condText = 'Güneşli & Ilık';
        break;
      case 4:
        factor = 0.85;
        kombiAdvice = 'Öğle saatleri: Eko mod (20.0°C) dengeli tasarruf sağlar.';
        condText = 'Güneşli';
        break;
      case 5:
        factor = 1.0;
        kombiAdvice = 'Günün en sıcak saati: Kombi bekleme moduna alınabilir.';
        condText = 'Açık & Güneşli';
        break;
      case 6:
        factor = 0.65;
        kombiAdvice = 'Akşam serinliği: Ev dönüşü için Konfor modu aktif.';
        condText = 'Parçalı Bulutlu';
        break;
      case 7:
        factor = 0.35;
        kombiAdvice = 'Geceye geçiş: Dengeli konfor ısıtması devrede.';
        condText = 'Açık';
        break;
    }

    if (rainChance > 45 && (idx === 2 || idx === 3 || idx === 6)) {
      condition = 'rainy';
      condText = 'Yerel Sağanak';
      kombiAdvice = 'Yağış ve nem artışı: Ev içi hissedilen serinlik için kombi hedefi +1°C önerilir.';
    }

    const slotTemp = Math.round((minTemp + factor * tempDiff) * 10) / 10;
    const slotRain = Math.max(5, Math.min(95, Math.round(rainChance * (0.6 + factor * 0.7))));
    const slotWind = Math.round(10 + (idx % 3) * 4);
    const slotHum = Math.round(75 - factor * 25);

    return {
      time: t,
      temp: slotTemp,
      condition,
      conditionText: condText,
      rainChancePct: slotRain,
      windSpeedKmH: slotWind,
      humidity: slotHum,
      kombiAdvice,
    };
  });
}

/**
 * Fallback static 5-day weather forecast when offline or before network request
 */
export function getFallbackForecast(cityName = 'İstanbul'): CurrentWeather {
  const d0 = '2026-10-16';
  const d1 = '2026-10-17';
  const d2 = '2026-10-18';
  const d3 = '2026-10-19';
  const d4 = '2026-10-20';

  return {
    temp: 18.5,
    condition: 'partly_cloudy',
    conditionText: 'Parçalı Bulutlu',
    humidity: 62,
    windSpeedKmH: 14,
    cityName,
    forecast: [
      {
        date: d0,
        dayName: 'Bugün',
        dateLabel: formatDateLabel(d0),
        maxTemp: 19,
        minTemp: 12,
        condition: 'partly_cloudy',
        conditionText: 'Parçalı Bulutlu',
        rainChancePct: 15,
        hourly: generateHourlyForecast(d0, 12, 19, 'partly_cloudy', 15),
      },
      {
        date: d1,
        dayName: 'Yarın',
        dateLabel: formatDateLabel(d1),
        maxTemp: 21,
        minTemp: 13,
        condition: 'sunny',
        conditionText: 'Güneşli',
        rainChancePct: 5,
        hourly: generateHourlyForecast(d1, 13, 21, 'sunny', 5),
      },
      {
        date: d2,
        dayName: 'Cumartesi',
        dateLabel: formatDateLabel(d2),
        maxTemp: 17,
        minTemp: 11,
        condition: 'rainy',
        conditionText: 'Sağanak Yağış',
        rainChancePct: 75,
        hourly: generateHourlyForecast(d2, 11, 17, 'rainy', 75),
      },
      {
        date: d3,
        dayName: 'Pazar',
        dateLabel: formatDateLabel(d3),
        maxTemp: 16,
        minTemp: 9,
        condition: 'cloudy',
        conditionText: 'Çok Bulutlu',
        rainChancePct: 30,
        hourly: generateHourlyForecast(d3, 9, 16, 'cloudy', 30),
      },
      {
        date: d4,
        dayName: 'Pazartesi',
        dateLabel: formatDateLabel(d4),
        maxTemp: 18,
        minTemp: 10,
        condition: 'partly_cloudy',
        conditionText: 'Açık & Parçalı',
        rainChancePct: 10,
        hourly: generateHourlyForecast(d4, 10, 18, 'partly_cloudy', 10),
      },
    ],
  };
}

/**
 * Fetch 5-day real weather from Open-Meteo API
 */
export async function fetchOpenMeteoWeather(lat: number, lon: number, cityName: string): Promise<CurrentWeather> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();

    const curr = data.current_weather;
    const daily = data.daily;

    const currentMapping = mapWmoCodeToCondition(curr.weathercode || 0);

    const forecast: DayForecast[] = [];
    const dates: string[] = daily.time || [];
    const count = Math.min(5, dates.length);

    for (let i = 0; i < count; i++) {
      const code = daily.weathercode?.[i] || 0;
      const mapping = mapWmoCodeToCondition(code);
      const dateStr = dates[i];
      const maxT = Math.round(daily.temperature_2m_max?.[i] ?? 20);
      const minT = Math.round(daily.temperature_2m_min?.[i] ?? 12);
      const rainPct = daily.precipitation_probability_max?.[i] ?? 10;

      forecast.push({
        date: dateStr,
        dayName: formatDayName(dateStr, i),
        dateLabel: formatDateLabel(dateStr),
        maxTemp: maxT,
        minTemp: minT,
        condition: mapping.condition,
        conditionText: mapping.text,
        rainChancePct: rainPct,
        hourly: generateHourlyForecast(dateStr, minT, maxT, mapping.condition, rainPct),
      });
    }

    return {
      temp: Math.round((curr.temperature || 18) * 10) / 10,
      condition: currentMapping.condition,
      conditionText: currentMapping.text,
      humidity: 58,
      windSpeedKmH: Math.round(curr.windspeed || 12),
      cityName,
      forecast: forecast.length > 0 ? forecast : getFallbackForecast(cityName).forecast,
    };
  } catch (err) {
    console.warn('Weather API fetch failed, using fallback:', err);
    return getFallbackForecast(cityName);
  }
}
