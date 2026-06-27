import type { EmailTemplate } from "../lib/email-templates";

export const template: EmailTemplate = {
  name: "Calling in sick",
  subject: "Sick day — out today",
  body:
    "Hi NAME,\n\n" +
    "I'm not feeling well and won't be able to work today. I'll rest up and keep " +
    "you posted if anything changes for tomorrow.\n\n" +
    "I'll make sure anything urgent is covered or handed off. Apologies for the " +
    "short notice, and thank you for understanding.\n\n" +
    "Best,",
  order: 3,
};
