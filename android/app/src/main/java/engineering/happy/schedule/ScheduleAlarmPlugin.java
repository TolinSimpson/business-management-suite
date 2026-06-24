package engineering.happy.schedule;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridge between the web UI and the native alarm subsystem.
 *
 * sync(): persist today's hour-boundary blocks + alert settings, then arm the
 *         next exact alarm. Called whenever the app opens or settings change.
 * testAlert(): fire an alert immediately so the user can preview it.
 */
@CapacitorPlugin(name = "ScheduleAlarm")
public class ScheduleAlarmPlugin extends Plugin {

    static final String PREFS = "schedule_alarm";

    @PluginMethod
    public void sync(PluginCall call) {
        JSArray blocks = call.getArray("blocks");
        String alertStyle = call.getString("alertStyle", "fullscreen");
        String sound = call.getString("sound", "chime");
        boolean weekendMode = Boolean.TRUE.equals(call.getBoolean("weekendMode", true));

        Context ctx = getContext();
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit()
                .putString("blocks", blocks != null ? blocks.toString() : "[]")
                .putString("alertStyle", alertStyle)
                .putString("sound", sound)
                .putBoolean("weekendMode", weekendMode)
                .apply();

        AlarmScheduler.scheduleNext(ctx);
        call.resolve();
    }

    @PluginMethod
    public void testAlert(PluginCall call) {
        AlarmAlert.fire(getContext(), "Test alert", true);
        call.resolve();
    }
}
