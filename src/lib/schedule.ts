import type { AppState, Block, DayKey, TemplateKey } from "./types";
import { DAY_KEYS } from "./types";

// Pure scheduling logic — no DOM, no storage — so it is trivially unit-testable.

/** Normalise a block label into a stable key for checklist lookup. */
export function normLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

/** "HH:MM" -> minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Local date -> "YYYY-MM-DD" (no UTC shift). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayKeyOf(d: Date): DayKey {
  return DAY_KEYS[d.getDay()];
}

/** Which standing template applies to a given date. */
export function templateKeyOf(d: Date): TemplateKey {
  const day = d.getDay();
  if (day === 6) return "saturday";
  if (day === 0) return "sunday";
  return "weekday";
}

export function templateFor(state: AppState, d: Date): Block[] {
  return state.scheduleTemplates[templateKeyOf(d)];
}

export interface CurrentBlock {
  block: Block;
  index: number;
  /** minutes from now until this block ends (next block starts) */
  endsInMin: number;
  /** the next block, if any later today */
  next: Block | null;
}

/**
 * Resolve the block active at `now`. Blocks are sorted by time; the active
 * block is the last one whose start time is <= now. Returns null before the
 * first block of the day. The final block runs until midnight.
 */
export function currentBlock(blocks: Block[], now: Date): CurrentBlock | null {
  if (blocks.length === 0) return null;
  const sorted = [...blocks].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let idx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (toMinutes(sorted[i].time) <= nowMin) idx = i;
    else break;
  }
  if (idx === -1) return null; // before the day's first block

  const next = idx + 1 < sorted.length ? sorted[idx + 1] : null;
  const endMin = next ? toMinutes(next.time) : 24 * 60;
  return { block: sorted[idx], index: idx, endsInMin: endMin - nowMin, next };
}

export interface NowView {
  /** the active block's start time, "HH:MM" — used to address its instance data */
  time: string;
  label: string;
  theme: string;
  taskNote: string;
  /** composed "Label — Theme — Task" line for the notification / header */
  headline: string;
  endsInMin: number;
  next: Block | null;
  checklist: { step: string; done: boolean }[];
}

/** Pretty-case a label for display, e.g. "deep work" -> "Deep work". */
export function displayLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Everything the Now screen needs for a given moment. */
export function nowView(state: AppState, now: Date): NowView | null {
  const cur = currentBlock(templateFor(state, now), now);
  if (!cur) return null;

  const theme = state.weeklyThemes[dayKeyOf(now)];
  const dk = dateKey(now);
  const inst = state.days[dk]?.blocks[cur.block.time];
  const taskNote = inst?.taskNote ?? "";

  const steps = state.blockProcesses[normLabel(cur.block.label)] ?? [];
  const checklist = steps.map((step) => ({
    step,
    done: !!inst?.checklist?.[step],
  }));

  const parts = [displayLabel(cur.block.label), theme];
  if (taskNote) parts.push(taskNote);

  return {
    time: cur.block.time,
    label: cur.block.label,
    theme,
    taskNote,
    headline: parts.join(" — "),
    endsInMin: cur.endsInMin,
    next: cur.next,
    checklist,
  };
}

/** The list of hour-boundary times (minutes since midnight) within active hours. */
export function alarmTimesFor(state: AppState, d: Date): number[] {
  const { start, end } = state.settings.activeHours;
  const times = templateFor(state, d)
    .map((b) => toMinutes(b.time))
    .filter((m) => m >= start * 60 && m <= end * 60)
    .sort((a, b) => a - b);
  return [...new Set(times)];
}
