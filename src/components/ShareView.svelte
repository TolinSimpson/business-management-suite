<script lang="ts">
  import type { SharePayload } from "../lib/share";
  import type { Block } from "../lib/types";
  import { displayLabel, formatTime } from "../lib/schedule";

  let { payload }: { payload: SharePayload } = $props();

  let day = $derived(new Date(payload.date + "T12:00:00"));

  function taskOf(time: string) {
    return payload.blocks?.[time]?.taskNote ?? "";
  }
  // Checklist steps are carried inline on each block (full level only).
  function checklist(b: Block) {
    const steps = b.checklist ?? [];
    const done = payload.blocks?.[b.time]?.checklist ?? {};
    return steps.map((step) => ({ step, done: !!done[step] }));
  }
</script>

<main>
  <h1>Daily schedule</h1>
  <p class="muted" style="margin-top:-6px">
    {day.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
  </p>

  <div class="card">
    {#each payload.schedule as b (b.time)}
      {@const task = taskOf(b.time)}
      {@const cl = checklist(b)}
      <div class="row">
        <div class="t">{formatTime(b.time)}</div>
        <div style="flex:1">
          <div class="lab">{displayLabel(b.label)}</div>
          {#if b.detail}<div class="sub">{b.detail}</div>{/if}
          {#if task}<div class="sub" style="color:var(--text)">{task}</div>{/if}
          {#each cl as c}
            <div class="sub">{c.done ? "☑" : "☐"} {c.step}</div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</main>
