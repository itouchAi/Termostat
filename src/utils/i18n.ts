export type Language = 'tr' | 'en';

export interface TranslationDictionary {
  // Top Header
  langLabel: string;
  perfUltra: string;
  perfUltraTitle: string;
  perfEco: string;
  perfEcoTitle: string;
  themeGlass: string;
  themeAuto: string;
  themeDark: string;
  themeLight: string;
  themeMenuTitle: string;
  customizeWidgets: string;
  settingsTitle: string;
  cloudSyncConnected: string;
  cloudSyncOffline: string;

  // Bottom Nav
  tabThermostat: string;
  tabWeather: string;
  tabReport: string;
  tabProgram: string;
  swipeHint: string;

  // Thermostat Screen
  activeHeating: string;
  standby: string;
  modulation: string;
  liveRoom: string;
  targetTemp: string;
  presetNight: string;
  presetEco: string;
  presetComfort: string;
  presetAway: string;
  presetBoost: string;
  dialAdjustHint: string;
  todayActiveCounterLabel: string;
  lastIgnitionCounterLabel: string;
  activeBurningNow: string;
  standbyDuration: string;
  noIgnitionYet: string;

  // Weather Screen
  weatherTitle: string;
  savedLocations: string;
  addLocation: string;
  locationName: string;
  cityName: string;
  saveLocation: string;
  cancel: string;
  forecast5Days: string;
  rainChance: string;
  humidityLabel: string;
  windLabel: string;
  notificationsOn: string;
  notificationsOff: string;
  hourlyDetails: string;
  precautionTitle: string;

  // Report Screen
  repTabHeatmap: string;
  repTabGasBill: string;
  repTabBoiler: string;
  timeframeDaily: string;
  timeframeWeekly: string;
  timeframeMonthly: string;
  inspectedDate: string;
  todayLabel: string;
  activeBurnTime: string;
  standbyTime: string;
  avgRoomTemp: string;
  totalGasUsed: string;
  hourlyDetailTitle: string;
  powerKwLabel: string;
  gasM3Label: string;
  close: string;
  noDataTitle: string;
  noDataDesc: string;
  backToToday: string;

  // Gas Bill Section
  billEstimateTitle: string;
  billEstimateSub: string;
  unitPriceLabel: string;
  meterReading: string;
  estimatedCost: string;
  efficiencySavings: string;

  // Boiler & Sensors Section
  boilerRelayStatus: string;
  burnerFlamePower: string;
  waterPressure: string;
  circulationPump: string;
  safetyRelay: string;
  ambientSensors: string;
  pressureNormal: string;
  relayActive: string;
  relayStandby: string;

  // Notification Settings Section in Ayarlar
  notifSectionTitle: string;
  notifSectionSub: string;
  notif3hTitle: string;
  notif3hDesc: string;
  notifCriticalTitle: string;
  notifCriticalDesc: string;
  notifTestBtn: string;
  notifViewPrecautions: string;
  notifActive: string;
  notifInactive: string;

  // Program Screen
  progTabSchedule: string;
  progTabConsumption: string;
  encryptedGcm: string;
  progNight: string;
  progMorning: string;
  progAway: string;
  progEvening: string;
  saveSchedule: string;
  scheduleSaved: string;
  dailyRuntime: string;
  estimatedSavings: string;
  modulationEfficiency: string;

  // Theme Modal
  themeModalTitle: string;
  themeModalSub: string;
  themeGlassTitle: string;
  themeGlassDesc: string;
  themeDarkTitle: string;
  themeDarkDesc: string;
  themeLightTitle: string;
  themeLightDesc: string;
  themeSystemTitle: string;
  themeSystemDesc: string;
  perfSectionTitle: string;
  perfUltraOption: string;
  perfUltraDesc: string;
  perfEcoOption: string;
  perfEcoDesc: string;
  weatherTestTitle: string;

  // Settings Modal & Reset
  settingsModalTitle: string;
  settingsModalSub: string;
  vaultCardTitle: string;
  vaultCardSub: string;
  openVault: string;
  firebaseUrlLabel: string;
  firebaseKeyLabel: string;
  saveSettings: string;
  settingsSaved: string;
  resetDataSectionTitle: string;
  resetDataWarning: string;
  resetDataBtn: string;
  resetDataConfirm: string;
  resetDataSuccess: string;

  // Voice Assistant & Google Home
  voiceAssistantTitle: string;
  voiceAssistantSub: string;
  voiceAssistantListening: string;
  voiceAssistantSpeakNow: string;
  voiceAssistantPlaceholder: string;
  voiceAssistantBtnTooltip: string;
  voiceAssistantQuickPrompts: string;
  googleHomeTitle: string;
  googleHomeSub: string;
  googleHomeBadge: string;
  googleHomeDesc: string;
  googleHomeTestBtn: string;
  googleHomeGuideBtn: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  tr: {
    // Top Header
    langLabel: 'TR',
    perfUltra: '60 FPS',
    perfUltraTitle: 'Maksimum Performans (60 FPS Ultra Kalite)',
    perfEco: 'Eco Mod',
    perfEcoTitle: 'Düşük Güç (Eco Pil Tasarrufu Modu)',
    themeGlass: 'Canlı Cam',
    themeAuto: 'Oto',
    themeDark: 'Gece',
    themeLight: 'Gündüz',
    themeMenuTitle: 'Tema & Görsel Efektler',
    customizeWidgets: "Widget'ları Kişiselleştir",
    settingsTitle: 'Ayarlar & Sistem',
    cloudSyncConnected: '● Bağlı & Aktif',
    cloudSyncOffline: '○ Çevrimdışı / Yerel Mod',

    // Bottom Nav
    tabThermostat: 'Termo.',
    tabWeather: 'Hava',
    tabReport: 'Rapor',
    tabProgram: 'Prog.',
    swipeHint: 'Parmakla Kaydırın',

    // Thermostat Screen
    activeHeating: 'Aktif Isıtma 🔥',
    standby: 'Beklemede ❄️',
    modulation: 'modülasyon',
    liveRoom: 'Canlı Oda:',
    targetTemp: 'Hedef Sıcaklık:',
    presetNight: 'Gece',
    presetEco: 'Eko',
    presetComfort: 'Konfor',
    presetAway: 'Dışarı',
    presetBoost: 'Boost',
    dialAdjustHint: '💡 Kadran üzerindeki turuncu bar çizgisine dokunarak hedefi ayarlayabilirsiniz.',
    todayActiveCounterLabel: 'Bugün Açık Kalma',
    lastIgnitionCounterLabel: 'Ateşleme Durumu',
    activeBurningNow: 'aktif yanıyor 🔥',
    standbyDuration: 'süredir yanmıyor ❄️',
    noIgnitionYet: 'Henüz ateşleme yok',

    // Weather Screen
    weatherTitle: 'Canlı Hava Durumu & 5 Günlük Tahmin',
    savedLocations: 'Kayıtlı Konumlar (Cihaz Yönetimi)',
    addLocation: 'Yeni Konum Ekle',
    locationName: 'Konum Adı (Örn: Yazlık Ev)',
    cityName: 'Şehir',
    saveLocation: 'Konumu Kaydet',
    cancel: 'İptal',
    forecast5Days: '5 Günlük Hava Tahmini',
    rainChance: 'Yağış Olasılığı',
    humidityLabel: 'Nem',
    windLabel: 'Rüzgar',
    notificationsOn: 'Bildirimler Açık',
    notificationsOff: 'Bildirimler Kapalı',
    hourlyDetails: 'Saatlik Ayrıntılar',
    precautionTitle: 'Hava Durumu Önlemi & Isıtma Önerisi',

    // Report Screen
    repTabHeatmap: 'Sıcaklık Haritası',
    repTabGasBill: 'Tüketim ve Fatura',
    repTabBoiler: 'Kombi & Sensörler',
    timeframeDaily: 'Günlük',
    timeframeWeekly: 'Haftalık',
    timeframeMonthly: 'Aylık',
    inspectedDate: 'İncelenen Gün:',
    todayLabel: 'Bugün',
    activeBurnTime: 'Aktif Yanma',
    standbyTime: 'Beklemede',
    avgRoomTemp: 'Ort. Sıcaklık',
    totalGasUsed: 'Toplam Doğalgaz',
    hourlyDetailTitle: 'Detayları',
    powerKwLabel: 'Anlık Güç (kW)',
    gasM3Label: 'Tüketim (m³)',
    close: 'Kapat',
    noDataTitle: 'Bu Tarihe Ait Kayıtlı Veri Yok',
    noDataDesc: 'Seçili güne ait brülör çalışma veya sıcaklık telemetri kaydı bulunmuyor. Canlı kullanım kaydedildikçe listelenecektir.',
    backToToday: 'Bugüne Dön',

    // Gas Bill Section (2. Görseldeki Yazı Düzeltildi)
    billEstimateTitle: 'Tüketim ve Fatura',
    billEstimateSub: 'Gerçek zamanlı sayaç ve birim fiyat hesaplaması',
    unitPriceLabel: 'Doğalgaz m³ Birim Fiyatı',
    meterReading: 'Sayaç Tüketimi',
    estimatedCost: 'Tahmini Tutar',
    efficiencySavings: 'Modülasyon Tasarrufu',

    // Boiler & Sensors Section
    boilerRelayStatus: 'Kombi Röle Durumu',
    burnerFlamePower: 'Brülör Alev Gücü',
    waterPressure: 'Su Basıncı',
    circulationPump: 'Sirkülasyon Pompası',
    safetyRelay: 'Güvenlik Rölesi',
    ambientSensors: 'Ortam Sensörleri',
    pressureNormal: 'Normal Çalışma',
    relayActive: 'Devrede',
    relayStandby: 'Hazır',

    // Notification Settings Section in Ayarlar
    notifSectionTitle: 'Bildirim Ayarları & Otomasyon',
    notifSectionSub: 'Otomatik 3 saatlik durum özeti ve kritik kombi emniyet bildirimleri',
    notif3hTitle: 'Otomatik 3 Saatlik Periyodik Durum Bildirimi',
    notif3hDesc: 'Her 3 saatte bir kombi durumu, hava tahmini ve akıllı ısıtma tedbirleri otomatik gönderilir.',
    notifCriticalTitle: 'Acil & Kritik Emniyet Bildirimleri',
    notifCriticalDesc: 'Düşük su basıncı (<1.0 Bar), brülör alev sönmesi ve donma riski (<5°C) durumunda anında sesli ve görsel acil uyarı üretilir.',
    notifTestBtn: 'Test Bildirimi Gönder',
    notifViewPrecautions: 'Önlemleri Gör',
    notifActive: 'Devrede',
    notifInactive: 'Kapalı',

    // Program Screen
    progTabSchedule: 'Akıllı Zamanlama',
    progTabConsumption: 'Günlük Tüketim & Tasarruf',
    encryptedGcm: 'AES-GCM Şifreli',
    progNight: 'Gece Uyku',
    progMorning: 'Sabah Uyanış',
    progAway: 'Evde Yokken',
    progEvening: 'Akşam Konfor',
    saveSchedule: 'Programı Kaydet',
    scheduleSaved: 'Kaydedildi!',
    dailyRuntime: 'Günlük Çalışma Süresi',
    estimatedSavings: 'Tahmini Tasarruf',
    modulationEfficiency: 'Modülasyon Verimliliği',

    // Theme Modal
    themeModalTitle: 'Görsel Efekt & Tema Tercihleri',
    themeModalSub: 'Canlı hava durumu atmosferi, liquid glass ve performans seçenekleri',
    themeGlassTitle: 'Canlı Cam (Liquid Glass)',
    themeGlassDesc: 'Arka planda gerçek zamanlı hava durumu, saydam cam çerçeveler ve akışkan ışık yansıması',
    themeDarkTitle: 'Koyu Gece Modu',
    themeDarkDesc: 'Yüksek kontrastlı, göz yormayan derin obsidian ve slate karanlık arayüz',
    themeLightTitle: 'Aydınlık Gündüz Modu',
    themeLightDesc: 'Güneş ışığında kristal netliğinde ferah beyaz ve serin gri tonları',
    themeSystemTitle: 'Otomatik Sistem Modu',
    themeSystemDesc: 'Günün saatine ve güneşin batışına göre dinamik otomatik geçiş',
    perfSectionTitle: 'Cihaz Performans Modu (FPS & Pil)',
    perfUltraOption: 'Maksimum Performans / Ultra Kalite',
    perfUltraDesc: 'Güçlü telefonlar için 60 FPS, tam partikül yoğunluğu ve hacimsel gökyüzü',
    perfEcoOption: 'Düşük Güç / Eco Mod',
    perfEcoDesc: 'Tasarruf modu, optimize edilmiş parçacık sayısı ve batarya koruması',
    weatherTestTitle: 'Hava Durumu Önizleme Testi',

    // Settings Modal & Reset
    settingsModalTitle: 'Ayarlar & Sistem Tercihleri',
    settingsModalSub: 'Bulut bağlantısı, şifreli kasa ve veri yönetimi',
    vaultCardTitle: 'Şifreli Kasa & Bildirimler',
    vaultCardSub: 'PIN korumalı kasa kilidi ve Telegram bot bildirimleri',
    openVault: 'Aç',
    firebaseUrlLabel: 'Firebase Database URL:',
    firebaseKeyLabel: 'Firebase Web API Key:',
    saveSettings: 'Ayarları Kaydet',
    settingsSaved: 'Kaydedildi!',
    resetDataSectionTitle: 'Geçmiş Verileri ve Tüketim Kayıtlarını Sıfırla',
    resetDataWarning: 'Hafızadaki tüm geçmiş kullanım, sıcaklık saatlik kayıtları ve fatura telemetrisi tamamen sıfırlanacaktır. Canlı test öncesi tertemiz başlangıç sağlar.',
    resetDataBtn: 'Geçmiş Verileri Sıfırla',
    resetDataConfirm: 'Tüm geçmiş veriler silinsin mi?',
    resetDataSuccess: 'Tüm geçmiş veriler başarıyla sıfırlandı!',

    // Sesli Asistan & Google Home
    voiceAssistantTitle: 'Sesli Komut Asistanı',
    voiceAssistantSub: 'Sıcaklık, modlar ve durum sorgulama için Türkçe sesli komutlar',
    voiceAssistantListening: 'Dinliyor...',
    voiceAssistantSpeakNow: 'Şimdi konuşun veya komut yazın',
    voiceAssistantPlaceholder: 'Örn: Sıcaklığı 23 yap, Eko mod, Kombi yanıyor mu?',
    voiceAssistantBtnTooltip: 'Sesli Komut Asistanı (Mikrofon)',
    voiceAssistantQuickPrompts: 'Hızlı Sesli Komutlar:',
    googleHomeTitle: 'Google Home & Asistan',
    googleHomeSub: 'Firebase üzerinden Google Asistan ile sesli kontrol entegrasyonu',
    googleHomeBadge: 'Google ile Uyumlu',
    googleHomeDesc: 'Firebase veritabanınız sayesinde Google Asistan cihazları ("Hey Google, sıcaklığı 23 yap") doğrudan kombinizle konuşur.',
    googleHomeTestBtn: 'Google Home Komutunu Simüle Et',
    googleHomeGuideBtn: 'Entegrasyon Kılavuzu',
  },
  en: {
    // Top Header
    langLabel: 'EN',
    perfUltra: '60 FPS',
    perfUltraTitle: 'Maximum Performance (60 FPS Ultra Quality)',
    perfEco: 'Eco Mode',
    perfEcoTitle: 'Low Power (Battery Saver Mode)',
    themeGlass: 'Liquid Glass',
    themeAuto: 'Auto',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeMenuTitle: 'Theme & Visual Effects',
    customizeWidgets: 'Customize Widgets',
    settingsTitle: 'Settings & System',
    cloudSyncConnected: '● Connected & Active',
    cloudSyncOffline: '○ Offline / Local Mode',

    // Bottom Nav
    tabThermostat: 'Thermo.',
    tabWeather: 'Weather',
    tabReport: 'Report',
    tabProgram: 'Prog.',
    swipeHint: 'Swipe with finger',

    // Thermostat Screen
    activeHeating: 'Active Heating 🔥',
    standby: 'Standby ❄️',
    modulation: 'modulation',
    liveRoom: 'Live Room:',
    targetTemp: 'Target Temp:',
    presetNight: 'Night',
    presetEco: 'Eco',
    presetComfort: 'Comfort',
    presetAway: 'Away',
    presetBoost: 'Boost',
    dialAdjustHint: '💡 Touch the orange arc on the dial to adjust the target temperature.',
    todayActiveCounterLabel: 'Today On-Time',
    lastIgnitionCounterLabel: 'Ignition Status',
    activeBurningNow: 'actively firing 🔥',
    standbyDuration: 'standby (not firing) ❄️',
    noIgnitionYet: 'No ignition yet',

    // Weather Screen
    weatherTitle: 'Live Weather & 5-Day Forecast',
    savedLocations: 'Saved Locations (Device Management)',
    addLocation: 'Add New Location',
    locationName: 'Location Name (e.g. Summer House)',
    cityName: 'City',
    saveLocation: 'Save Location',
    cancel: 'Cancel',
    forecast5Days: '5-Day Weather Forecast',
    rainChance: 'Rain Chance',
    humidityLabel: 'Humidity',
    windLabel: 'Wind',
    notificationsOn: 'Notifications On',
    notificationsOff: 'Notifications Off',
    hourlyDetails: 'Hourly Details',
    precautionTitle: 'Weather Advisory & Heating Recommendation',

    // Report Screen
    repTabHeatmap: 'Temperature Heatmap',
    repTabGasBill: 'Consumption & Bill',
    repTabBoiler: 'Boiler & Sensors',
    timeframeDaily: 'Daily',
    timeframeWeekly: 'Weekly',
    timeframeMonthly: 'Monthly',
    inspectedDate: 'Inspected Date:',
    todayLabel: 'Today',
    activeBurnTime: 'Active Burning',
    standbyTime: 'Standby',
    avgRoomTemp: 'Avg. Temp',
    totalGasUsed: 'Total Gas Used',
    hourlyDetailTitle: 'Details',
    powerKwLabel: 'Power (kW)',
    gasM3Label: 'Usage (m³)',
    close: 'Close',
    noDataTitle: 'No Recorded Data for This Date',
    noDataDesc: 'There are no burner runtime or temperature telemetry records for the selected date. Live usage will be logged here.',
    backToToday: 'Back to Today',

    // Gas Bill Section (Consumption & Bill)
    billEstimateTitle: 'Consumption & Bill',
    billEstimateSub: 'Real-time meter telemetry and unit rate calculation',
    unitPriceLabel: 'Gas m³ Unit Price',
    meterReading: 'Meter Consumption',
    estimatedCost: 'Estimated Bill',
    efficiencySavings: 'Modulation Savings',

    // Boiler & Sensors Section
    boilerRelayStatus: 'Boiler Relay Status',
    burnerFlamePower: 'Burner Flame Power',
    waterPressure: 'Water Pressure',
    circulationPump: 'Circulation Pump',
    safetyRelay: 'Safety Relay',
    ambientSensors: 'Ambient Sensors',
    pressureNormal: 'Normal Operation',
    relayActive: 'Engaged',
    relayStandby: 'Standby',

    // Notification Settings Section in Settings
    notifSectionTitle: 'Notification Settings & Automation',
    notifSectionSub: 'Automatic 3-hour status overview and critical boiler safety alerts',
    notif3hTitle: 'Automatic 3-Hour Periodic Status Notification',
    notif3hDesc: 'Automated status push every 3 hours including boiler modulation, local weather, and energy-saving heating advice.',
    notifCriticalTitle: 'Emergency & Critical Safety Alerts',
    notifCriticalDesc: 'Immediate visual and audible alerts when water pressure drops (<1.0 Bar), burner flames fail, or freeze risk (<5°C) is detected.',
    notifTestBtn: 'Send Test Notification',
    notifViewPrecautions: 'View Precautions',
    notifActive: 'Active',
    notifInactive: 'Disabled',

    // Program Screen
    progTabSchedule: 'Smart Scheduling',
    progTabConsumption: 'Daily Consumption & Savings',
    encryptedGcm: 'AES-GCM Encrypted',
    progNight: 'Night Sleep',
    progMorning: 'Morning Wakeup',
    progAway: 'Away from Home',
    progEvening: 'Evening Comfort',
    saveSchedule: 'Save Schedule',
    scheduleSaved: 'Saved!',
    dailyRuntime: 'Daily Runtime',
    estimatedSavings: 'Estimated Savings',
    modulationEfficiency: 'Modulation Efficiency',

    // Theme Modal
    themeModalTitle: 'Visual Effects & Theme Preferences',
    themeModalSub: 'Live atmospheric weather backdrop, liquid glass and performance choices',
    themeGlassTitle: 'Liquid Glass (Live Glass)',
    themeGlassDesc: 'Real-time weather animation backdrop, translucent glass panels and fluid edge reflections',
    themeDarkTitle: 'Dark Night Mode',
    themeDarkDesc: 'High-contrast, eye-friendly deep obsidian and slate dark UI',
    themeLightTitle: 'Bright Day Mode',
    themeLightDesc: 'Crystal-clear crisp whites and cool grays for outdoor readability',
    themeSystemTitle: 'Automatic System Mode',
    themeSystemDesc: 'Dynamic automatic switching based on time of day and sunset',
    perfSectionTitle: 'Device Performance Mode (FPS & Battery)',
    perfUltraOption: 'Maximum Performance / Ultra Quality',
    perfUltraDesc: 'For powerful phones: 60 FPS, full particle density and volumetric sky',
    perfEcoOption: 'Low Power / Eco Mode',
    perfEcoDesc: 'Power-saving mode, throttled particles and battery protection',
    weatherTestTitle: 'Weather Preview Test',

    // Settings Modal & Reset
    settingsModalTitle: 'Settings & System Preferences',
    settingsModalSub: 'Cloud sync, encrypted vault and data management',
    vaultCardTitle: 'Encrypted Vault & Notifications',
    vaultCardSub: 'PIN-protected vault lock and Telegram bot notifications',
    openVault: 'Open',
    firebaseUrlLabel: 'Firebase Database URL:',
    firebaseKeyLabel: 'Firebase Web API Key:',
    saveSettings: 'Save Settings',
    settingsSaved: 'Saved!',
    resetDataSectionTitle: 'Reset Historical & Telemetry Data',
    resetDataWarning: 'All historical usage logs, hourly temperature records, and billing telemetry in storage will be completely wiped for a clean test.',
    resetDataBtn: 'Reset Historical Data',
    resetDataConfirm: 'Are you sure you want to wipe all historical data?',
    resetDataSuccess: 'All historical data successfully cleared!',

    // Voice Assistant & Google Home
    voiceAssistantTitle: 'Voice Command Assistant',
    voiceAssistantSub: 'Turkish & English voice commands for temperature, modes and status',
    voiceAssistantListening: 'Listening...',
    voiceAssistantSpeakNow: 'Speak now or type command',
    voiceAssistantPlaceholder: 'e.g.: Set temperature to 23, Eco mode, Is boiler firing?',
    voiceAssistantBtnTooltip: 'Voice Command Assistant (Microphone)',
    voiceAssistantQuickPrompts: 'Quick Voice Commands:',
    googleHomeTitle: 'Google Home & Assistant',
    googleHomeSub: 'Voice control integration with Google Assistant via Firebase',
    googleHomeBadge: 'Works with Google',
    googleHomeDesc: 'Through your Firebase database, Google Assistant ("Hey Google, set temperature to 23") directly controls your boiler.',
    googleHomeTestBtn: 'Simulate Google Home Command',
    googleHomeGuideBtn: 'Integration Guide',
  },
};
