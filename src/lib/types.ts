// Core data model for the schedule app. Kept intentionally small: the entire
// app state is one JSON-serialisable object persisted to localStorage.

/**
 * One field of an end-of-day planning form. Whatever the user types is written
 * to the matching block on the *next* day so it resurfaces in that time slot.
 */
export interface PlanTarget {
  /** stable field key */
  key: string;
  /** the "HH:MM" block tomorrow this field feeds into */
  time: string;
  /** form label, e.g. "Primary task" */
  label: string;
}

/** A single hour block in the day, e.g. { time: "09:00", label: "Deep Work" }. */
export interface Block {
  /** 24h "HH:MM" start time (interpreted in the device's local timezone). */
  time: string;
  label: string;
  /** Optional one-line hint shown under the label. */
  detail?: string;
  /** Optional per-step checklist (the boxes shown under "Process"). */
  checklist?: string[];
  /** Optional per-step planning inputs that feed tomorrow's matching blocks. */
  plan?: PlanTarget[];
}

export type AlertStyle = "persistent" | "standard";

/**
 * A daily work schedule for a kind of role (software, construction, childcare…).
 * Management assigns one to each employee; the device shows the assigned one.
 * Checklists and planning inputs are configured per block (see Block).
 */
export interface ScheduleTemplate {
  /** stable id, e.g. "construction" */
  id: string;
  /** display name, e.g. "Construction" */
  name: string;
  /** one-line description of who this is for */
  description: string;
  /** sort order in the picker (lower first); defaults to 0 */
  order?: number;
  /** the day's hour blocks */
  blocks: Block[];
}

/** A company-wide day off, shown instead of the schedule on that date. */
export interface Holiday {
  /** "YYYY-MM-DD" */
  date: string;
  /** display name, e.g. "Christmas Day" */
  name: string;
}

/** Per-date instance data: the task layer laid over the standing schedule. */
export interface DayData {
  /** keyed by block "HH:MM" */
  blocks: Record<string, BlockInstance>;
}

export interface BlockInstance {
  taskNote?: string;
  /** checklist step -> done */
  checklist?: Record<string, boolean>;
}

export interface Settings {
  activeHours: { start: number; end: number }; // hours 0-23, inclusive start, inclusive end
  alertStyle: AlertStyle;
  sound: string;
}

/**
 * A device-local personal schedule for off-hours / weekends — lets someone use
 * the schedule tool + alarms for personal routines outside their work hours.
 */
export interface PersonalSchedule {
  /** when true, this schedule takes over during off-hours and weekends */
  enabled: boolean;
  /** the personal day's hour blocks */
  blocks: Block[];
  /**
   * Optional daily wake-up alarm. Fires a chime at `time` regardless of whether
   * the off-hours schedule is enabled. Optional so older saved states parse.
   */
  wakeAlarm?: { enabled: boolean; time: string };
}

/** Admin gate state — whether management tools are unlocked (see lib/auth.ts). */
export interface ManageAuth {
  signedIn: boolean;
}

/** Staff seniority, used to order the HR directory (managers first). */
export type WorkerRole = "manager" | "senior" | "general";

/**
 * A team member in the public org directory (config.json). Most fields are
 * public; contact details (email/phone) are encrypted at rest — see below.
 * Edited by managers in the Management tool, read by everyone.
 */
export interface Employee {
  id: string;
  name: string;
  role: WorkerRole;
  /**
   * Contact fields. Stored ENCRYPTED-at-rest in config.json ("enc:v1:…" blobs)
   * because that file is public; they're decrypted for display once the user
   * enters the shared access password. See lib/crypto.ts + lib/access.ts. May
   * also be plaintext in legacy configs (decryptField passes those through).
   */
  email?: string;
  phone?: string;
  /** Id of the schedule template management assigned to this person. */
  templateId?: string;
  /**
   * A bespoke schedule for this person, set by management instead of a built-in
   * template. When present it takes precedence over templateId.
   */
  customSchedule?: { blocks: Block[] };
  /** Optional public profile links, label -> url (e.g. { linkedin, github }). */
  links?: Record<string, string>;
}

/** Publicly-postable company details shown at the top of the HR tab. */
export interface CompanyInfo {
  name: string;
  registrationNumber?: string;
  website?: string;
  /** Social/community links, label -> url (e.g. { discord, linkedin, instagram }). */
  social?: Record<string, string>;
}

/** A single internal reserve fund, taken as a percent of the post-tax pool. */
export interface ReserveItem {
  /** stable key, e.g. "tools" */
  key: string;
  label: string;
  /** percent of the post-tax revenue pool (Step 2) */
  pct: number;
}

/**
 * Company budget/wage policy. Drives the Business tab and the reporting tool.
 * Lives in the shared config.json so the whole team sees the same model.
 */
export interface FinanceConfig {
  /** currency symbol shown before amounts, e.g. "$". */
  currency: string;
  /** tax reserve as a percent of gross income (Step 1). */
  taxReservePct: number;
  /** internal reserve funds, each a percent of the post-tax pool (Step 2). */
  reserves: ReserveItem[];
  /** wage multiplier per role; management is capped at 2x. */
  roleMultipliers: Record<WorkerRole, number>;
  /** planning estimate of monthly gross income, used for projections. */
  estMonthlyIncome: number;
  /** planning estimate of monthly raw vendor expenses. */
  estMonthlyVendor: number;
}

/**
 * The shared, public org directory fetched from a static config.json. Managers
 * publish it; every device reads it without a login. See lib/config.ts.
 */
export interface OrgConfig {
  /** Bumped on every publish so clients can detect new info. */
  version: number;
  /** ISO timestamp of the last publish (display only). */
  updatedAt?: string;
  /**
   * PII encryption parameters. `salt` (public) seeds the PBKDF2 key derived from
   * the shared access password; `verifier` is an encrypted known-token used to
   * confirm a typed password is correct. Absent on configs with no protected
   * fields. See lib/crypto.ts + lib/access.ts.
   */
  pii?: { salt: string; verifier: string };
  company: CompanyInfo;
  employees: Employee[];
  /** Budget/wage policy (optional so older configs still parse). */
  finance?: FinanceConfig;
  /** Schedule template used for anyone without a specific assignment. */
  defaultTemplateId?: string;
  /** Company-wide days off. */
  holidays?: Holiday[];
}

/** One month's actual income/expense entry, logged in the reporting tool. */
export interface MonthlyReport {
  id: string;
  /** "YYYY-MM" */
  month: string;
  /** gross business income for the month */
  income: number;
  /** raw vendor expenses for the month */
  vendor: number;
  note?: string;
}

export interface AppState {
  /**
   * Which employee this device belongs to (id into the org directory). Drives
   * which schedule template the Now screen shows. Undefined = use the company
   * default template.
   */
  myEmployeeId?: string;
  /** Optional personal off-hours / weekend schedule (used outside work hours). */
  personal: PersonalSchedule;
  days: Record<string, DayData>; // keyed "YYYY-MM-DD"
  settings: Settings;
  manage: ManageAuth;
  /** Device-local monthly income/expense log (management reporting tool). */
  reports: MonthlyReport[];
}
