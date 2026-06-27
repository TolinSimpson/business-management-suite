import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "childcare",
  name: "Childcare",
  description: "Daycare day from welcome through pickup",
  order: 3,
  blocks: [
    {
      time: "07:00",
      label: "Arrival & Welcome",
      detail: "Sign-ins · health check",
      checklist: ["Sign-ins logged", "Health check", "Parents greeted"],
    },
    { time: "08:00", label: "Breakfast & Free Play" },
    { time: "09:00", label: "Morning Activity" },
    { time: "10:00", label: "Outdoor Play" },
    { time: "11:00", label: "Story & Learning Time" },
    { time: "12:00", label: "Lunch", checklist: ["Meal served", "Allergies checked", "Cleaned up"] },
    { time: "13:00", label: "Nap / Quiet Time" },
    { time: "15:00", label: "Afternoon Activity" },
    { time: "16:00", label: "Cleanup & Pickup", checklist: ["Room tidied", "Sign-outs logged", "Daily notes sent"] },
  ],
};
