import { writable } from "svelte/store";
import type { AppState, BlockInstance, DayKey } from "./types";
import { defaultState } from "./defaults";
import { emptyMonth } from "./month";

const STORAGE_KEY = "schedule-app-state-v1";

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // Shallow-merge over defaults so new fields added in later versions
      // don't break an older saved state.
      return { ...defaultState(), ...JSON.parse(raw) } as AppState;
    }
  } catch {
    /* fall through to defaults */
  }
  return defaultState();
}

export const state = writable<AppState>(load());

state.subscribe((s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full / unavailable — ignore */
  }
});

/** Apply a mutation to the current state and persist it. */
export function update(fn: (s: AppState) => void): void {
  state.update((s) => {
    const next = structuredClone(s);
    fn(next);
    return next;
  });
}

/** Get or create the per-date, per-block instance record. */
function blockInstance(s: AppState, date: string, time: string): BlockInstance {
  const day = (s.days[date] ??= { blocks: {} });
  return (day.blocks[time] ??= {});
}

export function setTaskNote(date: string, time: string, note: string): void {
  update((s) => {
    const inst = blockInstance(s, date, time);
    if (note) inst.taskNote = note;
    else delete inst.taskNote;
  });
}

export function toggleStep(date: string, time: string, step: string): void {
  update((s) => {
    const inst = blockInstance(s, date, time);
    inst.checklist ??= {};
    inst.checklist[step] = !inst.checklist[step];
  });
}

/** Edit one day slot of a month's focus plan, creating the month lazily. */
export function setMonthlyTask(mk: string, week: number, day: DayKey, value: string): void {
  update((s) => {
    const weeks = (s.monthlyPlans[mk] ??= emptyMonth());
    weeks[week].days[day] = value;
  });
}

export function resetState(): void {
  state.set(defaultState());
}
