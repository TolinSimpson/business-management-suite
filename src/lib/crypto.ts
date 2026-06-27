// PII encryption for the public org directory (config.json).
//
// config.json is published to a PUBLIC repo, so sensitive employee fields
// (phone, email) must not sit there as plaintext. We encrypt them with AES-GCM
// under a key derived (PBKDF2-SHA256) from a *shared access password* that every
// team member is told out-of-band and saves to their device. That password is
// NEVER committed to the repo — if it were, it would be public alongside the
// data and the encryption would be pointless. Public fields (names, roles, pay
// policy) stay plaintext.
//
// Threat model: this keeps the general public / search engines / scrapers out of
// the PII. It does NOT protect against a team member who shares the password —
// by design everyone with the app can decrypt. For per-user access control you
// need a real backend.

const PBKDF2_ITERATIONS = 210_000;
const ENC_PREFIX = "enc:v1";
// A constant the verifier encrypts to; decrypting it back proves the key (and
// therefore the typed password) is correct, without storing a hash that could be
// brute-forced offline against the low-entropy shared password.
const VERIFY_TOKEN = "schedule-pii-ok";

// ---- base64url helpers (kept local so this module stands alone) -------------

function toB64url(buf: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function rand(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(a);
  return a;
}

/** A fresh random salt (base64url) to embed in a new config.json. */
export function newSalt(): string {
  return toB64url(rand(16).buffer);
}

/** True if a stored field value is an encrypted blob (vs plaintext / empty). */
export function isEncrypted(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX + ":");
}

/** Derive the AES-GCM key from the shared password + the config's public salt. */
export async function deriveKey(password: string, saltB64url: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64url(saltB64url), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt one field → "enc:v1:<iv>:<ciphertext>". Empty input stays empty. */
export async function encryptField(key: CryptoKey, plaintext: string): Promise<string> {
  if (!plaintext) return "";
  const iv = rand(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${ENC_PREFIX}:${toB64url(iv.buffer)}:${toB64url(ct)}`;
}

/**
 * Decrypt a field. Plaintext or empty values pass through unchanged so legacy
 * configs and intentionally-public fields still work. Returns "" on a bad key /
 * corrupt blob rather than throwing, so one bad field can't break the directory.
 */
export async function decryptField(key: CryptoKey, value: string | undefined): Promise<string> {
  if (!value) return "";
  if (!isEncrypted(value)) return value; // plaintext / legacy
  const parts = value.split(":");
  if (parts.length !== 4) return "";
  try {
    const iv = fromB64url(parts[2]);
    const ct = fromB64url(parts[3]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return "";
  }
}

/** Make the verifier blob to store in config.json (encrypts a known token). */
export function makeVerifier(key: CryptoKey): Promise<string> {
  return encryptField(key, VERIFY_TOKEN);
}

/** True if `key` (from the typed password) decrypts the config's verifier blob. */
export async function checkVerifier(key: CryptoKey, verifier: string | undefined): Promise<boolean> {
  if (!verifier) return true; // no PII configured yet → nothing to verify against
  return (await decryptField(key, verifier)) === VERIFY_TOKEN;
}
