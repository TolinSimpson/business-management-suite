import { writable, get } from "svelte/store";
import { requestPermission } from "./notify";
import { enableWakeLock, disableWakeLock } from "./wakelock";

// Focus mode: keep the screen awake + go full-screen so the hourly cue always
// lands. Lifted to a store so the toggle can live in the bottom toolbar while
// the Now screen still reflects its state.

export const focus = writable(false);

export async function toggleFocus(): Promise<void> {
  const on = !get(focus);
  focus.set(on);
  if (on) {
    await requestPermission();
    await enableWakeLock();
    try { await document.documentElement.requestFullscreen(); } catch { /* gesture/unsupported */ }
  } else {
    await disableWakeLock();
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
  }
}
