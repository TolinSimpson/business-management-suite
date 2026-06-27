// Modular email templates. Drop a `.ts` file into `src/email-templates/`
// exporting a `template` object and it appears in the HR email dropdown.
// In `body`, the token "NAME" is replaced with the recipient's first name.
//
//   // src/email-templates/my-template.ts
//   import type { EmailTemplate } from "../lib/email-templates";
//   export const template: EmailTemplate = {
//     name: "My template", subject: "Subject", body: "Hi NAME, …", order: 5,
//   };

export interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  /** lower sorts first; defaults to 0 */
  order?: number;
}

const modules = import.meta.glob("../email-templates/*.ts", { eager: true }) as Record<
  string,
  { template?: EmailTemplate; default?: EmailTemplate }
>;

export const emailTemplates: EmailTemplate[] = Object.values(modules)
  .map((m) => m.template ?? m.default)
  .filter((t): t is EmailTemplate => !!t)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
