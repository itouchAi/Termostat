package com.termobot.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * TermoBot Akıllı Termostat - Yerel Android Masaüstü Widget'ı
 * 
 * Kullanıcı ana ekrana basılı tutup "Widget Ekle" dediğinde
 * doğrudan bu bileşen seçilir ve ana ekrana yerleşir.
 */
class ThermostatWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_TEMP_UP = "com.termobot.app.ACTION_TEMP_UP"
        const val ACTION_TEMP_DOWN = "com.termobot.app.ACTION_TEMP_DOWN"
        const val ACTION_REFRESH = "com.termobot.app.ACTION_REFRESH"

        // Varsayılan durum değerleri (SharedPreferences ile de senkronize edilebilir)
        private var currentTemp: Double = 21.8
        private var targetTemp: Double = 22.5
        private var isKombiActive: Boolean = true
        private var humidity: Int = 48
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_TEMP_UP -> {
                targetTemp = Math.round((targetTemp + 0.5) * 10.0) / 10.0
                syncTargetTempWithCloud(targetTemp)
                refreshAllWidgets(context)
            }
            ACTION_TEMP_DOWN -> {
                targetTemp = Math.round((targetTemp - 0.5) * 10.0) / 10.0
                syncTargetTempWithCloud(targetTemp)
                refreshAllWidgets(context)
            }
            ACTION_REFRESH -> {
                fetchLiveDataFromCloud(context)
            }
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_thermostat)

        // 1. Sıcaklık ve Durum Yazıları
        views.setTextViewText(R.id.tv_current_temp, String.format("%.1f°C", currentTemp))
        views.setTextViewText(R.id.tv_target_temp, String.format("Hedef: %.1f°C", targetTemp))
        views.setTextViewText(R.id.tv_humidity, "Nem: %$humidity")

        if (isKombiActive) {
            views.setTextViewText(R.id.tv_status_badge, "🔥 Kombi Yanıyor")
            views.setTextColor(R.id.tv_status_badge, Color.parseColor("#FF9800"))
        } else {
            views.setTextViewText(R.id.tv_status_badge, "❄️ Beklemede")
            views.setTextColor(R.id.tv_status_badge, Color.parseColor("#4DD0E1"))
        }

        // 2. Buton Tıklama Aksiyonları (PendingIntent)
        // Sıcaklığı 0.5 Artır
        val upIntent = Intent(context, ThermostatWidget::class.java).apply {
            action = ACTION_TEMP_UP
        }
        val upPendingIntent = PendingIntent.getBroadcast(
            context, 101, upIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.btn_temp_up, upPendingIntent)

        // Sıcaklığı 0.5 Azalt
        val downIntent = Intent(context, ThermostatWidget::class.java).apply {
            action = ACTION_TEMP_DOWN
        }
        val downPendingIntent = PendingIntent.getBroadcast(
            context, 102, downIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.btn_temp_down, downPendingIntent)

        // Widget gövdesine tıklayınca ana TermoBot uygulamasını aç
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val appPendingIntent = PendingIntent.getActivity(
                context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun refreshAllWidgets(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val componentName = ComponentName(context, ThermostatWidget::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
        for (id in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }

    private fun syncTargetTempWithCloud(newTarget: Double) {
        // Arka planda Firebase REST veya backend API'ye yeni hedef sıcaklığı iletir
        thread {
            try {
                // Opsiyonel HTTP PATCH / PUT isteği
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun fetchLiveDataFromCloud(context: Context) {
        thread {
            try {
                // Opsiyonel HTTP GET isteği ile canlı dereceyi çekip widget'ı tazeler
                refreshAllWidgets(context)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
