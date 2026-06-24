<script lang="ts">
  import type { SharePayload } from "../lib/share";
  import { weekDates } from "../lib/share";
  import { templateKeyOf, dayKeyOf, normLabel, displayLabel, dateKey } from "../lib/schedule";
  import type { DayKey } from "../lib/types";

  let { payload }: { payload: SharePayload } = $props();

  const themeOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  let dates = $derived(
    payload.level === "overview" ? [] : weekDates(new Date(payload.anchor + "T12:00:00")).map((dk) => new Date(dk + "T12:00:00"))
  );

  function blocksFor(d: Date) {
    return payload.templates[templateKeyOf(d)];
  }
  function dk(d: Date) {
    return dateKey(d);
  }
  function checklist(label: string, time: string, d: Date) {
    if (payload.level !== "full" || !payload.processes) return [];
    const steps = payload.processes[normLabel(label)] ?? [];
    const done = payload.days?.[dk(d)]?.blocks[time]?.checklist ?? {};
    return steps.map((step) => ({ step, done: !!done[step] }));
  }
  function taskOf(time: string, d: Date) {
    return payload.days?.[dk(d)]?.blocks[time]?.taskNote ?? "";
  }
</script>

<main>
  <h1>Shared schedule</h1>
  <span class="pill">{payload.level}</span>

  <div class="card" style="margin-top:12px">
    <h3>Weekly themes</h3>
    {#each themeOrder as k}
      <div class="grid7" style="padding:4px 0">
        <span class="daychip">{k}</span>
        <span>{payload.themes[k]}</span>
      </div>
    {/each}
  </div>

  {#if payload.level === "overview"}
    {#each Object.entries(payload.templates) as [name, blocks]}
      <div class="card">
        <h3 style="text-transform:capitalize">{name}</h3>
        {#each blocks as b}
          <div class="row"><div class="t">{b.time}</div><div class="lab">{displayLabel(b.label)}</div></div>
        {/each}
      </div>
    {/each}
  {:else}
    {#each dates as d (dk(d))}
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h3>{d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</h3>
          <span class="now-theme" style="font-size:.85rem">{payload.themes[dayKeyOf(d)]}</span>
        </div>
        {#each blocksFor(d) as b}
          {@const task = taskOf(b.time, d)}
          {@const cl = checklist(b.label, b.time, d)}
          <div class="row">
            <div class="t">{b.time}</div>
            <div style="flex:1">
              <div class="lab">{displayLabel(b.label)}</div>
              {#if task}<div class="sub">{task}</div>{/if}
              {#each cl as c}
                <div class="sub">{c.done ? "☑" : "☐"} {c.step}</div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  {/if}
</main>
