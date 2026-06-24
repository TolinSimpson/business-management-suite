// Screen Wake Lock helper. In "Focus mode" the PWA keeps the screen on showing
// the current block, so the in-tab hourly chime always fires and — because the
// screen never sleeps — Doze / battery-saver never kicks in. Best paired with a
// phone on a charger/stand during the workday.

let sentinel: WakeLockSentinel | null = null;
let want = false;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

async function acquire(): Promise<boolean> {
  if (!want || !isWakeLockSupported()) return false;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener?.("release", () => (sentinel = null));
    return true;
  } catch {
    return false;
  }
}

export async function enableWakeLock(): Promise<boolean> {
  want = true;
  return acquire();
}

export async function disableWakeLock(): Promise<void> {
  want = false;
  try {
    await sentinel?.release();
  } catch {
    /* already released */
  }
  sentinel = null;
}

// The OS drops the lock whenever the tab is hidden; re-acquire on return.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (want && document.visibilityState === "visible" && !sentinel) void acquire();
  });
}
