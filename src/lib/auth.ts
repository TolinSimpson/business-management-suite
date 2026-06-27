// Admin gate for management tools.
//
// SECURITY NOTE: this is a client-side gate — the password hash ships in the
// bundle and a determined user can bypass it in devtools. It is a deterrent
// that keeps management tools out of casual reach, not real authentication.
// For genuine access control, verify against a backend.
//
// The unlock methods are (1) the admin password, checked against the hardcoded
// SHA-256 hash below, or (2) the device biometric (see lib/biometric.ts).
//
// Default password: "admin1234". To change it, run:
//   node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
// and paste the result into ADMIN_HASH.
const ADMIN_HASH = "ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** True if `password` matches the hardcoded admin hash. */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    return (await sha256hex(password)) === ADMIN_HASH;
  } catch {
    return false;
  }
}
