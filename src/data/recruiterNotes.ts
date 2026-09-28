import raw from "@data/recruiterNotes.json"

type RecruiterOverlapNote = {
  companies: [string, string]
  note: string
}

type RecruiterFact = {
  topic: string
  answer: string
}

type RecruiterNotes = {
  overlaps: RecruiterOverlapNote[]
  facts: RecruiterFact[]
}

function isOverlapEntry(value: unknown): value is RecruiterOverlapNote {
  if (typeof value !== "object" || value === null) return false
  if (!("companies" in value) || !("note" in value)) return false

  const { companies, note } = value
  if (
    !Array.isArray(companies) ||
    companies.length !== 2 ||
    !companies.every((company: unknown) => typeof company === "string")
  ) {
    return false
  }
  return typeof note === "string"
}

function isFactEntry(value: unknown): value is RecruiterFact {
  if (typeof value !== "object" || value === null) return false
  if (!("topic" in value) || !("answer" in value)) return false

  const { topic, answer } = value
  return typeof topic === "string" && typeof answer === "string"
}

// Narrows JSON-sourced notes to the literal shape without casts
export const isRecruiterNotes = (value: unknown): value is RecruiterNotes => {
  if (typeof value !== "object" || value === null) return false
  if (!("overlaps" in value) || !Array.isArray(value.overlaps)) return false
  if (!value.overlaps.every(isOverlapEntry)) return false
  if (!("facts" in value) || !Array.isArray(value.facts)) return false
  if (!value.facts.every(isFactEntry)) return false

  // Reject any shape carrying more than these two known keys.
  const keys = Object.keys(value)
  return (
    keys.length === 2 && keys.includes("overlaps") && keys.includes("facts")
  )
}

if (!isRecruiterNotes(raw)) {
  throw new Error("recruiterNotes.json failed validation")
}

export const recruiterNotes: RecruiterNotes = raw
