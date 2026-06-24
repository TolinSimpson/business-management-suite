import type { AppState, Block, MonthWeek } from "./types";
import { monthKey, emptyDays } from "./month";

// The user's actual routine, seeded so the app is usable on first launch.
// Everything here is editable in Settings.

const weekday: Block[] = [
  { time: "07:00", label: "workout" },
  { time: "08:00", label: "morning chores / planning" },
  { time: "09:00", label: "plan daily task" },
  { time: "10:00", label: "deep work" },
  { time: "11:00", label: "refine + polish" },
  { time: "12:00", label: "lunch meet + review" },
  { time: "13:00", label: "plan feedback implementation" },
  { time: "14:00", label: "implement feedback" },
  { time: "15:00", label: "refine + polish" },
  { time: "16:00", label: "test, document, commit" },
  { time: "17:00", label: "dinner" },
  { time: "18:00", label: "social time" },
  { time: "19:00", label: "afternoon chores" },
  { time: "20:00", label: "play time" },
  { time: "21:00", label: "quiet time" },
  { time: "22:00", label: "sleep" },
];

const saturday: Block[] = [
  { time: "07:00", label: "quiet time" },
  { time: "08:00", label: "review log, plan day" },
  { time: "09:00", label: "morning chores" },
  { time: "10:00", label: "deep work" },
  { time: "11:00", label: "log ideas" },
  { time: "12:00", label: "lunch break" },
  { time: "13:00", label: "experiment" },
  { time: "14:00", label: "refine / polish work" },
  { time: "15:00", label: "research" },
  { time: "16:00", label: "log progress & ideas, journal" },
  { time: "17:00", label: "dinner" },
  { time: "18:00", label: "social time" },
  { time: "19:00", label: "afternoon chores" },
  { time: "20:00", label: "play time" },
  { time: "21:00", label: "quiet time" },
  { time: "22:00", label: "sleep" },
];

// Sunday is intentionally restful (Personal Social). Gentle, light structure.
const sunday: Block[] = [
  { time: "07:00", label: "quiet time" },
  { time: "08:00", label: "breakfast" },
  { time: "09:00", label: "worship" },
  { time: "12:00", label: "lunch" },
  { time: "13:00", label: "rest" },
  { time: "15:00", label: "family / social" },
  { time: "17:00", label: "dinner" },
  { time: "18:00", label: "social time" },
  { time: "21:00", label: "quiet time" },
  { time: "22:00", label: "sleep" },
];

// Checklist templates keyed by normalised block label (see schedule.normLabel).
// Biased toward the LLM-agent loop: set objective -> prompt -> review -> confirm.
const blockProcesses: Record<string, string[]> = {
  "workout": ["Warmed up", "Workout done", "Stretched"],
  "morning chores / planning": ["Prayed", "Reviewed calendar", "Defined day goals", "Drafted plan"],
  "plan daily task": ["Prayed", "Defined goals", "Drafted plan", "Risk assessment"],
  "deep work": ["Prayed", "Objective set", "Prompted agent", "Output reviewed"],
  "refine + polish": ["Reviewed output", "Refined prompt", "Verified result"],
  "lunch meet + review": ["Ate", "Reviewed progress", "Captured feedback"],
  "plan feedback implementation": ["Triaged feedback", "Prioritised", "Drafted plan"],
  "implement feedback": ["Prompted agent", "Confirmed changes", "Verified"],
  "test, document, commit": ["Tests pass", "Documented", "Committed"],
  "review log, plan day": ["Prayed", "Reviewed log", "Planned day"],
  "experiment": ["Hypothesis set", "Ran experiment", "Logged result"],
  "research": ["Question set", "Sources gathered", "Notes captured"],
};

export function defaultState(): AppState {
  return {
    scheduleTemplates: { weekday, saturday, sunday },
    weeklyThemes: {
      sun: "Personal Social",
      mon: "Goal Assessment",
      tue: "Planning",
      wed: "Implementation",
      thu: "Integration, Debugging",
      fri: "Polish, Review",
      sat: "Personal Admin",
    },
    blockProcesses,
    days: {},
    // Seed only the *current* month with the user's stated goals; other months
    // start blank and are edited per-month in the Plan view.
    monthlyPlans: { [monthKey(new Date())]: seedMonth() },
    settings: {
      activeHours: { start: 7, end: 22 },
      alertStyle: "fullscreen",
      sound: "chime",
      weekendMode: true,
    },
  };
}

function seedMonth(): MonthWeek[] {
  return [
    {
      days: {
        sun: "",
        mon: "Goal assessment",
        tue: "Plan schedule tool, workflow improvements",
        wed: "Build system",
        thu: "Test system",
        fri: "Share system",
        sat: "Mail, Insurance, LLC, Calls",
      },
    },
    { days: { ...emptyDays(), sat: "Update portfolio & profiles" } },
    { days: { ...emptyDays(), sat: "Purchase vehicle" } },
    { days: { ...emptyDays(), sat: "Liquidate assets" } },
  ];
}
