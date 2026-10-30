package com.termobot.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.widget.RemoteViews;

public class ThermostatWidget extends AppWidgetProvider {

    public static final String ACTION_TEMP_UP = "com.termobot.app.ACTION_TEMP_UP";
    public static final String ACTION_TEMP_DOWN = "com.termobot.app.ACTION_TEMP_DOWN";

    private static double targetTemp = 22.5;
    private static double currentTemp = 21.8;
    private static boolean isKombiActive = true;
    private static int humidity = 48;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (ACTION_TEMP_UP.equals(action)) {
            targetTemp = Math.round((targetTemp + 0.5) * 10.0) / 10.0;
            refreshAllWidgets(context);
        } else if (ACTION_TEMP_DOWN.equals(action)) {
            targetTemp = Math.round((targetTemp - 0.5) * 10.0) / 10.0;
            refreshAllWidgets(context);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_thermostat);

        views.setTextViewText(R.id.tv_current_temp, String.format("%.1f°C", currentTemp));
        views.setTextViewText(R.id.tv_target_temp, String.format("Hedef: %.1f°C", targetTemp));
        views.setTextViewText(R.id.tv_humidity, "Nem: %" + humidity);

        if (isKombiActive) {
            views.setTextViewText(R.id.tv_status_badge, "🔥 Kombi Yanıyor");
            views.setTextColor(R.id.tv_status_badge, Color.parseColor("#FF9800"));
        } else {
            views.setTextViewText(R.id.tv_status_badge, "❄️ Beklemede");
            views.setTextColor(R.id.tv_status_badge, Color.parseColor("#4DD0E1"));
        }

        // Sıcaklık Artırma PendingIntent
        Intent upIntent = new Intent(context, ThermostatWidget.class);
        upIntent.setAction(ACTION_TEMP_UP);
        PendingIntent upPendingIntent = PendingIntent.getBroadcast(
                context, 101, upIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_temp_up, upPendingIntent);

        // Sıcaklık Azaltma PendingIntent
        Intent downIntent = new Intent(context, ThermostatWidget.class);
        downIntent.setAction(ACTION_TEMP_DOWN);
        PendingIntent downPendingIntent = PendingIntent.getBroadcast(
                context, 102, downIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_temp_down, downPendingIntent);

        // Widget'a tıklayınca ana TermoBot uygulamasını aç
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            PendingIntent appPendingIntent = PendingIntent.getActivity(
                    context, 100, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, ThermostatWidget.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
