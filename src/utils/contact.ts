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
