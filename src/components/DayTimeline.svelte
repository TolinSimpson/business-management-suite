<script lang="ts">
  import { state as appState, setTaskNote, toggleStep } from "../lib/state";
  import {
    templateFor,
    currentBlock,
    dateKey,
    dayKeyOf,
    normLabel,
    displayLabel,
  } from "../lib/schedule";
  import Checklist from "./Checklist.svelte";

  let offset = $state(0); // days from today
  let now = $state(new Date());

  let date = $derived.by(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  });
  let dk = $derived(dateKey(date));
  let blocks = $derived(templateFor($appState, date));
  let theme = $derived($appState.weeklyThemes[dayKeyOf(date)]);
  let cur = $derived(offset === 0 ? currentBlock(blocks, now) : null);

  let openTime = $state<string | null>(null);

  function instance(time: string) {
    return $appState.days[dk]?.blocks[time];
  }
  function steps(label: string, time: string) {
    const tmpl = $appState.blockProcesses[normLabel(label)] ?? [];
    const done = instance(time)?.checklist ?? {};
    return tmpl.map((step) => ({ step, done: !!done[step] }));
  }
  function doneCount(label: string, time: string) {
    const s = steps(label, time);
    return s.length ? `${s.filter((x) => x.done).length}/${s.length}` : "";
  }
  function label(d: Date) {
    return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  }
</script>

<h1>Day</h1>

<div class="seg">
  <button onclick={() => (offset -= 1)}>‹ Prev</button>
  <button class:active={offset === 0} onclick={() => (offset = 0)}>{label(date)}</button>
  <button onclick={() => (offset += 1)}>Next ›</button>
</div>
<p class="muted" style="margin-top:-6px">Theme: {theme}</p>

<div class="card">
  {#each blocks as b (b.time)}
    {@const inst = instance(b.time)}
    {@const isCur = cur?.block.time === b.time}
    <div class="row" class:current={isCur}>
      <div class="t">{b.time}</div>
      <div style="flex:1" onclick={() => (openTime = openTime === b.time ? null : b.time)} role="button" tabindex="0" onkeydown={(e)=> e.key==="Enter" && (openTime = openTime === b.time ? null : b.time)}>
        <div class="lab">
          {displayLabel(b.label)}
          {#if isCur}<span class="pill">now</span>{/if}
          {#if doneCount(b.label, b.time)}<span class="pill">{doneCount(b.label, b.time)}</span>{/if}
        </div>
        {#if inst?.taskNote}<div class="sub">{inst.taskNote}</div>{/if}
      </div>
    </div>

    {#if openTime === b.time}
      <div style="padding:8px 0 14px">
        <label for={"t-" + b.time}>Task / prompt</label>
        <textarea
          id={"t-" + b.time}
          value={inst?.taskNote ?? ""}
          oninput={(e) => setTaskNote(dk, b.time, e.currentTarget.value)}
        ></textarea>
        <div style="height:8px"></div>
        <Checklist items={steps(b.label, b.time)} onToggle={(step) => toggleStep(dk, b.time, step)} />
      </div>
    {/if}
  {/each}
</div>
