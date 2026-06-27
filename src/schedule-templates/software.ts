import type { ScheduleTemplate } from "../lib/types";

// Software engineer — the original schedule. Checklists and the end-of-day
// planning inputs are configured per block: the 4 PM block's plan fields write
// to tomorrow's matching slots so they resurface the next morning.
export const template: ScheduleTemplate = {
  id: "software",
  name: "Software Engineer",
  description: "Deep-work day with an end-of-day plan for tomorrow",
  order: 0,
  blocks: [
    {
      time: "09:00",
      label: "Deep Work: Primary Task",
      detail: "Work on hardest task",
      checklist: ["Prayed", "Objective set", "Prompted agent", "Output reviewed"],
    },
    { time: "10:00", label: "Deep Work: Continuation", checklist: ["Objective set", "Prompted agent", "Output reviewed"] },
    { time: "11:00", label: "Deep Work: Secondary Task", checklist: ["Objective set", "Prompted agent", "Output reviewed"] },
    {
      time: "12:00",
      label: "Lunch / Meeting / Feedback",
      detail: "Lunch (20m) · Meeting (20m) · Feedback (20m)",
      checklist: ["Ate", "Met", "Captured feedback"],
    },
    { time: "13:00", label: "Deep Work: Feedback Implementation", checklist: ["Triaged feedback", "Prompted agent", "Verified"] },
    { time: "14:00", label: "Deep Work: Refine & Debug", checklist: ["Reviewed output", "Refined", "Verified"] },
    { time: "15:00", label: "Test, Document, Commit", checklist: ["Tests pass", "Documented", "Committed"] },
    {
      time: "16:00",
      label: "Plan for Tomorrow & Shutdown",
      checklist: ["Reviewed today", "Set tomorrow's plan", "Shut down"],
      plan: [
        { key: "primary", time: "09:00", label: "Primary task" },
        { key: "secondary", time: "11:00", label: "Secondary task" },
        { key: "agenda", time: "12:00", label: "Meeting agenda" },
      ],
    },
  ],
};
