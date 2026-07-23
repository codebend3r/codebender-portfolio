import {
  isEmploymentArrangement,
  isEmploymentSchedule,
} from "@utils/employment"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

// Each helper returns `null` when the field is valid, or a human-readable
// message describing the first problem. `firstError` walks the whole `Data`
// shape and returns the first message it finds, or `null` for a valid resume.

function stringFieldError(
  record: Record<string, unknown>,
  key: string
): string | null {
  return typeof record[key] === "string" ? null : `"${key}" must be a string`
}

function stringArrayFieldError(
  record: Record<string, unknown>,
  key: string
): string | null {
  return isStringArray(record[key])
    ? null
    : `"${key}" must be an array of strings`
}

function objectArrayFieldError(
  record: Record<string, unknown>,
  key: string,
  itemError: (item: Record<string, unknown>) => string | null
): string | null {
  const list = record[key]
  if (!Array.isArray(list)) return `"${key}" must be an array`
  return list.reduce<string | null>((found, item, i) => {
    if (found !== null) return found
    if (!isRecord(item)) return `"${key}[${i}]" must be an object`
    const message = itemError(item)
    return message === null ? null : `"${key}[${i}]" ${message}`
  }, null)
}

function contactItemError(item: Record<string, unknown>): string | null {
  if (typeof item.label !== "string") return "label must be a string"
  if (typeof item.value !== "string") return "value must be a string"
  return null
}

function experienceItemError(item: Record<string, unknown>): string | null {
  if (typeof item.role !== "string") return "role must be a string"
  if (typeof item.company !== "string") return "company must be a string"
  if (typeof item.period !== "string") return "period must be a string"
  if (!isStringArray(item.achievements)) {
    return "achievements must be an array of strings"
  }
  if (item.schedule !== undefined && !isEmploymentSchedule(item.schedule)) {
    return 'schedule must be "full-time" or "part-time"'
  }
  if (
    item.arrangement !== undefined &&
    !isEmploymentArrangement(item.arrangement)
  ) {
    return 'arrangement must be "contract" or "permanent"'
  }
  return null
}

function awardItemError(item: Record<string, unknown>): string | null {
  if (typeof item.name !== "string") return "name must be a string"
  if (typeof item.organization !== "string") {
    return "organization must be a string"
  }
  if (typeof item.year !== "number") return "year must be a number"
  return null
}

function languageItemError(item: Record<string, unknown>): string | null {
  if (typeof item.name !== "string") return "name must be a string"
  if (typeof item.proficiency !== "string") {
    return "proficiency must be a string"
  }
  return null
}

function educationItemError(item: Record<string, unknown>): string | null {
  if (typeof item.program !== "string") return "program must be a string"
  if (typeof item.institution !== "string") {
    return "institution must be a string"
  }
  if (item.details !== undefined && typeof item.details !== "string") {
    return "details must be a string when present"
  }
  return null
}

function showcaseItemError(item: Record<string, unknown>): string | null {
  const stringKeys = [
    "name",
    "domain",
    "url",
    "role",
    "period",
    "description",
    "image",
  ]
  const missing = stringKeys.find((key) => typeof item[key] !== "string")
  if (missing !== undefined) return `${missing} must be a string`
  if (item.repo !== undefined && typeof item.repo !== "string") {
    return "repo must be a string when present"
  }
  if (!isStringArray(item.tags)) return "tags must be an array of strings"
  return null
}

// Returns the first structural problem in `value`, or `null` when it is a
// complete, correctly typed resume. Optional fields (`schedule`,
// `arrangement`, `education.details`, `showcase.repo`) may be absent but
// must be valid when present. Unknown extra keys are ignored.
export function firstError(value: unknown): string | null {
  if (!isRecord(value)) return "Resume must be a JSON object"
  return (
    stringFieldError(value, "name") ??
    stringFieldError(value, "title") ??
    stringFieldError(value, "summary") ??
    objectArrayFieldError(value, "contact", contactItemError) ??
    stringArrayFieldError(value, "technical_skills") ??
    stringArrayFieldError(value, "skill_descriptions") ??
    stringArrayFieldError(value, "soft_skills") ??
    objectArrayFieldError(value, "work_experience", experienceItemError) ??
    objectArrayFieldError(value, "awards", awardItemError) ??
    objectArrayFieldError(value, "languages", languageItemError) ??
    objectArrayFieldError(value, "education", educationItemError) ??
    objectArrayFieldError(value, "showcase", showcaseItemError)
  )
}

export function isData(value: unknown): value is Data {
  return firstError(value) === null
}

type ValidationResult = { ok: true; data: Data } | { ok: false; error: string }

// Parses nothing itself — `value` is already-parsed JSON. Narrows it to
// `Data` (no cast) via the `isData` guard, or returns the first error message.
export function validateData(value: unknown): ValidationResult {
  if (isData(value)) return { ok: true, data: value }
  return { ok: false, error: firstError(value) ?? "Invalid resume data" }
}
