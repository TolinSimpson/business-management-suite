import type { ScheduleTemplate } from "../lib/types";

export const template: ScheduleTemplate = {
  id: "landscaping",
  name: "Landscaping",
  description: "Route-based property work with equipment care",
  order: 2,
  blocks: [
    {
      time: "07:00",
      label: "Load Up & Route Plan",
      detail: "Truck loaded · fuel checked",
      checklist: ["Truck loaded", "Fuel checked", "Route set"],
    },
    { time: "08:00", label: "First Property" },
    { time: "10:00", label: "Second Property" },
    { time: "12:00", label: "Lunch" },
    { time: "13:00", label: "Afternoon Properties" },
    { time: "15:00", label: "Equipment Maintenance", checklist: ["Blades cleaned", "Fluids topped", "Damage noted"] },
    { time: "16:00", label: "Unload & Log", checklist: ["Equipment stored", "Hours logged", "Issues reported"] },
  ],
};
