// Local biometric unlock (fingerprint / Face ID) via WebAuthn's platform
// authenticator. Serverless: we register a platform credential and require a
// successful user-verifying assertion to unlock. There is no server to verify
// the signature cryptographically, so this gates *this device* — pair with a
// backend for cross-device trust. On a phone this is the natural replacement
// for the emailed magic link.

const CRED_KEY = "schedule-manage-cred";

interface StoredCred {
  id: string; // base64url rawId
  email: string;
}

export function isBiometricSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

function rand(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(a);
  return a;
}

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

function stored(): StoredCred | null {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    return raw ? (JSON.parse(raw) as StoredCred) : null;
  } catch {
    return null;
  }
}

export function hasBiometric(): boolean {
  return stored() !== null;
}

export function biometricEmail(): string | null {
  return stored()?.email ?? null;
}

export function clearBiometric(): void {
  localStorage.removeItem(CRED_KEY);
}

/** Register the phone's biometric as a sign-in method for `email`. */
export async function registerBiometric(email: string): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: "Schedule", id: location.hostname },
        user: { id: rand(16), name: email, displayName: email },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    localStorage.setItem(CRED_KEY, JSON.stringify({ id: toB64url(cred.rawId), email } satisfies StoredCred));
    return true;
  } catch {
    return false;
  }
}

/** Prompt for the biometric and return true on a successful user-verified unlock. */
export async function verifyBiometric(): Promise<boolean> {
  const cred = stored();
  if (!isBiometricSupported() || !cred) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: rand(32),
        allowCredentials: [{ type: "public-key", id: fromB64url(cred.id) }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
