<script lang="ts">
  import { state as appState } from "./lib/state";
  import { readShareFromHash } from "./lib/share";
  import { startWebScheduler, syncNative } from "./lib/notify";
  import Now from "./components/Now.svelte";
  import DayTimeline from "./components/DayTimeline.svelte";
  import WeekPlan from "./components/WeekPlan.svelte";
  import Share from "./components/Share.svelte";
  import Settings from "./components/Settings.svelte";
  import ShareView from "./components/ShareView.svelte";

  // A "#s=..." hash means we were opened via a share link → read-only viewer.
  let shared = $state(readShareFromHash(location.hash));
  $effect(() => {
    const onHash = () => (shared = readShareFromHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  });

  type Tab = "now" | "day" | "plan" | "share" | "settings";
  let tab = $state<Tab>("now");

  const tabs: { key: Tab; ico: string; label: string }[] = [
    { key: "now", ico: "◷", label: "Now" },
    { key: "day", ico: "▤", label: "Day" },
    { key: "plan", ico: "🗓", label: "Plan" },
    { key: "share", ico: "↗", label: "Share" },
    { key: "settings", ico: "⚙", label: "Settings" },
  ];

  // Start the web in-session scheduler and push the schedule to the native
  // alarm service once on load.
  $effect(() => {
    const stop = startWebScheduler(() => $appState);
    syncNative($appState);
    return stop;
  });
</script>

{#if shared}
  <ShareView payload={shared} />
{:else}
  <main>
    {#if tab === "now"}<Now />
    {:else if tab === "day"}<DayTimeline />
    {:else if tab === "plan"}<WeekPlan />
    {:else if tab === "share"}<Share />
    {:else}<Settings />{/if}
  </main>

  <nav class="tabs">
    {#each tabs as t}
      <button class:active={tab === t.key} onclick={() => (tab = t.key)}>
        <span class="ico">{t.ico}</span>
        {t.label}
      </button>
    {/each}
  </nav>
{/if}
