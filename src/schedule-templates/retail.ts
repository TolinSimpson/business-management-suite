import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "retail",
  name: "Retail / Sales",
  description: "Open, floor coverage, restock, and cash-out",
  order: 4,
  blocks: [
    {
      time: "09:00",
      label: "Open & Restock",
      detail: "Registers ready · floor restocked",
      checklist: ["Registers ready", "Floor restocked", "Displays set"],
    },
    { time: "10:00", label: "Floor & Customers" },
    { time: "12:00", label: "Lunch" },
    { time: "13:00", label: "Floor & Customers" },
    { time: "15:00", label: "Restock & Merchandising" },
    { time: "17:00", label: "Close & Cash-out", checklist: ["Register counted", "Floor reset", "Store secured"] },
  ],
};
