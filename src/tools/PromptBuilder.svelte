<script module lang="ts">
  export const meta = {
    name: "Prompt Builder",
    icon: "sparkles",
    description: "Build platform-tuned AI prompts",
    order: 3,
  };
</script>

<script lang="ts">
  // Hosts the prompt-builder site (TolinSimpson/prompt-builder), vendored and
  // dark-themed under ./prompt-builder/ next to this tool. The 7 pages are shown
  // in an iframe via `srcdoc` and loaded lazily — each is its own async chunk, so
  // nothing weighs on the app's initial load and the big coding page is only
  // fetched when opened. The pages can't navigate between themselves on their
  // own, so the injected bridge routes clicks on internal *.html links up here
  // and we swap the srcdoc. Regenerate the pages with build-prompt-builder.cjs.
  const loaders = import.meta.glob("./prompt-builder/*.html", {
    query: "?raw",
    import: "default",
  }) as Record<string, () => Promise<string>>;

  // Key the loaders by bare filename ("index.html", "coding-prompts.html", …).
  const pageLoaders: Record<string, () => Promise<string>> = {};
  for (const [path, loader] of Object.entries(loaders)) {
    pageLoaders[path.split("/").pop()!] = loader;
  }

  let current = $state("index.html");
  let html = $state("");
  let height = $state(640);

  // Load (and swap to) whichever page is current; ignore a stale resolve if the
  // user navigated again before it finished.
  $effect(() => {
    const name = current;
    const load = pageLoaders[name] ?? pageLoaders["index.html"];
    let cancelled = false;
    load().then((raw) => {
      if (!cancelled) html = raw;
    });
    return () => {
      cancelled = true;
    };
  });

  function onMessage(e: MessageEvent) {
    const d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.__promptBuilder && typeof d.height === "number") {
      // +2 avoids a 1px scrollbar from sub-pixel rounding.
      height = Math.max(200, Math.ceil(d.height) + 2);
    } else if (d.__promptBuilderNav && pageLoaders[d.__promptBuilderNav]) {
      current = d.__promptBuilderNav;
      height = 640; // provisional until the new page reports its height
    }
  }
</script>

<svelte:window on:message={onMessage} />

{#if current !== "index.html"}
  <!-- Reliable return path to the hub: some builder pages (e.g. coding) have no
       in-page back link of their own. -->
  <button class="pb-builders-back" onclick={() => (current = "index.html")}>
    ‹ Builders
  </button>
{/if}

<iframe
  title="Prompt Builder"
  srcdoc={html}
  allow="clipboard-write"
  style="width:100%;border:none;display:block;height:{height}px"
></iframe>

<style>
  .pb-builders-back {
    background: none;
    border: none;
    padding: 0 0 8px;
    color: var(--accent);
    font-weight: 600;
  }
</style>
