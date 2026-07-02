// Collapses a display name into a lowercase underscore slug suitable for a
// filename; falls back to "resume" when nothing survives.
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "resume"
  )
}
