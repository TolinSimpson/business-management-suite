import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "healthcare",
  name: "Healthcare / Caregiver",
  description: "Handover, rounds, medication, and charting",
  order: 6,
  blocks: [
    {
      time: "07:00",
      label: "Shift Handover",
      detail: "Report received · charts reviewed",
      checklist: ["Report received", "Charts reviewed", "Priorities noted"],
    },
    { time: "08:00", label: "Morning Rounds & Care" },
    { time: "10:00", label: "Medication & Vitals", checklist: ["Meds administered", "Vitals recorded", "Changes flagged"] },
    { time: "12:00", label: "Lunch & Feeding Assist" },
    { time: "13:00", label: "Afternoon Care" },
    { time: "15:00", label: "Activities & Mobility" },
    { time: "16:00", label: "Charting & Handover", checklist: ["Notes charted", "Report given", "Tasks handed off"] },
  ],
};
