import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "hospitality",
  name: "Hospitality / Food Service",
  description: "Prep, service shifts, reset, and close",
  order: 7,
  blocks: [
    {
      time: "10:00",
      label: "Prep & Setup",
      detail: "Stations stocked · specials reviewed",
      checklist: ["Stations stocked", "Specials reviewed", "Opening checklist"],
    },
    { time: "11:00", label: "Lunch Service" },
    { time: "14:00", label: "Reset & Break" },
    { time: "15:00", label: "Dinner Prep" },
    { time: "17:00", label: "Dinner Service" },
    { time: "21:00", label: "Close & Clean", checklist: ["Stations cleaned", "Inventory noted", "Closing checklist"] },
  ],
};
