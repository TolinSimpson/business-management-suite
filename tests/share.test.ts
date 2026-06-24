import { describe, it, expect } from "vitest";
import { defaultState } from "../src/lib/defaults";
import {
  buildShare,
  encodeShare,
  decodeShare,
  weekDates,
  readShareFromHash,
  shareUrl,
} from "../src/lib/share";

function seeded() {
  const s = defaultState();
  // Monday 2026-06-22, deep work task + a checked step.
  s.days["2026-06-22"] = {
    blocks: { "10:00": { taskNote: "Ship plugin", checklist: { Prayed: true } } },
  };
  return s;
}

const monday = new Date("2026-06-22T10:00:00");

describe("weekDates", () => {
  it("returns Sunday..Saturday for the week", () => {
    const w = weekDates(monday);
    expect(w).toHaveLength(7);
    expect(w[0]).toBe("2026-06-21"); // Sun
    expect(w[6]).toBe("2026-06-27"); // Sat
    expect(w).toContain("2026-06-22");
  });
});

describe("buildShare detail levels", () => {
  it("overview includes templates + themes only", () => {
    const p = buildShare(seeded(), "overview", monday);
    expect(p.templates.weekday.length).toBeGreaterThan(0);
    expect(p.themes.mon).toBe("Goal Assessment");
    expect(p.days).toBeUndefined();
    expect(p.processes).toBeUndefined();
  });

  it("detailed includes task notes but not checklists or processes", () => {
    const p = buildShare(seeded(), "detailed", monday);
    expect(p.days?.["2026-06-22"].blocks["10:00"].taskNote).toBe("Ship plugin");
    expect(p.days?.["2026-06-22"].blocks["10:00"].checklist).toBeUndefined();
    expect(p.processes).toBeUndefined();
  });

  it("full includes checklists and process templates", () => {
    const p = buildShare(seeded(), "full", monday);
    expect(p.days?.["2026-06-22"].blocks["10:00"].checklist?.Prayed).toBe(true);
    expect(p.processes?.["deep work"]).toContain("Objective set");
  });
});

describe("encode/decode round-trip", () => {
  it("survives compression for each level", () => {
    for (const level of ["overview", "detailed", "full"] as const) {
      const p = buildShare(seeded(), level, monday);
      const decoded = decodeShare(encodeShare(p));
      expect(decoded).toEqual(p);
    }
  });

  it("rejects garbage", () => {
    expect(decodeShare("not-a-real-code")).toBeNull();
  });

  it("reads a payload back from a URL hash", () => {
    const p = buildShare(seeded(), "detailed", monday);
    const url = shareUrl(p, "https://example.com");
    const hash = url.slice(url.indexOf("#"));
    expect(readShareFromHash(hash)).toEqual(p);
  });
});
