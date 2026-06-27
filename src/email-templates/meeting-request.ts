import type { EmailTemplate } from "../lib/email-templates";

export const template: EmailTemplate = {
  name: "Meeting request",
  subject: "Meeting request",
  body: "Hi NAME,\n\nCould we set up a short meeting? Let me know what time works for you.\n\nThanks,",
  order: 3,
};
