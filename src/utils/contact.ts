export function isUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function isEmail(value: string) {
  return !isUrl(value) && value.includes("@")
}

export function isPhone(value: string) {
  return /^[\d\s()+.-]+$/.test(value.trim()) && /\d/.test(value)
}

// Maps a contact entry's raw value to an anchor href, or null when the value
// is plain text (e.g. a location) and should not be linked.
export function contactHref(value: string): string | null {
  if (isUrl(value)) return value
  if (isEmail(value)) return `mailto:${value}`
  if (isPhone(value)) return `tel:${value}`
  return null
}

export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export type ContactIconKind = "github" | "linkedin" | "site" | "email" | "phone"

// Mirrors Header.tsx's ContactIcon dispatch, used by the PDF/Word exporters
// to decide which contact entries render as icons instead of text.
export function contactIconKind(value: string): ContactIconKind | null {
  if (value.includes("github.com")) return "github"
  if (value.includes("linkedin.com")) return "linkedin"
  if (isUrl(value)) return "site"
  if (isEmail(value)) return "email"
  if (isPhone(value)) return "phone"
  return null
}

// The PDF/Word contact bar groups entries into two clusters: direct contact
// methods (icon + readable value, e.g. "you@example.com") on one side, and
// icon-only web/social links on the other.
export function isDirectContactKind(
  kind: ContactIconKind | null
): kind is "email" | "phone" {
  return kind === "email" || kind === "phone"
}

export function isSocialContactKind(
  kind: ContactIconKind | null
): kind is "github" | "linkedin" | "site" {
  return kind === "github" || kind === "linkedin" || kind === "site"
}

// A contact entry is hidden from exported documents (PDF/Word) when its
// label is "Location" — the live site still shows it in Header.tsx.
export function isLocationEntry(entry: ContactEntry): boolean {
  return entry.label.toLowerCase() === "location"
}
