<script lang="ts">
  import { state as appState } from "../lib/state";
  import { orgConfig } from "../lib/config";
  import { buildShare, shareUrl } from "../lib/share";
  import { cleanOrigin } from "../lib/manage";
  import { sortWorkers, ROLE_LABEL } from "../lib/workers";
  import { employeeTemplate } from "../lib/templates";
  import type { Employee } from "../lib/types";
  import Icon from "./Icon.svelte";
  import EmailModal from "./EmailModal.svelte";

  let company = $derived($orgConfig.company);
  let employees = $derived(sortWorkers($orgConfig.employees));

  // The built-in social channels, always shown in this order. Each renders as a
  // centred brand icon — grey + clickable when a link is set, darker + inert
  // when it isn't, so the row reads as "what's available / not yet set up".
  // "website" is special-cased to company.website; the rest live in company.social.
  const SOCIAL_OPTIONS = [
    { key: "website", icon: "globe" },
    { key: "discord", icon: "discord" },
    { key: "telegram", icon: "telegram" },
    { key: "linkedin", icon: "linkedin" },
    { key: "instagram", icon: "instagram" },
    { key: "facebook", icon: "facebook" },
    { key: "youtube", icon: "youtube" },
    { key: "github", icon: "github" },
  ];
  const BUILTIN_KEYS = new Set(SOCIAL_OPTIONS.map((o) => o.key));

  let builtin = $derived(
    SOCIAL_OPTIONS.map((o) => ({
      ...o,
      label: o.key,
      url: (o.key === "website" ? company.website : company.social?.[o.key])?.trim() ?? "",
    }))
  );
  // Custom links a manager added (any social key that isn't built in). These only
  // appear once set, using a generic link glyph with the key as the label.
  let custom = $derived(
    Object.entries(company.social ?? {})
      .filter(([key, url]) => !BUILTIN_KEYS.has(key) && url?.trim())
      .map(([key, url]) => ({ key, icon: "link", label: key, url: url.trim() }))
  );
  let links = $derived([...builtin, ...custom]);

  let emailTarget = $state<Employee | null>(null);

  function open(url?: string) {
    if (url) window.open(url, "_blank", "noopener");
  }
  function call(phone?: string) {
    if (phone) location.href = `tel:${phone.trim()}`;
  }
  function openEmail(w: Employee) {
    if (w.email) emailTarget = w;
  }
  // Open a read-only link to this employee's assigned daily schedule template.
  function viewSchedule(w: Employee) {
    const template = employeeTemplate(w, $orgConfig);
    const url = shareUrl(buildShare(template, $appState, "detailed", new Date()), cleanOrigin());
    window.open(url, "_blank", "noopener");
  }
</script>

<div class="card">
  <h3 class="socials-head">Our Socials</h3>

  <div class="socials">
    {#each links as l (l.key)}
      <button
        class="social"
        class:off={!l.url}
        title={l.url ? l.label : `${l.label} — not set up`}
        aria-label={l.label}
        disabled={!l.url}
        onclick={() => open(l.url)}
      >
        <Icon name={l.icon} size={22} />
      </button>
    {/each}
  </div>
</div>

{#if employees.length === 0}
  <div class="card">
    <p class="muted">No team members yet. A manager can add them in the Team tool.</p>
  </div>
{:else}
  <div class="card">
    {#each employees as w (w.id)}
      <div class="row">
        <div style="flex:1;min-width:0">
          <div class="lab">{w.name}</div>
          <div class="sub">{ROLE_LABEL[w.role]}</div>
        </div>
        <div class="hr-actions">
          <button class="ico-btn" title="Call" aria-label="Call {w.name}" disabled={!w.phone} onclick={() => call(w.phone)}>
            <Icon name="phone" size={18} />
          </button>
          <button class="ico-btn" title="Email" aria-label="Email {w.name}" disabled={!w.email} onclick={() => openEmail(w)}>
            <Icon name="mail" size={18} />
          </button>
          <button class="ico-btn" title="View schedule" aria-label="View {w.name}'s schedule" onclick={() => viewSchedule(w)}>
            <Icon name="calendar" size={18} />
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if emailTarget}
  <EmailModal email={emailTarget.email ?? ""} name={emailTarget.name} onClose={() => (emailTarget = null)} />
{/if}

<style>
  .socials-head {
    margin: 0;
    text-align: center;
  }
  .socials {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 14px;
  }
  .social {
    background: none;
    border: none;
    padding: 4px;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.15s;
  }
  .social:hover {
    color: var(--text);
  }
  /* No link assigned — darker grey and inert. */
  .social.off {
    color: var(--line);
    cursor: default;
  }
  .social.off:hover {
    color: var(--line);
  }
  .hr-actions {
    display: flex;
    gap: 6px;
    flex: 0 0 auto;
  }
  .hr-actions button {
    padding: 8px 10px;
  }
  .ico-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
  }
  .hr-actions button:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
