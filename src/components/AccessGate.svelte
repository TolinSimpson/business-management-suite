<script lang="ts">
  // Full-screen access gate. Nothing else in the app renders until the shared
  // access password (or device biometric) unlocks it. The password derives the
  // key that decrypts employee contact details from the public config.json.
  import { unlock, verifyPassword, savedPassword } from "../lib/access";
  import {
    isBiometricSupported,
    hasBiometric,
    registerBiometric,
    verifyBiometric,
  } from "../lib/biometric";

  // salt + verifier come from the published config.json (config.pii).
  let { salt, verifier }: { salt: string; verifier: string } = $props();

  let password = $state("");
  let error = $state("");
  let busy = $state(false);
  // After a correct password, offer to enrol this device's biometric before we
  // commit the unlock (committing unmounts this gate).
  let offerEnrol = $state(false);
  let pending = ""; // the validated password held until enrol choice / commit

  const saved = savedPassword();
  const canBiometric = isBiometricSupported() && hasBiometric() && !!saved;
  const canEnrol = isBiometricSupported() && !hasBiometric();

  /** Commit the unlock with the validated password (derives + holds the key). */
  async function commit() {
    await unlock(pending, salt, verifier, true);
    // `unlocked` flips → App stops rendering this gate.
  }

  async function tryPassword() {
    busy = true;
    error = "";
    const ok = await verifyPassword(password, salt, verifier);
    if (!ok) {
      busy = false;
      password = "";
      error = "Incorrect access password.";
      return;
    }
    pending = password;
    password = "";
    if (canEnrol) {
      busy = false;
      offerEnrol = true;
    } else {
      await commit();
    }
  }

  async function unlockBiometric() {
    busy = true;
    error = "";
    const ok = await verifyBiometric();
    if (ok && saved) {
      await unlock(saved, salt, verifier, true);
    } else {
      busy = false;
      error = "Biometric unlock failed or was cancelled.";
    }
  }

  async function enrol() {
    busy = true;
    await registerBiometric("access");
    await commit();
  }
</script>

<div class="gate-screen">
  <div class="gate card">
    {#if offerEnrol}
      <h3>Enable quick unlock?</h3>
      <p class="muted" style="margin-top:0;font-size:.85rem">
        Use this device's fingerprint or Face ID next time instead of typing the password.
      </p>
      <button class="primary" disabled={busy} onclick={enrol} style="width:100%">
        Enable biometric
      </button>
      <div style="height:8px"></div>
      <button disabled={busy} onclick={commit} style="width:100%">Skip</button>
    {:else}
      <h3 style="margin-top:0">Enter access password</h3>
      <p class="muted" style="margin-top:0;font-size:.85rem">
        This app is for team members. Enter the shared password to continue — it's
        saved to this device so you only do this once.
      </p>

      {#if canBiometric}
        <button class="primary" disabled={busy} onclick={unlockBiometric} style="width:100%">
          Unlock with biometrics
        </button>
        <div class="gate-or">or</div>
      {/if}

      <label for="access-pw">Access password</label>
      <input
        id="access-pw"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        onkeydown={(e) => e.key === "Enter" && password && tryPassword()}
        placeholder="••••••••"
      />
      <div style="height:10px"></div>
      <button class="primary" disabled={busy || !password} onclick={tryPassword} style="width:100%">
        {busy ? "Checking…" : "Unlock"}
      </button>
    {/if}

    {#if error}<p class="muted" style="color:#e57373;font-size:.8rem;margin-bottom:0">{error}</p>{/if}
  </div>
</div>

<style>
  .gate-screen {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--bg, #111);
  }
  .gate {
    width: var(--modal-w, 360px);
    max-width: 100%;
    margin: 0;
  }
  .gate-or {
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
    margin: 10px 0;
  }
</style>
