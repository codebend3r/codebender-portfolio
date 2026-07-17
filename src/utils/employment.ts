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
