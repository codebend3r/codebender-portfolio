import raw from "@data/recruiterNotes.json"

type RecruiterNotes = {
  overlaps: Array<{
    companies: [string, string]
    note: string
  }>
  facts: Array<{
    topic: string
    answer: string
  }>
}

type RawRecruiterNotes = unknown

// Narrows JSON-sourced notes to the literal shape without casts
export const isRecruiterNotes = (
  value: RawRecruiterNotes
): value is RecruiterNotes => {
  if (typeof value !== "object" || value === null) return false

  // Check overlaps
  if (!("overlaps" in value)) return false
  if (!Array.isArray(value.overlaps)) return false
  if (
    !value.overlaps.every((item: unknown) => {
      if (typeof item !== "object" || item === null) return false
      if (!("companies" in item) || !("note" in item)) return false

      // companies must be an array of exactly 2 strings
      if (
        !Array.isArray(item.companies) ||
        item.companies.length !== 2 ||
        !item.companies.every((c: unknown) => typeof c === "string")
      ) {
        return false
      }

      // note must be a string
      if (typeof item.note !== "string") return false

      return true
    })
  ) {
    return false
  }

  // Check facts
  if (!("facts" in value)) return false
  if (!Array.isArray(value.facts)) return false
  if (
    !value.facts.every((item: unknown) => {
      if (typeof item !== "object" || item === null) return false
      if (!("topic" in item) || !("answer" in item)) return false

      // topic and answer must be strings
      if (typeof item.topic !== "string" || typeof item.answer !== "string") {
        return false
      }

      return true
    })
  ) {
    return false
  }

  // Ensure only overlaps and facts keys are present
  const keys = Object.keys(value)
  if (
    keys.length !== 2 ||
    !keys.includes("overlaps") ||
    !keys.includes("facts")
  ) {
    return false
  }

  return true
}

export const recruiterNotes: RecruiterNotes = isRecruiterNotes(raw)
  ? raw
  : (() => {
      throw new Error("recruiterNotes.json failed validation")
    })()
