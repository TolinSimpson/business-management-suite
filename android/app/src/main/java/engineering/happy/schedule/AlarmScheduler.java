package engineering.happy.schedule;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Arms the single next hour-boundary alarm using AlarmManager.setAlarmClock,
 * which is exempt from Doze / battery-saver (it's treated like a user alarm).
 * The receiver re-arms the following one each time it fires, so the chain is
 * self-healing and survives the process being killed.
 */
public class AlarmScheduler {

    static final String ACTION_ALARM = "engineering.happy.schedule.ALARM";
    private static final int REQ_OP = 0;
    private static final int REQ_SHOW = 2;

    static void scheduleNext(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(ScheduleAlarmPlugin.PREFS, Context.MODE_PRIVATE);
        int[] mins;
        String[] labels;
        try {
            JSONArray arr = new JSONArray(p.getString("blocks", "[]"));
            mins = new int[arr.length()];
            labels = new String[arr.length()];
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                mins[i] = o.getInt("min");
                labels[i] = o.optString("label", "next block");
            }
        } catch (Exception e) {
            Log.w("AlarmScheduler", "bad blocks json", e);
            return;
        }
        if (mins.length == 0) return;

        Calendar now = Calendar.getInstance();
        int nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        // First block strictly after now; otherwise wrap to the first block tomorrow.
        int idx = -1;
        for (int i = 0; i < mins.length; i++) {
            if (mins[i] > nowMin) { idx = i; break; }
        }
        boolean tomorrow = idx == -1;
        if (tomorrow) idx = 0;

        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, mins[idx] / 60);
        t.set(Calendar.MINUTE, mins[idx] % 60);
        t.set(Calendar.SECOND, 0);
        t.set(Calendar.MILLISECOND, 0);
        if (tomorrow) t.add(Calendar.DAY_OF_YEAR, 1);

        Intent fire = new Intent(ctx, AlarmReceiver.class)
                .setAction(ACTION_ALARM)
                .putExtra("label", labels[idx]);
        PendingIntent op = PendingIntent.getBroadcast(
                ctx, REQ_OP, fire, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent show = PendingIntent.getActivity(
                ctx, REQ_SHOW, new Intent(ctx, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        long trigger = t.getTimeInMillis();
        try {
            boolean canExact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
            if (canExact) {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(trigger, show), op);
            } else {
                // No exact-alarm permission: still fires in Doze maintenance windows.
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, op);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, op);
        }
        Log.i("AlarmScheduler", "next alarm @ " + t.getTime() + " for " + labels[idx]);
    }
}
