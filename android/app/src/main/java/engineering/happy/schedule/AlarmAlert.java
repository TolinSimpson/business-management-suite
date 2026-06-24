package engineering.happy.schedule;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

/**
 * Builds and posts the hourly alert notification.
 *   - "persistent"/"standard": a high-importance notification whose channel
 *     plays the alarm sound + vibrates (works with the screen off, in Doze).
 *   - "fullscreen": a silent-channel notification with a full-screen intent
 *     that launches AlertActivity to take over the (locked) screen; that
 *     activity plays the looping sound.
 */
public class AlarmAlert {

    static final String CH_SOUND = "schedule_alerts";
    static final String CH_FULL = "schedule_fullscreen";
    static final int NOTIF_ID = 7001;

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);

        Uri alarm = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        NotificationChannel sound = new NotificationChannel(
                CH_SOUND, "Schedule alerts", NotificationManager.IMPORTANCE_HIGH);
        sound.setSound(alarm, attrs);
        sound.enableVibration(true);
        sound.setVibrationPattern(new long[]{0, 400, 200, 400});

        NotificationChannel full = new NotificationChannel(
                CH_FULL, "Schedule full-screen", NotificationManager.IMPORTANCE_HIGH);
        full.setSound(null, null); // AlertActivity owns the audio
        full.enableVibration(true);

        nm.createNotificationChannel(sound);
        nm.createNotificationChannel(full);
    }

    static void fire(Context ctx, String label, boolean fullscreen) {
        ensureChannels(ctx);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);

        PendingIntent open = PendingIntent.getActivity(
                ctx, 0, new Intent(ctx, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, fullscreen ? CH_FULL : CH_SOUND)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Next block")
                .setContentText("Time for: " + cap(label))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(open);

        if (fullscreen) {
            Intent ai = new Intent(ctx, AlertActivity.class)
                    .putExtra("label", label)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent fsi = PendingIntent.getActivity(
                    ctx, 1, ai, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            b.setFullScreenIntent(fsi, true);
        }

        nm.notify(NOTIF_ID, b.build());
    }

    private static String cap(String s) {
        return (s == null || s.isEmpty()) ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
