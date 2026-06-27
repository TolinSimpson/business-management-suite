<script lang="ts">
  import { emailTemplates } from "../lib/email-templates";

  let { email, name = "", onClose }: { email: string; name?: string; onClose: () => void } = $props();

  // Templates live in src/email-templates/. "NAME" is replaced with the
  // worker's first name on select.
  let firstName = $derived(name.trim().split(/\s+/)[0] || "there");
  let chosen = $state(-1);
  let subject = $state("");
  let body = $state("");

  function pick(i: number) {
    chosen = i;
    if (i < 0) return;
    subject = emailTemplates[i].subject;
    body = emailTemplates[i].body.replace(/NAME/g, firstName);
  }

  function send() {
    location.href =
      `mailto:${encodeURIComponent(email)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    onClose();
  }
</script>

<div
  class="modal-backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>

<div class="modal card" role="dialog" aria-modal="true" aria-label="Compose email">
  <h3 style="margin-bottom:4px">Email {name || email}</h3>
  <p class="muted" style="margin-top:0;font-size:.8rem">{email}</p>

  <label for="em-template">Template</label>
  <select id="em-template" value={chosen} onchange={(e) => pick(+e.currentTarget.value)}>
    <option value={-1} disabled>Choose a template…</option>
    {#each emailTemplates as t, i}
      <option value={i}>{t.name}</option>
    {/each}
  </select>

  <div style="height:10px"></div>
  <label for="em-subject">Subject</label>
  <input id="em-subject" type="text" bind:value={subject} placeholder="Subject" />

  <div style="height:10px"></div>
  <label for="em-body">Message</label>
  <textarea id="em-body" style="min-height:140px" bind:value={body} placeholder="Write your message…"></textarea>

  <div class="row-actions">
    <button onclick={onClose}>Cancel</button>
    <button class="primary" onclick={send}>Send email</button>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }
  .modal {
    position: fixed;
    z-index: 51;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: var(--modal-w);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    margin: 0;
  }
</style>
