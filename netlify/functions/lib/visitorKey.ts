// Turns a caller IP into a stable, non-reversible counter key for chatUsage.ts.
// Salted so the hash can never be correlated back to an IP without the
// server-side secret, and truncated because a full SHA-256 hex digest is
// longer than any Blobs key needs to be.
import { createHash } from "node:crypto"

const KEY_LENGTH = 32

export function visitorKey({ ip, salt }: { ip: string; salt: string }): string {
  return createHash("sha256")
    .update(`${salt}${ip}`)
    .digest("hex")
    .slice(0, KEY_LENGTH)
}
