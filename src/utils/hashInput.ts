/**
 * Stable content hash of a generation input.
 *
 * Same input + mode → same hash, used by the generate pages to dedupe
 * variations. SHA-256 over a normalized string, truncated to 12 hex chars.
 */
export async function hashInput({
  input,
  mode = "proximate",
}: {
  input: GenerateInput
  mode?: GenerateMode
}): Promise<string> {
  const content =
    input.type === "text"
      ? `text:${input.text.trim()}`
      : input.type === "url"
        ? `url:${input.url.trim()}`
        : `image:${input.dataBase64}`
  // "proximate" keeps the historical un-prefixed format so variations
  // stored before modes existed still dedupe against it.
  const normalized = mode === "proximate" ? content : `${mode}:${content}`
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12)
}
