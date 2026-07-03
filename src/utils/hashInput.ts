/**
 * Stable content hash of a generation input.
 *
 * Same input → same hash, used by /generate to dedupe variations.
 * SHA-256 over a normalized string, truncated to 12 hex chars.
 */
export async function hashInput(input: GenerateInput): Promise<string> {
  const normalized =
    input.type === "text"
      ? `text:${input.text.trim()}`
      : input.type === "url"
        ? `url:${input.url.trim()}`
        : `image:${input.dataBase64}`
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12)
}
