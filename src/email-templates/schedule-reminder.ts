import type { EmailTemplate } from "../lib/email-templates";

export const template: EmailTemplate = {
  name: "Schedule reminder",
  subject: "Today's schedule",
  body: "Hi NAME,\n\nA quick reminder to check today's schedule. Let me know if anything's unclear.\n\nThanks,",
  order: 1,
};
