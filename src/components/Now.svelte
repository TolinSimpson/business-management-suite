<script lang="ts">
  import { state as appState, setTaskNote, toggleStep } from "../lib/state";
  import { nowView, dateKey, displayLabel } from "../lib/schedule";
  import { testAlert, requestPermission } from "../lib/notify";
  import { enableWakeLock, disableWakeLock, isWakeLockSupported } from "../lib/wakelock";
  import Checklist from "./Checklist.svelte";

  // Reactive clock — re-render every 20s so the active block + countdown stay live.
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 20_000);
    return () => clearInterval(id);
  });

  let view = $derived(nowView($appState, now));
  let dk = $derived(dateKey(now));

  // Focus mode: keep the screen awake + go full-screen so the hourly cue always lands.
  let focus = $state(false);
  async function toggleFocus() {
    focus = !focus;
    if (focus) {
      await requestPermission();
      await enableWakeLock();
      try { await document.documentElement.requestFullscreen(); } catch { /* gesture/unsupported */ }
    } else {
      await disableWakeLock();
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    }
  }
  // Release the lock if we leave the screen.
  $effect(() => () => { void disableWakeLock(); });

  // Flash the card when the active block changes (a glanceable cue in Focus mode).
  let flash = $state(false);
  let lastTime: string | undefined;
  $effect(() => {
    const t = view?.time;
    if (t && lastTime !== undefined && t !== lastTime) {
      flash = true;
      setTimeout(() => (flash = false), 2500);
    }
    lastTime = t;
  });

  function fmtClock(d: Date) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function fmtRemaining(min: number) {
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m left`;
    return `${min}m left`;
  }
</script>

<div class="now-head">
  <h1>Now</h1>
  <button class:primary={focus} onclick={toggleFocus}>
    {focus ? "◉ Focus on" : "○ Focus"}
  </button>
</div>

{#if view}
  <div class="card now-card" class:flash>
    <div class="now-time">{fmtClock(now)} · {now.toLocaleDateString([], { weekday: "long" })}</div>
    <div class="now-label">{displayLabel(view.label)}</div>
    <div class="now-theme">{view.theme}</div>
    {#if view.taskNote}<div class="now-task">{view.taskNote}</div>{/if}
    <div class="now-meta">
      {fmtRemaining(view.endsInMin)}
      {#if view.next}· next: {displayLabel(view.next.label)}{/if}
    </div>
  </div>

  {#if focus}
    <p class="muted" style="margin-top:-4px;font-size:.82rem">
      Screen staying awake{isWakeLockSupported() ? "" : " (not supported on this browser)"}. Keep the app open and charging.
    </p>
  {/if}

  <div class="card">
    <label for="task">Specific task / prompt for this block</label>
    <textarea
      id="task"
      placeholder="e.g. Ship the alarm plugin; prompt agent to draft the foreground service"
      value={view.taskNote}
      oninput={(e) => setTaskNote(dk, view!.time, e.currentTarget.value)}
    ></textarea>
  </div>

  <div class="card">
    <h3>Process</h3>
    <Checklist items={view.checklist} onToggle={(step) => toggleStep(dk, view!.time, step)} />
  </div>
{:else}
  <div class="card">
    <p class="muted">Nothing scheduled right now — you're before the day's first block.</p>
  </div>
{/if}

<div class="row-actions">
  <button onclick={() => requestPermission()}>Enable notifications</button>
  <button class="primary" onclick={() => testAlert($appState)}>Test alert</button>
</div>
