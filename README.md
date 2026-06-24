# Schedule

A clean, phone-first schedule app for a tight daily/weekly routine. It shows what
you should be doing **right now**, alerts you on the hour to move to the next
block, tracks a per-block process checklist, and shares a read-only view via a
link. One small web codebase (Svelte) runs as a PWA **and** wraps into a native
Android app (Capacitor) for alerts that survive battery-saver / Doze.

## Stack

- **Svelte 5 + Vite + TypeScript** — tiny bundle (~25 KB gzipped), no runtime bloat.
- **Capacitor** — wraps the same `dist/` into a native Android app.
- **lz-string** — compresses a schedule snapshot into a share URL (no backend).
- Local-first: the whole app state is one JSON object in `localStorage`.

## Layout

```
src/
  lib/
    types.ts       AppState model
    defaults.ts    the seeded routine (weekday / Saturday / Sunday, themes, checklists)
    schedule.ts    pure now-computation (active block, theme overlay, alarm times)
    state.ts       localStorage-backed store + mutators
    share.ts       encode/decode snapshot + detail-level filtering
    notify.ts      web in-session alerts + native plugin bridge
  components/       Now, DayTimeline, WeekPlan, Settings, Share, ShareView, Checklist
  App.svelte        tab shell + share-link route
tests/              vitest: schedule + share (20 tests)
android/            Capacitor Android project
  .../ScheduleAlarmPlugin.java  bridge: persist schedule + arm alarms
  .../AlarmScheduler.java       setAlarmClock at each hour boundary (Doze-exempt)
  .../AlarmReceiver.java        fires on the hour + BOOT_COMPLETED, re-arms the chain
  .../AlarmAlert.java           builds the alert notification (sound + full-screen)
  .../AlertActivity.java        full-screen takeover over the lock screen
```

## How the reliable hourly alert works

A web app can't fire alerts when closed, so the Android app uses
`AlarmManager.setAlarmClock()` — treated like a user alarm, so it fires on time
**even in battery-saver / Doze**. Each fire shows the alert and re-arms the next
hour, so the chain is self-healing and survives the process being killed (and a
reboot, via `BOOT_COMPLETED`).

Alert styles (Settings): **full screen** (wakes + unlocks the screen, loops the
alarm sound — the strongest), **persistent** (high-priority notification + sound),
**standard**. Weekends downgrade to gentle notifications when "gentle weekend
alerts" is on.

## Develop (web)

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run check      # svelte-check type check
npm run build      # -> dist/
```

## Install as a PWA (no app build, no server)

The web build is an installable PWA (service worker + manifest + icons via
`vite-plugin-pwa`). On your phone, open the app URL in Chrome → **Add to Home
screen**. It then launches standalone and works offline.

**Focus mode** (Now screen → **Focus**): keeps the screen awake (Screen Wake Lock
API) and goes full-screen showing the current block. Because the screen never
sleeps, the in-tab hourly chime always fires and Doze never kicks in — a no-build,
no-server way to get the "screen takeover + audio on schedule change" behaviour.
Best with the phone on a charger/stand during the workday.

The limitation a PWA can't escape: alerts only fire while the app is **open**. For
alerts that survive a **locked phone in your pocket** under battery-saver, use the
native Android build below.

## Build & run (Android)

Requires Android Studio (JDK 17 + Android SDK).

```bash
npm run build
npx cap sync android
npx cap open android   # then Run from Android Studio (or: npx cap run android)
```

First launch asks for the notification permission. For the full-screen takeover,
confirm the app is allowed "Alarms & reminders" and (Android 14+) full-screen
notifications in system settings.

### Verify the alert survives power-saving

1. In the app, set active hours and tap **Test alert** — confirm sound + screen wake.
2. Enable battery-saver, lock the screen, and wait for the next hour boundary.
3. Force Doze to prove it: `adb shell dumpsys deviceidle force-idle`, then
   `adb shell dumpsys alarm | grep schedule` to see the scheduled exact alarm fire.
4. Kill the app from recents and confirm the next alarm still fires (re-arm works).

## Share links

Settings → **Share** → pick a detail level (Overview / Detailed / Full). The
schedule is compressed into `#s=…` in the URL — open that link anywhere to see a
read-only view. No account, no server; the data lives in the link.
