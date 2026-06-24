import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { AppState, Block, DayData, DayKey, TemplateKey } from "./types";
import { dateKey } from "./schedule";

// Serverless sharing: a read-only snapshot is compressed into the URL hash.
// The detail level controls how much is included.

export type ShareLevel = "overview" | "detailed" | "full";

export interface SharePayload {
  v: 1;
  level: ShareLevel;
  anchor: string; // a date inside the shared week (YYYY-MM-DD)
  templates: Record<TemplateKey, Block[]>;
  themes: Record<DayKey, string>;
  processes?: Record<string, string[]>;
  days?: Record<string, DayData>;
}

/** The 7 date keys (Sun..Sat) of the week containing `anchor`. */
export function weekDates(anchor: Date): string[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay()); // back to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateKey(d);
  });
}

export function buildShare(state: AppState, level: ShareLevel, anchor: Date): SharePayload {
  const payload: SharePayload = {
    v: 1,
    level,
    anchor: dateKey(anchor),
    templates: state.scheduleTemplates,
    themes: state.weeklyThemes,
  };

  if (level === "overview") return payload;

  // detailed + full: include this week's task layer
  const dates = weekDates(anchor);
  const days: Record<string, DayData> = {};
  for (const dk of dates) {
    const src = state.days[dk];
    if (!src) continue;
    const blocks: DayData["blocks"] = {};
    for (const [time, inst] of Object.entries(src.blocks)) {
      const out: DayData["blocks"][string] = {};
      if (inst.taskNote) out.taskNote = inst.taskNote;
      if (level === "full" && inst.checklist) out.checklist = inst.checklist;
      if (Object.keys(out).length) blocks[time] = out;
    }
    if (Object.keys(blocks).length) days[dk] = { blocks };
  }
  if (Object.keys(days).length) payload.days = days;

  if (level === "full") payload.processes = state.blockProcesses;
  return payload;
}

export function encodeShare(payload: SharePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeShare(code: string): SharePayload | null {
  try {
    const json = decompressFromEncodedURIComponent(code);
    if (!json) return null;
    const obj = JSON.parse(json) as SharePayload;
    if (obj.v !== 1 || !obj.templates) return null;
    return obj;
  } catch {
    return null;
  }
}

/** Build a shareable URL using the current page origin + `#s=<code>`. */
export function shareUrl(payload: SharePayload, origin: string): string {
  return `${origin}#s=${encodeShare(payload)}`;
}

/** Read a share payload from a URL hash like "#s=...". */
export function readShareFromHash(hash: string): SharePayload | null {
  const m = hash.match(/[#&]s=([^&]+)/);
  return m ? decodeShare(m[1]) : null;
}
