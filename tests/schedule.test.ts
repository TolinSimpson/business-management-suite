import { describe, it, expect } from "vitest";
import { defaultState } from "../src/lib/defaults";
import {
  currentBlock,
  nowView,
  templateKeyOf,
  alarmTimesFor,
  toMinutes,
  normLabel,
  dateKey,
} from "../src/lib/schedule";
import type { Block } from "../src/lib/types";

const blocks: Block[] = [
  { time: "07:00", label: "workout" },
  { time: "10:00", label: "deep work" },
  { time: "22:00", label: "sleep" },
];

// Build a Date for a given weekday + hour/min. 2026-06-22 is a Monday.
function at(dateISO: string, h: number, m = 0): Date {
  return new Date(`${dateISO}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
}

describe("templateKeyOf", () => {
  it("maps weekday/Saturday/Sunday", () => {
    expect(templateKeyOf(at("2026-06-22", 9))).toBe("weekday"); // Mon
    expect(templateKeyOf(at("2026-06-27", 9))).toBe("saturday"); // Sat
    expect(templateKeyOf(at("2026-06-28", 9))).toBe("sunday"); // Sun
  });
});

describe("currentBlock", () => {
  it("returns null before the first block", () => {
    expect(currentBlock(blocks, at("2026-06-22", 6, 30))).toBeNull();
  });

  it("selects the active block at its boundary", () => {
    const c = currentBlock(blocks, at("2026-06-22", 10, 0));
    expect(c?.block.label).toBe("deep work");
    expect(c?.next?.label).toBe("sleep");
  });

  it("selects the active block mid-interval", () => {
    const c = currentBlock(blocks, at("2026-06-22", 8, 30));
    expect(c?.block.label).toBe("workout");
    expect(c?.endsInMin).toBe(90); // until 10:00
  });

  it("runs the final block until midnight", () => {
    const c = currentBlock(blocks, at("2026-06-22", 23, 0));
    expect(c?.block.label).toBe("sleep");
    expect(c?.next).toBeNull();
    expect(c?.endsInMin).toBe(60);
  });

  it("is unaffected by input ordering", () => {
    const shuffled = [blocks[2], blocks[0], blocks[1]];
    const c = currentBlock(shuffled, at("2026-06-22", 10, 30));
    expect(c?.block.label).toBe("deep work");
  });
});

describe("nowView", () => {
  it("composes headline with theme and overlays a task note", () => {
    const s = defaultState();
    const dk = dateKey(at("2026-06-22", 10));
    s.days[dk] = { blocks: { "10:00": { taskNote: "Ship plugin" } } };
    const v = nowView(s, at("2026-06-22", 10, 15))!;
    expect(v.headline).toBe("Deep work — Goal Assessment — Ship plugin"); // Mon theme
    expect(v.taskNote).toBe("Ship plugin");
  });

  it("omits the task when none is set", () => {
    const s = defaultState();
    const v = nowView(s, at("2026-06-22", 10, 15))!;
    expect(v.headline).toBe("Deep work — Goal Assessment");
  });

  it("exposes the checklist template for the block", () => {
    const s = defaultState();
    const v = nowView(s, at("2026-06-22", 9, 30))!; // plan daily task
    expect(v.checklist.map((c) => c.step)).toContain("Risk assessment");
    expect(v.checklist.every((c) => !c.done)).toBe(true);
  });

  it("reflects checked steps", () => {
    const s = defaultState();
    const dk = dateKey(at("2026-06-22", 9));
    s.days[dk] = { blocks: { "09:00": { checklist: { Prayed: true } } } };
    const v = nowView(s, at("2026-06-22", 9, 30))!;
    expect(v.checklist.find((c) => c.step === "Prayed")?.done).toBe(true);
  });
});

describe("alarmTimesFor", () => {
  it("keeps only boundaries inside active hours", () => {
    const s = defaultState(); // active 7..22
    const times = alarmTimesFor(s, at("2026-06-22", 9));
    expect(times[0]).toBe(toMinutes("07:00"));
    expect(times.at(-1)).toBe(toMinutes("22:00"));
    expect(times).not.toContain(toMinutes("23:00"));
  });
});

describe("helpers", () => {
  it("normLabel is stable", () => {
    expect(normLabel("  Deep   Work ")).toBe("deep work");
  });
  it("dateKey has no UTC shift", () => {
    expect(dateKey(at("2026-06-22", 0, 30))).toBe("2026-06-22");
  });
});
