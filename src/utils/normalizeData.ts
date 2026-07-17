import { resumeData } from "@data/resumeData"

type LegacyContact = {
  email?: string
  phone?: string
  location?: string
  github?: string
  linkedin?: string
}

const LEGACY_CONTACT_ORDER: [keyof LegacyContact, string][] = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["github", "GitHub"],
  ["linkedin", "LinkedIn"],
]

// Variations saved before the contact-list migration store `contact` as a
// keyed object; convert it to the ordered entry list the app now expects.
function normalizeContact(data: Data): Data {
  if (Array.isArray(data.contact)) return data
  const legacy = data.contact as unknown as LegacyContact
  const contact: ContactEntry[] = LEGACY_CONTACT_ORDER.flatMap(
    ([key, label]) => {
      const value = legacy[key]
      return value ? [{ label, value }] : []
    }
  )
  return { ...data, contact }
}

const stintKey = ({
  company,
  period,
}: Pick<Experience, "company" | "period">) => `${company}|${period}`

const employmentByStint = new Map(
  resumeData.work_experience.map((entry) => [stintKey(entry), entry])
)

// Variations saved before the employment fields existed carry none; fill
// them from the matching base-resume stint so old data gains the labels.
// Values a variation already set always win.
function backfillEmployment(data: Data): Data {
  return {
    ...data,
    work_experience: data.work_experience.map((entry) => {
      const base = employmentByStint.get(stintKey(entry))
      return {
        ...entry,
        schedule: entry.schedule ?? base?.schedule,
        arrangement: entry.arrangement ?? base?.arrangement,
      }
    }),
  }
}

export function normalizeData(data: Data): Data {
  return backfillEmployment(normalizeContact(data))
}
