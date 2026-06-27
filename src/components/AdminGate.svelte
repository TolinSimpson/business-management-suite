<script lang="ts">
  import { adminUnlock } from "../lib/state";
  import { verifyPassword } from "../lib/auth";
  import {
    isBiometricSupported,
    hasBiometric,
    registerBiometric,
    verifyBiometric,
  } from "../lib/biometric";

  let { onClose }: { onClose: () => void } = $props();

  let password = $state("");
  let error = $state("");
  let busy = $state(false);
  // After a correct password we offer to enrol the device biometric.
  let offerEnrol = $state(false);

  const canBiometric = isBiometricSupported() && hasBiometric();
  const canEnrol = isBiometricSupported() && !hasBiometric();

  async function tryPassword() {
    busy = true;
    error = "";
    const ok = await verifyPassword(password);
    busy = false;
    password = "";
    if (!ok) {
      error = "Incorrect password.";
      return;
    }
    if (canEnrol) offerEnrol = true; // unlock after the enrol choice
    else finish();
  }

  async function unlockBiometric() {
    busy = true;
    error = "";
    const ok = await verifyBiometric();
    busy = false;
    if (ok) finish();
    else error = "Biometric unlock failed or was cancelled.";
  }

  async function enrol() {
    busy = true;
    await registerBiometric("admin");
    busy = false;
    finish();
  }

  function finish() {
    adminUnlock();
    onClose();
  }
</script>

<div
  class="gate-backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>

<div class="gate card" role="dialog" aria-modal="true" aria-label="Admin sign-in">
  {#if offerEnrol}
    <h3>Enable quick unlock?</h3>
    <p class="muted" style="margin-top:0;font-size:.85rem">
      Use this device's fingerprint or Face ID next time instead of the password.
    </p>
    <button class="primary" disabled={busy} onclick={enrol}>Enable biometric</button>
    <button disabled={busy} onclick={finish}>Skip</button>
  {:else}
    <h3>Admin sign-in</h3>
    <p class="muted" style="margin-top:0;font-size:.85rem">Management tools are locked.</p>

    {#if canBiometric}
      <button class="primary" disabled={busy} onclick={unlockBiometric} style="width:100%">
        Unlock with biometrics
      </button>
      <div class="gate-or">or</div>
    {/if}

    <label for="admin-pw">Admin password</label>
    <input
      id="admin-pw"
      type="password"
      bind:value={password}
      onkeydown={(e) => e.key === "Enter" && tryPassword()}
      placeholder="••••••••"
    />
    <div style="height:10px"></div>
    <div class="row-actions">
      <button onclick={onClose}>Cancel</button>
      <button class="primary" disabled={busy || !password} onclick={tryPassword}>
        {busy ? "Checking…" : "Unlock"}
      </button>
    </div>
  {/if}

  {#if error}<p class="muted" style="color:#e57373;font-size:.8rem;margin-bottom:0">{error}</p>{/if}
</div>

<style>
  .gate-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }
  .gate {
    position: fixed;
    z-index: 51;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: var(--modal-w);
    margin: 0;
  }
  .gate-or {
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
    margin: 10px 0;
  }
</style>
