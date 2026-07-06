const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const isPatchExperience = (
  value: unknown
): value is ResumePatch["work_experience"][number] =>
  typeof value === "object" &&
  value !== null &&
  "index" in value &&
  typeof value.index === "number" &&
  "achievements" in value &&
  isStringArray(value.achievements)

// Guards the model's JSON output before it is merged over the base resume.
export function isResumePatch(value: unknown): value is ResumePatch {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string" &&
    "summary" in value &&
    typeof value.summary === "string" &&
    "technical_skills" in value &&
    isStringArray(value.technical_skills) &&
    "work_experience" in value &&
    Array.isArray(value.work_experience) &&
    value.work_experience.every(isPatchExperience) &&
    "suggestedName" in value &&
    typeof value.suggestedName === "string"
  )
}

// Merges the sparse model output over the base resume. The model only
// returns the tailored fields (see PATCH_SCHEMA in prompt.ts) so generations
// stay small enough to finish inside Netlify's function time limit.
export function applyResumePatch(base: Data, patch: ResumePatch): Data {
  // Map construction lets a later duplicate index win, and out-of-range
  // indices simply never match a base entry.
  const achievementsByIndex = new Map(
    patch.work_experience.map(({ index, achievements }) => [
      index,
      achievements,
    ])
  )
  const work_experience = base.work_experience.map((exp, i) => ({
    ...exp,
    achievements: [...(achievementsByIndex.get(i) ?? exp.achievements)],
  }))

  // Descriptions come from the base resume so they can never fall out of
  // alignment with the model's skill selection.
  const descriptionBySkill = new Map(
    base.technical_skills.map((skill, i) => [
      skill,
      base.skill_descriptions[i] ?? "",
    ])
  )

  return {
    ...base,
    title: patch.title,
    summary: patch.summary,
    technical_skills: patch.technical_skills,
    skill_descriptions: patch.technical_skills.map(
      (skill) => descriptionBySkill.get(skill) ?? ""
    ),
    work_experience,
  }
}
