import type { AppState } from "./types";
import { nowView, templateFor, toMinutes } from "./schedule";

// Notification bridge.
//   - Web: best-effort in-session alerts (Notification API + Web Audio chime)
//     that fire on the hour while the app/tab is open.
//   - Native (Capacitor): hands the day's alarm schedule to the custom
//     ScheduleAlarm plugin, which runs a foreground service + setAlarmClock so
//     alerts fire on time even under Doze / battery-saver. See
//     android/.../ScheduleAlarmPlugin.kt.

interface ScheduleAlarmPlugin {
  sync(opts: {
    // today's hour boundaries within active hours, with labels for the alert text
    blocks: { min: number; label: string }[];
    activeHours: { start: number; end: number };
    alertStyle: string;
    sound: string;
    weekendMode: boolean;
  }): Promise<void>;
  testAlert(): Promise<void>;
}

function nativePlugin(): ScheduleAlarmPlugin | null {
  const cap = (globalThis as any).Capacitor;
  if (cap?.isNativePlatform?.() && cap.Plugins?.ScheduleAlarm) {
    return cap.Plugins.ScheduleAlarm as ScheduleAlarmPlugin;
  }
  return null;
}

export function isNative(): boolean {
  return !!nativePlugin();
}

// ---- Web audio chime -------------------------------------------------------

let audioCtx: AudioContext | null = null;

export function playChime(): void {
  try {
    audioCtx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    // Two-tone rising chime.
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* audio unavailable */
  }
}

// ---- Permissions -----------------------------------------------------------

export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

// ---- Web in-session scheduler ----------------------------------------------

let webTimer: ReturnType<typeof setTimeout> | null = null;

/** Milliseconds until the next exact hour boundary (xx:00:00). */
function msToNextHour(now: Date): number {
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function fireWebAlert(getState: () => AppState): void {
  const s = getState();
  const view = nowView(s, new Date());
  if (!view) return;
  const { start, end } = s.settings.activeHours;
  const hr = new Date().getHours();
  if (hr < start || hr > end) return; // outside active hours
  playChime();
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Next block", { body: view.headline, tag: "schedule-tick" });
  }
}

/**
 * Start the web fallback scheduler. Fires on each hour boundary while open.
 * Returns a stop function. Native platforms use the plugin instead.
 */
export function startWebScheduler(getState: () => AppState): () => void {
  if (isNative()) return () => {};
  stopWebScheduler();
  const tick = () => {
    fireWebAlert(getState);
    webTimer = setTimeout(tick, msToNextHour(new Date()));
  };
  webTimer = setTimeout(tick, msToNextHour(new Date()));
  return stopWebScheduler;
}

export function stopWebScheduler(): void {
  if (webTimer) clearTimeout(webTimer);
  webTimer = null;
}

// ---- Native sync -----------------------------------------------------------

/** Push today's alarm schedule + settings to the native plugin (no-op on web). */
export async function syncNative(state: AppState): Promise<void> {
  const plugin = nativePlugin();
  if (!plugin) return;
  const { start, end } = state.settings.activeHours;
  const blocks = templateFor(state, new Date())
    .map((b) => ({ min: toMinutes(b.time), label: b.label }))
    .filter((b) => b.min >= start * 60 && b.min <= end * 60)
    .sort((a, b) => a.min - b.min);
  await plugin.sync({
    blocks,
    activeHours: state.settings.activeHours,
    alertStyle: state.settings.alertStyle,
    sound: state.settings.sound,
    weekendMode: state.settings.weekendMode,
  });
}

export async function testAlert(state: AppState): Promise<void> {
  const plugin = nativePlugin();
  if (plugin) {
    await plugin.testAlert();
    return;
  }
  await requestPermission();
  fireWebAlert(() => state);
}
