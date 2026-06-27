// App-access gate state + the live PII decryption key.
//
// Every team member is told the shared access password out-of-band and enters it
// once; it's saved to this device and derives the AES key that decrypts employee
// phone/email from the public config.json (see lib/crypto.ts). Managers reuse
// the same in-memory key to *encrypt* PII when they publish.
//
// This module intentionally does NOT import lib/config.ts (config.ts imports
// `piiKey` from here) — App.svelte feeds the config's salt/verifier in.

import { writable } from "svelte/store";
import { deriveKey, checkVerifier, makeVerifier, newSalt } from "./crypto";

const PW_KEY = "schedule-access-pw-v1";

/** The derived AES-GCM key while unlocked, else null. Consumed by config.ts. */
export const piiKey = writable<CryptoKey | null>(null);

/** True once the user is past the access gate this session (or no gate exists). */
export const unlocked = writable(false);

/** The shared password saved on this device, if the user chose to remember it. */
export function savedPassword(): string | null {
  try {
    return localStorage.getItem(PW_KEY);
  } catch {
    return null;
  }
}

function remember(password: string): void {
  try {
    localStorage.setItem(PW_KEY, password);
  } catch {
    /* storage unavailable — they'll just re-enter it next launch */
  }
}

/**
 * Verify `password` against the config's salt+verifier. On success, derive and
 * hold the key, optionally save the password, and unlock. Returns false on a
 * wrong password (nothing is stored, the gate stays up).
 */
export async function unlock(
  password: string,
  salt: string,
  verifier: string,
  save = true
): Promise<boolean> {
  const key = await deriveKey(password, salt);
  if (!(await checkVerifier(key, verifier))) return false;
  if (save) remember(password);
  piiKey.set(key);
  unlocked.set(true);
  return true;
}

/**
 * Check a password without committing (no key held, no save, no unlock). Used by
 * the gate to validate before offering biometric enrolment, so we don't unlock —
 * and unmount the gate — before the user makes that choice.
 */
export async function verifyPassword(
  password: string,
  salt: string,
  verifier: string
): Promise<boolean> {
  const key = await deriveKey(password, salt);
  return checkVerifier(key, verifier);
}

/**
 * First-time setup by a manager: pick a brand-new shared password. Generates a
 * fresh salt + verifier (to write into config.json), holds the key, saves the
 * password, and unlocks this session. Returns the pieces config.json must store.
 */
export async function setupAccess(password: string): Promise<{ salt: string; verifier: string }> {
  const salt = newSalt();
  const key = await deriveKey(password, salt);
  const verifier = await makeVerifier(key);
  remember(password);
  piiKey.set(key);
  unlocked.set(true);
  return { salt, verifier };
}

/** Forget the saved password and re-lock (used by a "lock"/"sign out" action). */
export function lock(): void {
  try {
    localStorage.removeItem(PW_KEY);
  } catch {
    /* ignore */
  }
  piiKey.set(null);
  unlocked.set(false);
}

/** No PII is configured yet → there's nothing to gate; open the app. */
export function openWithoutGate(): void {
  piiKey.set(null);
  unlocked.set(true);
}
