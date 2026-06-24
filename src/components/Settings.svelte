<script lang="ts">
  import { state as appState, update, resetState } from "../lib/state";
  import { syncNative, isNative } from "../lib/notify";
  import type { AlertStyle } from "../lib/types";

  // Push schedule to the native alarm service whenever settings change.
  $effect(() => {
    void $appState.settings; // track
    syncNative($appState);
  });

  const styles: { key: AlertStyle; label: string; hint: string }[] = [
    { key: "fullscreen", label: "Full screen", hint: "Take over the screen + audio (bypasses Doze)" },
    { key: "persistent", label: "Persistent", hint: "Ongoing notification + chime, no takeover" },
    { key: "standard", label: "Standard", hint: "Plain notification (may be delayed by battery saver)" },
  ];

  function setStyle(s: AlertStyle) {
    update((st) => (st.settings.alertStyle = s));
  }
  function setHours(which: "start" | "end", v: number) {
    update((st) => (st.settings.activeHours[which] = Math.max(0, Math.min(23, v))));
  }
</script>

<h1>Settings</h1>

<div class="card">
  <h3>Active hours</h3>
  <p class="muted" style="margin-top:0">Alerts fire on the hour between these times.</p>
  <div style="display:flex;gap:12px">
    <div style="flex:1">
      <label for="h-start">Start</label>
      <input id="h-start" type="number" min="0" max="23" value={$appState.settings.activeHours.start}
        oninput={(e) => setHours("start", +e.currentTarget.value)} />
    </div>
    <div style="flex:1">
      <label for="h-end">End</label>
      <input id="h-end" type="number" min="0" max="23" value={$appState.settings.activeHours.end}
        oninput={(e) => setHours("end", +e.currentTarget.value)} />
    </div>
  </div>
</div>

<div class="card">
  <h3>Alert style</h3>
  {#each styles as s}
    <div class="check" class:done={$appState.settings.alertStyle === s.key} role="button" tabindex="0"
      onclick={() => setStyle(s.key)} onkeydown={(e) => e.key === "Enter" && setStyle(s.key)}>
      <span class="box">{$appState.settings.alertStyle === s.key ? "✓" : ""}</span>
      <span class="lbl">
        <div>{s.label}</div>
        <div class="muted" style="font-size:.8rem">{s.hint}</div>
      </span>
    </div>
  {/each}
  {#if !isNative()}
    <p class="muted" style="font-size:.8rem;margin-bottom:0">On web, alerts only fire while the app is open. Install the Android app for always-on reliability.</p>
  {/if}
</div>

<div class="card">
  <h3>Sound</h3>
  <select value={$appState.settings.sound} onchange={(e) => update((st) => (st.settings.sound = e.currentTarget.value))}>
    <option value="chime">Chime</option>
    <option value="bell">Bell</option>
    <option value="alarm">Alarm</option>
  </select>
  <div style="height:12px"></div>
  <label class="check" style="border:none" for="weekend">
    <input id="weekend" type="checkbox" checked={$appState.settings.weekendMode}
      onchange={(e) => update((st) => (st.settings.weekendMode = e.currentTarget.checked))} />
    <span class="lbl">Gentle weekend alerts</span>
  </label>
</div>

<div class="card">
  <h3>Reset</h3>
  <p class="muted" style="margin-top:0">Restore the seeded schedule and clear all tasks.</p>
  <button onclick={() => confirm("Reset all data to defaults?") && resetState()}>Reset to defaults</button>
</div>
