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

export interface DayForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  condition: WeatherCondition;
  conditionText: string;
  rainChancePct: number;
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

/**
 * Fallback static 5-day weather forecast when offline or before network request
 */
export function getFallbackForecast(cityName = 'İstanbul'): CurrentWeather {
  return {
    temp: 18.5,
    condition: 'partly_cloudy',
    conditionText: 'Parçalı Bulutlu',
    humidity: 62,
    windSpeedKmH: 14,
    cityName,
    forecast: [
      { date: '2026-10-15', dayName: 'Bugün', maxTemp: 19, minTemp: 12, condition: 'partly_cloudy', conditionText: 'Parçalı Bulutlu', rainChancePct: 15 },
      { date: '2026-10-16', dayName: 'Yarın', maxTemp: 21, minTemp: 13, condition: 'sunny', conditionText: 'Güneşli', rainChancePct: 5 },
      { date: '2026-10-17', dayName: 'Cumartesi', maxTemp: 17, minTemp: 11, condition: 'rainy', conditionText: 'Sağanak Yağış', rainChancePct: 75 },
      { date: '2026-10-18', dayName: 'Pazar', maxTemp: 16, minTemp: 9, condition: 'cloudy', conditionText: 'Çok Bulutlu', rainChancePct: 30 },
      { date: '2026-10-19', dayName: 'Pazartesi', maxTemp: 18, minTemp: 10, condition: 'partly_cloudy', conditionText: 'Açık & Parçalı', rainChancePct: 10 },
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
      forecast.push({
        date: dates[i],
        dayName: formatDayName(dates[i], i),
        maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? 20),
        minTemp: Math.round(daily.temperature_2m_min?.[i] ?? 12),
        condition: mapping.condition,
        conditionText: mapping.text,
        rainChancePct: daily.precipitation_probability_max?.[i] ?? 10,
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
