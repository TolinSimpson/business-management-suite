import type { EmailTemplate } from "../lib/email-templates";

export const template: EmailTemplate = {
  name: "Check-in",
  subject: "Quick check-in",
  body: "Hi NAME,\n\nJust checking in on how things are going. Anything you need from me?\n\nThanks,",
  order: 2,
};
