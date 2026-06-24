package engineering.happy.schedule;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

/**
 * Full-screen takeover shown on a schedule change. Wakes and unlocks the screen
 * (alarm-clock style) and loops the alarm sound until dismissed or it times out.
 */
public class AlertActivity extends Activity {

    private MediaPlayer player;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over the lock screen and turn the screen on.
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        setContentView(R.layout.activity_alert);

        String label = getIntent().getStringExtra("label");
        if (label == null) label = "Next block";
        ((TextView) findViewById(R.id.alert_label)).setText(cap(label));

        Button dismiss = findViewById(R.id.alert_dismiss);
        dismiss.setOnClickListener(v -> finish());

        startSound();

        // Auto-dismiss after 90 seconds so it never gets stuck on.
        handler.postDelayed(this::finish, 90_000);
    }

    private void startSound() {
        try {
            Uri alarm = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            player.setDataSource(this, alarm);
            player.setLooping(true);
            player.prepare();
            player.start();
        } catch (Exception ignored) {
            // sound is best-effort; the visual takeover still happens
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            player.release();
            player = null;
        }
        super.onDestroy();
    }

    private static String cap(String s) {
        return (s == null || s.isEmpty()) ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
