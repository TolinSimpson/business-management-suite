import { describe, it, expect } from "vitest";
import { defaultState } from "../src/lib/defaults";
import { templateById } from "../src/lib/templates";
import {
  buildShare,
  encodeShare,
  decodeShare,
  readShareFromHash,
  shareUrl,
} from "../src/lib/share";

const tpl = templateById("software");

function seeded() {
  const s = defaultState();
  // Monday 2026-06-22: a primary-task note + a checked step.
  s.days["2026-06-22"] = {
    blocks: { "09:00": { taskNote: "Ship plugin", checklist: { Prayed: true } } },
  };
  return s;
}

const monday = new Date("2026-06-22T10:00:00");

describe("buildShare detail levels", () => {
  it("overview includes the schedule only, without per-block checklists", () => {
    const p = buildShare(tpl, seeded(), "overview", monday);
    expect(p.schedule.length).toBeGreaterThan(0);
    expect(p.date).toBe("2026-06-22");
    expect(p.blocks).toBeUndefined();
    expect(p.schedule.every((b) => b.checklist === undefined)).toBe(true);
  });

  it("detailed includes task notes but not checklists", () => {
    const p = buildShare(tpl, seeded(), "detailed", monday);
    expect(p.blocks?.["09:00"].taskNote).toBe("Ship plugin");
    expect(p.blocks?.["09:00"].checklist).toBeUndefined();
    expect(p.schedule.every((b) => b.checklist === undefined)).toBe(true);
  });

  it("full includes per-block checklist templates and checked steps", () => {
    const p = buildShare(tpl, seeded(), "full", monday);
    expect(p.blocks?.["09:00"].checklist?.Prayed).toBe(true);
    expect(p.schedule.find((b) => b.time === "09:00")?.checklist).toContain("Objective set");
  });
});

describe("encode/decode round-trip", () => {
  it("survives compression for each level", () => {
    for (const level of ["overview", "detailed", "full"] as const) {
      const p = buildShare(tpl, seeded(), level, monday);
      const decoded = decodeShare(encodeShare(p));
      expect(decoded).toEqual(p);
    }
  });

  it("rejects garbage", () => {
    expect(decodeShare("not-a-real-code")).toBeNull();
  });

  it("reads a payload back from a URL hash", () => {
    const p = buildShare(tpl, seeded(), "detailed", monday);
    const url = shareUrl(p, "https://example.com");
    const hash = url.slice(url.indexOf("#"));
    expect(readShareFromHash(hash)).toEqual(p);
  });
});
