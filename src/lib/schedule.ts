import type { AppState, Block, Holiday, PlanTarget, ScheduleTemplate } from "./types";

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

/** Format a 24h "HH:MM" as a 12-hour clock time, e.g. "09:00" -> "9:00 AM". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Local date -> "YYYY-MM-DD" (no UTC shift). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- Holidays --------------------------------------------------------------

/** The company holiday falling on `key` ("YYYY-MM-DD"), if any. */
export function findHoliday(holidays: Holiday[] | undefined, key: string): Holiday | undefined {
  return holidays?.find((h) => h.date === key);
}

// ---- Off-hours -------------------------------------------------------------

/**
 * True when `now` is outside work hours — a weekend, or before/after the active
 * focus window on a weekday. Drives whether the personal schedule takes over.
 */
export function isOffHours(now: Date, activeHours: { start: number; end: number }): boolean {
  const day = now.getDay(); // 0 Sun … 6 Sat
  if (day === 0 || day === 6) return true;
  const h = now.getHours();
  return h < activeHours.start || h >= activeHours.end;
}

// ---- Next-day planning -----------------------------------------------------

/** The date that the planning block on `d` is planning for (the next day). */
export function nextDay(d: Date): Date {
  const n = new Date(d);
  n.setDate(d.getDate() + 1);
  return n;
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
  detail: string;
  taskNote: string;
  /** composed "Label — Task" line for the notification / header */
  headline: string;
  endsInMin: number;
  next: Block | null;
  checklist: { step: string; done: boolean }[];
  /** true when this block has planning inputs (an end-of-day plan form) */
  isPlan: boolean;
  /** this block's planning inputs (empty unless isPlan) */
  planTargets: PlanTarget[];
}

/** Pretty-case a label for display, e.g. "deep work" -> "Deep work". */
export function displayLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Everything the Now screen needs for a given moment. */
export function nowView(template: ScheduleTemplate, state: AppState, now: Date): NowView | null {
  const cur = currentBlock(template.blocks, now);
  if (!cur) return null;

  const dk = dateKey(now);
  const inst = state.days[dk]?.blocks[cur.block.time];
  const taskNote = inst?.taskNote ?? "";

  const steps = cur.block.checklist ?? [];
  const checklist = steps.map((step) => ({
    step,
    done: !!inst?.checklist?.[step],
  }));
  const planTargets = cur.block.plan ?? [];

  const parts = [displayLabel(cur.block.label)];
  if (taskNote) parts.push(taskNote);

  return {
    time: cur.block.time,
    label: cur.block.label,
    detail: cur.block.detail ?? "",
    taskNote,
    headline: parts.join(" — "),
    endsInMin: cur.endsInMin,
    next: cur.next,
    checklist,
    isPlan: planTargets.length > 0,
    planTargets,
  };
}

/**
 * The list of block-start times (minutes since midnight) to chime at. Work
 * schedules are clamped to the focus window; the personal off-hours schedule
 * passes `respectActiveHours: false` so its (by definition off-hours) blocks
 * still alarm.
 */
export function alarmTimesFor(
  template: ScheduleTemplate,
  state: AppState,
  respectActiveHours = true
): number[] {
  const { start, end } = state.settings.activeHours;
  const times = template.blocks
    .map((b) => toMinutes(b.time))
    .filter((m) => !respectActiveHours || (m >= start * 60 && m <= end * 60))
    .sort((a, b) => a - b);
  return [...new Set(times)];
}
