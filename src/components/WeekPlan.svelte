<script lang="ts">
  import { state as appState, setTaskNote, setMonthlyTask } from "../lib/state";
  import { templateFor, dateKey, dayKeyOf, normLabel, displayLabel } from "../lib/schedule";
  import { weekDates } from "../lib/share";
  import { monthKey, monthLabel, emptyMonth, MONTH_DAY_ORDER } from "../lib/month";
  import type { Block } from "../lib/types";

  let weekOffset = $state(0);
  let monthOffset = $state(0);
  let openWeek = $state<number | null>(null);
  let now = $state(new Date());

  // Monthly focus is keyed by calendar month, so each month has its own plan.
  let monthDate = $derived.by(() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + monthOffset, 1);
    return d;
  });
  let mk = $derived(monthKey(monthDate));
  let weeks = $derived($appState.monthlyPlans[mk] ?? emptyMonth());

  let anchor = $derived.by(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  });
  let dates = $derived(weekDates(anchor).map((dk) => new Date(dk + "T12:00:00")));

  // The day's "objective" lives on its primary deep-work block so it also shows
  // up on the Now / Day screens — one source of truth, no parallel field.
  function primaryTime(blocks: Block[]): string {
    const deep = blocks.find((b) => normLabel(b.label).includes("deep work"));
    return (deep ?? blocks.find((b) => b.time === "10:00") ?? blocks[0])?.time ?? "10:00";
  }
  function objectiveOf(d: Date) {
    const t = primaryTime(templateFor($appState, d));
    return { time: t, note: $appState.days[dateKey(d)]?.blocks[t]?.taskNote ?? "" };
  }
  function rangeLabel(ds: Date[]) {
    const f = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${f(ds[0])} – ${f(ds[6])}`;
  }
</script>

<h1>Plan week</h1>

<div class="seg">
  <button onclick={() => (weekOffset -= 1)}>‹</button>
  <button class:active={weekOffset === 0} onclick={() => (weekOffset = 0)}>{rangeLabel(dates)}</button>
  <button onclick={() => (weekOffset += 1)}>›</button>
</div>

<div class="card">
  <p class="muted" style="margin-top:0">Set each day's objective against its theme. The standing schedule stays intact — you're only filling the task layer.</p>
  {#each dates as d (dateKey(d))}
    {@const dk = dayKeyOf(d)}
    {@const obj = objectiveOf(d)}
    <div style="padding:8px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong>{d.toLocaleDateString([], { weekday: "short" })} {d.getDate()}</strong>
        <span class="now-theme" style="font-size:.85rem">{$appState.weeklyThemes[dk]}</span>
      </div>
      <input
        type="text"
        style="margin-top:6px"
        placeholder="Objective…"
        value={obj.note}
        oninput={(e) => setTaskNote(dateKey(d), obj.time, e.currentTarget.value)}
      />
    </div>
  {/each}
</div>

<div class="card">
  <div class="seg">
    <button onclick={() => (monthOffset -= 1)}>‹</button>
    <button class:active={monthOffset === 0} onclick={() => (monthOffset = 0)}>{monthLabel(monthDate)}</button>
    <button onclick={() => (monthOffset += 1)}>›</button>
  </div>
  <h3>Monthly focus</h3>
  <p class="muted" style="margin-top:0;font-size:.85rem">Specific to {monthLabel(monthDate)}. Tap a week to edit.</p>

  {#each weeks as wk, i (i)}
    {@const filled = MONTH_DAY_ORDER.filter((d) => wk.days[d])}
    <div style="padding:8px 0;border-bottom:1px solid var(--line)">
      <div
        role="button"
        tabindex="0"
        onclick={() => (openWeek = openWeek === i ? null : i)}
        onkeydown={(e) => e.key === "Enter" && (openWeek = openWeek === i ? null : i)}
      >
        <div class="daychip">Week {i + 1}</div>
        {#if filled.length}
          <div class="sub">
            {#each filled as d}<div>{displayLabel(d)}: {wk.days[d]}</div>{/each}
          </div>
        {:else}
          <div class="sub">—</div>
        {/if}
      </div>

      {#if openWeek === i}
        <div class="grid7" style="margin-top:8px">
          {#each MONTH_DAY_ORDER as d}
            <span class="daychip">{d}</span>
            <input
              type="text"
              placeholder="—"
              value={wk.days[d]}
              oninput={(e) => setMonthlyTask(mk, i, d, e.currentTarget.value)}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
