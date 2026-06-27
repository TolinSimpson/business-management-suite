import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "construction",
  name: "Construction",
  description: "Early start, build blocks, safety and cleanup",
  order: 1,
  blocks: [
    {
      time: "07:00",
      label: "Site Setup & Safety Briefing",
      detail: "Toolbox talk · PPE check",
      checklist: ["PPE on", "Toolbox talk", "Hazards checked"],
    },
    { time: "08:00", label: "Morning Build" },
    { time: "10:00", label: "Material Handling" },
    { time: "11:00", label: "Continue Build" },
    { time: "12:00", label: "Lunch" },
    { time: "13:00", label: "Afternoon Build" },
    { time: "15:00", label: "Cleanup & Inspection", checklist: ["Site cleared", "Tools accounted for", "Work inspected"] },
    { time: "16:00", label: "Tool Check & Wrap-up", checklist: ["Tools stored", "Hours logged", "Tomorrow noted"] },
  ],
};
