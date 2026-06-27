import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { AppState, Block, DayData, ScheduleTemplate } from "./types";
import { dateKey } from "./schedule";

// Serverless sharing: a read-only snapshot of a single day's schedule is
// compressed into the URL hash. Employees open the link in their browser / PWA.
// The detail level controls how much is included.

export type ShareLevel = "overview" | "detailed" | "full";

export interface SharePayload {
  v: 1;
  level: ShareLevel;
  /** the date this schedule is for (YYYY-MM-DD) */
  date: string;
  schedule: Block[];
  /** the shared day's task layer, keyed by block "HH:MM" */
  blocks?: DayData["blocks"];
}

/**
 * Public copy of the blocks for a share level. Checklists are included only at
 * "full"; planning inputs are author-time config and never shared.
 */
function publicBlocks(blocks: Block[], full: boolean): Block[] {
  return blocks.map((b) => {
    const out: Block = { time: b.time, label: b.label };
    if (b.detail) out.detail = b.detail;
    if (full && b.checklist?.length) out.checklist = b.checklist;
    return out;
  });
}

export function buildShare(
  template: ScheduleTemplate,
  state: AppState,
  level: ShareLevel,
  day: Date
): SharePayload {
  const payload: SharePayload = {
    v: 1,
    level,
    date: dateKey(day),
    schedule: publicBlocks(template.blocks, level === "full"),
  };

  if (level === "overview") return payload;

  // detailed + full: include the day's task layer
  const src = state.days[dateKey(day)];
  if (src) {
    const blocks: DayData["blocks"] = {};
    for (const [time, inst] of Object.entries(src.blocks)) {
      const out: DayData["blocks"][string] = {};
      if (inst.taskNote) out.taskNote = inst.taskNote;
      if (level === "full" && inst.checklist) out.checklist = inst.checklist;
      if (Object.keys(out).length) blocks[time] = out;
    }
    if (Object.keys(blocks).length) payload.blocks = blocks;
  }

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
    if (obj.v !== 1 || !obj.schedule) return null;
    return obj;
  } catch {
    return null;
  }
}

/** Build a shareable URL using the given origin + `#s=<code>`. */
export function shareUrl(payload: SharePayload, origin: string): string {
  return `${origin}#s=${encodeShare(payload)}`;
}

/** Read a share payload from a URL hash like "#s=...". */
export function readShareFromHash(hash: string): SharePayload | null {
  const m = hash.match(/[#&]s=([^&]+)/);
  return m ? decodeShare(m[1]) : null;
}
