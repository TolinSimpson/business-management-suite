import type { Employee, WorkerRole } from "./types";

// Display metadata + ordering for the HR directory.

export const ROLE_ORDER: WorkerRole[] = ["manager", "senior", "general"];

export const ROLE_LABEL: Record<WorkerRole, string> = {
  manager: "Manager",
  senior: "Senior staff",
  general: "General staff",
};

const rank: Record<WorkerRole, number> = { manager: 0, senior: 1, general: 2 };

/** Employees sorted managers → senior → general, then alphabetically by name. */
export function sortWorkers(employees: Employee[]): Employee[] {
  return [...employees].sort(
    (a, b) => rank[a.role] - rank[b.role] || a.name.localeCompare(b.name)
  );
}
