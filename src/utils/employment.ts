const SCHEDULES: readonly EmploymentSchedule[] = ["full-time", "part-time"]

const ARRANGEMENTS: readonly EmploymentArrangement[] = ["contract", "permanent"]

const LABELS: Record<EmploymentSchedule | EmploymentArrangement, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  permanent: "Permanent",
}

type EmploymentOption = { value: string; label: string }

export const isEmploymentSchedule = (
  value: unknown
): value is EmploymentSchedule =>
  SCHEDULES.some((schedule) => schedule === value)

export const isEmploymentArrangement = (
  value: unknown
): value is EmploymentArrangement =>
  ARRANGEMENTS.some((arrangement) => arrangement === value)

export const scheduleOptions: readonly EmploymentOption[] = SCHEDULES.map(
  (value) => ({ value, label: LABELS[value] })
)

export const arrangementOptions: readonly EmploymentOption[] = ARRANGEMENTS.map(
  (value) => ({ value, label: LABELS[value] })
)

type RawExperience = Omit<Experience, "schedule" | "arrangement"> & {
  schedule?: unknown
  arrangement?: unknown
}

// Narrows a JSON-sourced entry (schedule/arrangement inferred as `string`)
// to the literal unions without casts; invalid values become `undefined`.
export const narrowEmployment = (entry: RawExperience): Experience => ({
  ...entry,
  schedule: isEmploymentSchedule(entry.schedule) ? entry.schedule : undefined,
  arrangement: isEmploymentArrangement(entry.arrangement)
    ? entry.arrangement
    : undefined,
})

export const formatEmployment = ({
  schedule,
  arrangement,
}: Pick<Experience, "schedule" | "arrangement">): string | null => {
  const label = [schedule, arrangement]
    .filter(
      (part): part is EmploymentSchedule | EmploymentArrangement => !!part
    )
    .map((part) => LABELS[part])
    .join(" · ")
  return label || null
}
