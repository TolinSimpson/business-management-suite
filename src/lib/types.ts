// Core data model for the schedule app. Kept intentionally small: the entire
// app state is one JSON-serialisable object persisted to localStorage.

/** A single hour block in a day template, e.g. { time: "10:00", label: "deep work" }. */
export interface Block {
  /** 24h "HH:MM" start time. Blocks run until the next block's time. */
  time: string;
  label: string;
}

/** Day-of-week keys used for weekly themes. 0 = Sunday … 6 = Saturday. */
export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

/** Which standing template a given weekday uses. */
export type TemplateKey = "weekday" | "saturday" | "sunday";

export type AlertStyle = "fullscreen" | "persistent" | "standard";

/** Per-date instance data: the task layer laid over the standing templates. */
export interface DayData {
  /** keyed by block "HH:MM" */
  blocks: Record<string, BlockInstance>;
}

export interface BlockInstance {
  taskNote?: string;
  /** checklist step -> done */
  checklist?: Record<string, boolean>;
}

/** One week of a month's focus plan: a free-text task per day. */
export interface MonthWeek {
  days: Record<DayKey, string>;
}

export interface Settings {
  activeHours: { start: number; end: number }; // hours 0-23, inclusive start, exclusive end
  alertStyle: AlertStyle;
  sound: string;
  weekendMode: boolean; // gentle alerts on weekends
}

export interface AppState {
  scheduleTemplates: Record<TemplateKey, Block[]>;
  weeklyThemes: Record<DayKey, string>;
  /** checklist templates keyed by normalised block label */
  blockProcesses: Record<string, string[]>;
  days: Record<string, DayData>; // keyed "YYYY-MM-DD"
  /** month-specific focus plans, keyed "YYYY-MM" -> 4 weeks of day slots */
  monthlyPlans: Record<string, MonthWeek[]>;
  settings: Settings;
}

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
