# Business Management Tool

A phone-first **business management** PWA for a small team: a live daily schedule,
an HR directory, a revenue/wage budget model, and a set of work tools — all in one
small Svelte app. No backend and no app store; the shared company data syncs
through a single `config.json` in a public repo, and everything else lives
on-device.

**Stack:** Svelte 5 + Vite + TypeScript, installable PWA (`vite-plugin-pwa`),
local-first (one JSON object in `localStorage`), serverless share links
(`lz-string` in the URL hash). Production bundle ≈ 55 KB gzipped (JS) + ≈ 4 KB CSS.

---

<details open>
<summary><b>What's inside</b> — the five tabs</summary>

Footer tabs: **Focus · Schedule · Tools · HR · Business · Settings**.

- **Schedule** (Now) — shows the block you should be in *right now* from a
  role-based template (software, construction, landscaping, childcare, retail,
  office, healthcare, hospitality), resolved from this device's identity. Per-block
  checklists and (for software) an end-of-day "plan for tomorrow" form that feeds
  the next day's slots. Company holidays replace the schedule for the day. An
  hourly chime moves you to the next block while the app is open.
- **Tools** — a modular tool drawer (see *Tools* below): Calculator, Scratchpad,
  Projects (kanban + email progress report), Prompt Builder, and the admin-gated
  Management tool.
- **HR** — company social links plus the team directory from `config.json`, each
  member with call / email / view-schedule actions.
- **Business** — the budget model: gross revenue → tax + vendor → post-tax pool →
  itemised reserve funds → worker wage pool split by role multiplier. Log monthly
  actuals to switch projections to real figures; a "reserve funds on hand" total
  accumulates across logged months. Dependency-free SVG donut + breakdown.
- **Settings** — device identity ("I am"), off-hours/weekend schedule + daily wake
  alarm, notification permission / sound / alert style / Focus hours, admin
  lock, and reset.

**Focus mode** (toolbar toggle): keeps the screen awake (Screen Wake Lock API) and
goes full-screen on the current block, so the in-tab chime keeps firing. Best with
the phone on a charger during the workday. The one limit a PWA can't escape: alerts
only fire while the app is **open** — a true locked-pocket alarm would need a
native build.

</details>

<details>
<summary><b>Develop</b></summary>

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest (53 tests: finance, schedule, share, templates)
npm run check      # svelte-check type check
npm run build      # -> dist/
npm run preview    # serve the production build
```

</details>

<details>
<summary><b>Layout</b></summary>

```
src/
  lib/
    types.ts        AppState + OrgConfig (shared directory) models
    state.ts        localStorage-backed app store + mutators
    defaults.ts     seed device state (settings, off-hours routine)
    schedule.ts     pure now-computation (active block, alarm times, 12h format)
    templates.ts    role-template registry + resolution (+ personal/custom/holiday)
    finance.ts      budget math (breakdown, wage allocation, reserve accumulation)
    config.ts       fetch/cache the shared config.json; decrypt PII view
    access.ts       app access gate state + the live PII decryption key
    crypto.ts       PBKDF2 + AES-GCM encrypt/decrypt for PII fields
    github.ts       per-manager PAT + Contents API publish of config.json
    auth.ts         admin password gate (SHA-256)
    biometric.ts    WebAuthn platform-authenticator unlock (Face ID / fingerprint)
    workers.ts      role ordering / labels
    share.ts        encode/decode a read-only schedule snapshot + detail levels
    notify.ts       in-session hourly chime + Notification API
    focus.ts        Focus-mode store      wakelock.ts  screen wake lock
    tools.ts        tool registry (import.meta.glob over src/tools/*.svelte)
  components/        Now, HR, Business, Tools, Settings, Pie, Checklist,
                     Icon, EmailModal, AdminGate, AccessGate, ShareView
  tools/            Calculator, Scratchpad, Projects, PromptBuilder, Management
  templates/        one ScheduleTemplate per role (software, construction, …)
  email-templates/  mailto: templates (check-in, sick-day, meeting-request, …)
  App.svelte        tab shell + access gate + share-link route
tests/              vitest (53 tests)
```

Drop a self-contained `.svelte` into `src/tools/` that exports `meta` in a
`<script module>` block and it auto-appears in the Tools drawer (set
`admin: true` to put it behind the admin gate).

</details>

<details>
<summary><b>Install as a PWA</b></summary>

The web build is an installable PWA (service worker + manifest + icons via
`vite-plugin-pwa`). On your phone, open the app URL in Chrome → **Add to Home
screen** — it then launches standalone and works offline. Deploy `dist/` to any
static host (GitHub Pages, Netlify, Cloudflare Pages, …); the included GitHub
Pages workflow is described below.

</details>

<details>
<summary><b>Deploy to GitHub Pages</b></summary>

A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds the PWA and publishes it on every push to `main`. One-time setup:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source → GitHub Actions.**
3. Push to `main` (or run it manually via **Actions → Deploy to GitHub Pages → Run
   workflow**). The site goes live at `https://<user>.github.io/<repo>/`.

No config changes are needed for a project site: Vite's `base: "./"` and the
manifest's `start_url`/`scope: "./"` are relative, and `config.json` is fetched
relative to the page — so everything resolves correctly under the `/<repo>/` path.
Routing is hash-based (`#s=…` share links), so there's no SPA 404 fallback to
worry about.

**It ties into publishing:** when a manager uses the in-app **Publish** button, it
commits `public/config.json` to `main`, which triggers this workflow to rebuild and
redeploy. Devices pick up the new directory on their next check (~5 min). Point the
managers' repo target at this same repo, path `public/config.json`, branch `main`.

</details>

<details>
<summary><b>Shared directory, access password &amp; PII encryption</b></summary>

The HR and Business tabs read a **shared org directory** from `config.json` —
company info, the employee list, finance/wage policy, schedule assignments,
holidays. Every device fetches it read-only (network-first, cached for offline,
re-checked every ~5 min), so non-managers get updates with **no login**.

### Access gate (shared password)

The whole app sits behind a **shared access password** that every team member is
told *out-of-band* (never committed). On first launch they enter it once; it's
saved to the device and can be replaced by **biometric** (Face ID / fingerprint,
via WebAuthn) on later launches.

> **Default access password: `company1234`.** Change it before real use:
> Management → **Publish → Team access password** → set a new one, then publish.
> (The shipped `public/config.json` carries the `pii` salt + verifier for this
> default.)

### Why the password matters: PII encryption

`config.json` is meant to live in a **public** repo, so employee **phone and email
are encrypted at rest** (AES-GCM, key derived from the access password via
PBKDF2-SHA256; see `src/lib/crypto.ts`). Everything else (names, roles, revenue,
wage multipliers) is public plaintext. The encryption only protects PII from the
*general public* — anyone with the access password can decrypt, by design. The
password is **never** stored in the repo; if it were, it'd be public alongside the
data and the encryption would be pointless.

</details>

<details>
<summary><b>Managers: publishing updates</b></summary>

Reads need nothing. **Writes** use a per-manager **fine-grained GitHub token**
stored **only on that manager's device** — never bundled (the source is public).
In **Management → Publish → Publish to GitHub**:

1. Create a fine-grained PAT: github.com → Settings → Developer settings →
   Fine-grained tokens → *Repository access: only this repo* →
   *Permissions: Contents = Read and write*.
2. Enter `owner` / `repo`, the config path (default `public/config.json`), and
   branch; paste the token and **Save token**.
3. **Publish** — it commits `config.json` (PII encrypted) via the GitHub Contents
   API. Devices pick it up on their next poll (~5 min).

Concurrent edits are conflict-checked (a clear 409 message rather than a clobber).
You can also **Download / Copy** the encrypted JSON and commit it manually. The
admin password gate (`src/lib/auth.ts`, default `admin1234`) is a local UI
deterrent that hides the management tools; the real write authority is possession
of the GitHub token.

</details>

<details>
<summary><b>Tools</b></summary>

- **Calculator** — four-function calculator.
- **Scratchpad** — quick notes, saved on this device.
- **Projects** — a simple kanban board (To do / In progress / Done) with multiple
  projects and an emailed progress report (recipient pulled from the directory).
- **Prompt Builder** — build platform-tuned AI prompts.
- **Management** *(admin)* — edit and publish the whole directory: company info &
  socials, finance/budget policy, employees (role, contact, schedule template or a
  bespoke per-person schedule), default template & holidays, monthly actuals, plus
  the access password and GitHub publish controls.

</details>

<details>
<summary><b>Share links</b></summary>

From **HR → view schedule**, a member's day is compressed into a `#s=…` URL hash —
open that link anywhere for a read-only view (`ShareView`). The encoder
(`src/lib/share.ts`) supports overview / detailed / full detail levels; planning
inputs are author-time config and are never shared. No account, no server; the data
lives entirely in the link.

</details>
