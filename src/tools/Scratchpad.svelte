<script module lang="ts">
  export const meta = {
    name: "Scratchpad",
    icon: "note",
    description: "Quick notes, saved on this device",
    order: 2,
  };
</script>

<script lang="ts">
  // Self-contained: persists its own note to localStorage, independent of app state.
  const KEY = "tool-scratchpad";
  let text = $state(localStorage.getItem(KEY) ?? "");
  $effect(() => {
    try { localStorage.setItem(KEY, text); } catch { /* ignore */ }
  });
  let chars = $derived(text.length);
</script>

<div class="card">
  <textarea
    style="min-height:260px"
    placeholder="Jot anything down…"
    bind:value={text}
  ></textarea>
  <p class="muted" style="margin:8px 0 0;font-size:.8rem">{chars} characters · saved automatically</p>
</div>
