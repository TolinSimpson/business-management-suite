import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "office",
  name: "Office / Admin",
  description: "Email, focused work, meetings, and wrap-up",
  order: 5,
  blocks: [
    {
      time: "09:00",
      label: "Email & Priorities",
      detail: "Clear inbox · set priorities",
      checklist: ["Inbox cleared", "Priorities set"],
    },
    { time: "10:00", label: "Focused Work" },
    { time: "12:00", label: "Lunch" },
    { time: "13:00", label: "Meetings & Calls" },
    { time: "14:00", label: "Focused Work" },
    { time: "16:00", label: "Wrap-up & Plan", checklist: ["Tasks updated", "Tomorrow planned"] },
  ],
};
