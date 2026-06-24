import type { DayKey, MonthWeek } from "./types";

// Monthly plans are keyed by calendar month so they don't bleed across months.

/** Mon-first day order for the monthly grid. */
export const MONTH_DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

export function emptyDays(): Record<DayKey, string> {
  return { sun: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "" };
}

/** A blank 4-week plan, used when a month has no plan yet. */
export function emptyMonth(): MonthWeek[] {
  return Array.from({ length: 4 }, () => ({ days: emptyDays() }));
}
