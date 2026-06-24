<script lang="ts">
  import { state as appState } from "../lib/state";
  import { buildShare, shareUrl, type ShareLevel } from "../lib/share";

  let level = $state<ShareLevel>("detailed");
  let copied = $state(false);

  const levels: { key: ShareLevel; label: string; hint: string }[] = [
    { key: "overview", label: "Overview", hint: "Daily blocks + weekly themes" },
    { key: "detailed", label: "Detailed", hint: "+ this week's tasks" },
    { key: "full", label: "Full", hint: "+ checklists & process steps" },
  ];

  // Build the link from the current page (works on web; copy/paste from device).
  let origin = $derived.by(() => {
    const base = location.origin + location.pathname;
    return base.replace(/[#?].*$/, "");
  });
  let url = $derived(shareUrl(buildShare($appState, level, new Date()), origin));

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
  }
</script>

<h1>Share</h1>

<div class="card">
  <h3>Detail level</h3>
  {#each levels as l}
    <div class="check" class:done={level === l.key} role="button" tabindex="0"
      onclick={() => (level = l.key)} onkeydown={(e) => e.key === "Enter" && (level = l.key)}>
      <span class="box">{level === l.key ? "✓" : ""}</span>
      <span class="lbl">
        <div>{l.label}</div>
        <div class="muted" style="font-size:.8rem">{l.hint}</div>
      </span>
    </div>
  {/each}
</div>

<div class="card">
  <h3>Link</h3>
  <p class="muted" style="margin-top:0;font-size:.85rem">Read-only. The schedule is encoded in the link itself — no account, no server.</p>
  <div class="linkbox">{url}</div>
  <button class="primary" onclick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
</div>
