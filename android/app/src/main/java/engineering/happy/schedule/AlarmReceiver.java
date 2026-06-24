package engineering.happy.schedule;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

/**
 * Fires at each hour boundary (and on BOOT_COMPLETED to re-arm after reboot).
 * Shows the alert, then schedules the following alarm.
 */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            AlarmScheduler.scheduleNext(ctx);
            return;
        }

        String label = intent.getStringExtra("label");
        if (label == null) label = "next block";

        SharedPreferences p = ctx.getSharedPreferences(ScheduleAlarmPlugin.PREFS, Context.MODE_PRIVATE);
        String style = p.getString("alertStyle", "fullscreen");
        boolean weekendMode = p.getBoolean("weekendMode", true);

        // On weekends with gentle mode on, downgrade the full-screen takeover to
        // a plain notification so rest days stay calm.
        int dow = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
        boolean weekend = dow == Calendar.SATURDAY || dow == Calendar.SUNDAY;
        boolean fullscreen = "fullscreen".equals(style) && !(weekend && weekendMode);

        AlarmAlert.fire(ctx, label, fullscreen);
        AlarmScheduler.scheduleNext(ctx); // re-arm the chain
    }
}
